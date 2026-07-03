#!/usr/bin/env python3
"""Build deterministic prompts for IPD task subagents."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

import workflow_brief
import workflow_state


class PromptBuildError(RuntimeError):
    """Raised when a subagent prompt cannot be built safely."""


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
SUBAGENT_SKILL_DIR = REPO_ROOT / "skills" / "subagent-driven-development"
CODE_REVIEWER_TEMPLATE = REPO_ROOT / "skills" / "requesting-code-review" / "code-reviewer.md"
TASK_HEADING_RE = re.compile(r"^## (?P<title>.*?\b(?P<task>TASK-\d+)\b.*?)\s*$", re.MULTILINE)
SECTION_HEADING_RE = re.compile(r"^## (?!#).*$", re.MULTILINE)


def sha256_text(text: str) -> str:
    return f"sha256:{hashlib.sha256(text.encode('utf-8')).hexdigest()}"


def read_fenced_text(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.find("```text\n")
    if start == -1:
        raise PromptBuildError(f"prompt template has no text fence: {path}")
    start += len("```text\n")
    end = text.find("\n```", start)
    if end == -1:
        raise PromptBuildError(f"prompt template text fence is not closed: {path}")
    return text[start:end].rstrip()


def read_after_fence(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    marker = "\n```\n"
    end = text.find(marker)
    if end == -1:
        return ""
    return text[end + len(marker) :].strip()


def extract_task_section(ipd_text: str, task: str) -> tuple[str, str]:
    matches = list(TASK_HEADING_RE.finditer(ipd_text))
    for match in matches:
        if match.group("task") != task:
            continue
        start = match.start()
        next_section = SECTION_HEADING_RE.search(ipd_text, match.end())
        end = next_section.start() if next_section else len(ipd_text)
        section = ipd_text[start:end].strip()
        title = match.group("title").strip()
        return title, section
    raise PromptBuildError(f"requested task {task} was not found in IPD")


def review_input_failures(args: argparse.Namespace) -> list[str]:
    failures: list[str] = []
    emits_review_prompts = args.kind in {"spec-reviewer", "code-quality-reviewer"} or (args.kind == "all" and args.json)
    if not emits_review_prompts:
        return failures
    if args.implementer_report == "[待实现子代理回报后填入]":
        failures.append("--implementer-report is required for review prompts")
    emits_code_quality_prompt = args.kind in {"all", "code-quality-reviewer"}
    if emits_code_quality_prompt:
        if args.base_sha == "[commit before task]":
            failures.append("--base-sha is required for code-quality-reviewer prompts")
        if args.head_sha == "[current commit]":
            failures.append("--head-sha is required for code-quality-reviewer prompts")
    return failures


def compact_task_name(title: str, task: str) -> str:
    cleaned = re.sub(rf"[（(]\s*{re.escape(task)}\s*/.*?[）)]", "", title).strip()
    cleaned = re.sub(rf"\b{re.escape(task)}\b", "", cleaned).strip(" -:/")
    return cleaned or task


def build_context_block(brief: dict[str, Any], *, ipd_path: str, source_hash: str, task: str) -> str:
    must_read = "\n".join(f"- {path}" for path in brief["must_read"] or ["-"])
    may_skip = "\n".join(f"- {path}" for path in brief["may_skip"] or ["-"])
    focus_sections = "\n".join(f"- {section}" for section in brief["focus_sections"] or ["-"])
    return f"""IPD path: {ipd_path}
IPD source_hash: {source_hash}
Brief command: python3 scripts/workflow_brief.py --task {task} --feature {brief['feature']} --doc-id {brief['doc_id']} --target execute --json
Execution source: {brief['execution_source']}
New plan policy: {brief['new_plan_policy']}

Must read:
{must_read}

May skip unless rewind triggers fire:
{may_skip}

Focus sections:
{focus_sections}

Context rule: 不得自行读取完整 IPD 或上游 PRD/TDD/TID/TCD；只按主代理粘贴的任务全文、执行锁定区摘要和必要上下文执行。若 Rewind Triggers 命中或上下文不足，返回 NEEDS_CONTEXT。"""


def build_implementer_prompt(
    *,
    task: str,
    task_name: str,
    task_section: str,
    context: str,
    workdir: str,
) -> str:
    template = read_fenced_text(SUBAGENT_SKILL_DIR / "implementer-prompt.md")
    prompt = template.replace("任务 N: [task name]", f"任务 {task}: {task_name}")
    prompt = prompt.replace("[FULL TEXT of task from plan - 粘贴在这里，不要让子代理自己读文件]", task_section)
    prompt = prompt.replace("[说明该任务在整体中的位置、依赖、架构背景]", context)
    prompt = prompt.replace("工作目录：[directory]", f"工作目录：{workdir}")
    return prompt


def build_spec_reviewer_prompt(
    *,
    task: str,
    task_section: str,
    implementer_report: str,
) -> str:
    template = read_fenced_text(SUBAGENT_SKILL_DIR / "spec-reviewer-prompt.md")
    prompt = template.replace("Review spec compliance for 任务 N", f"Review spec compliance for 任务 {task}")
    prompt = prompt.replace("[FULL TEXT of task requirements]", task_section)
    prompt = prompt.replace("[From implementer's report]", implementer_report)
    return prompt


def build_code_quality_prompt(
    *,
    task: str,
    task_name: str,
    task_section: str,
    implementer_report: str,
    base_sha: str,
    head_sha: str,
) -> str:
    template = read_fenced_text(CODE_REVIEWER_TEMPLATE)
    description = implementer_report.strip() or f"任务 {task}: {task_name}"
    requirements = f"任务 {task}: {task_name}\n\n{task_section}"
    prompt = template.replace("{DESCRIPTION}", description)
    prompt = prompt.replace("{PLAN_OR_REQUIREMENTS}", requirements)
    prompt = prompt.replace("{BASE_SHA}", base_sha)
    prompt = prompt.replace("{HEAD_SHA}", head_sha)
    extra = read_after_fence(SUBAGENT_SKILL_DIR / "code-quality-reviewer-prompt.md")
    if extra:
        prompt = f"{prompt}\n\n## 子代理代码质量补充检查\n\n{extra}"
    return prompt


def build_prompts(
    root: Path | str,
    *,
    feature: str,
    doc_id: str,
    task: str,
    workdir: str | None = None,
    implementer_report: str = "[待实现子代理回报后填入]",
    base_sha: str = "[commit before task]",
    head_sha: str = "[current commit]",
) -> dict[str, Any]:
    root_path = Path(root)
    brief = workflow_brief.build_brief(root_path, feature=feature, doc_id=doc_id, target="execute", task=task)
    if not brief["pass"]:
        failures = "; ".join(brief["failures"]) or brief["reason"]
        raise PromptBuildError(f"workflow brief did not pass: {failures}")
    if not brief["must_read"]:
        raise PromptBuildError("workflow brief did not identify an IPD path")

    ipd_rel = brief["must_read"][0]
    ipd_path = root_path / ipd_rel
    ipd_text = ipd_path.read_text(encoding="utf-8")
    task_title, task_section = extract_task_section(ipd_text, task)
    task_name = compact_task_name(task_title, task)
    source_hash = workflow_state.parse_frontmatter(ipd_path).get("source_hash")
    if not source_hash:
        raise PromptBuildError("IPD source_hash is missing")

    context = build_context_block(brief, ipd_path=ipd_rel, source_hash=source_hash, task=task)
    resolved_workdir = workdir or str(root_path)
    prompts = {
        "implementer": build_implementer_prompt(
            task=task,
            task_name=task_name,
            task_section=task_section,
            context=context,
            workdir=resolved_workdir,
        ),
        "spec-reviewer": build_spec_reviewer_prompt(
            task=task,
            task_section=task_section,
            implementer_report=implementer_report,
        ),
        "code-quality-reviewer": build_code_quality_prompt(
            task=task,
            task_name=task_name,
            task_section=task_section,
            implementer_report=implementer_report,
            base_sha=base_sha,
            head_sha=head_sha,
        ),
    }

    return {
        "feature": feature,
        "doc_id": doc_id,
        "task_id": task,
        "task_title": task_title,
        "task_name": task_name,
        "ipd_path": ipd_rel,
        "source_hash": source_hash,
        "brief": brief,
        "prompt_hashes": {name: sha256_text(prompt) for name, prompt in prompts.items()},
        "prompts": prompts,
    }


def output_payload_for_kind(payload: dict[str, Any], kind: str) -> dict[str, Any]:
    if kind == "all":
        return payload
    filtered = dict(payload)
    filtered["prompt_hashes"] = {kind: payload["prompt_hashes"][kind]}
    filtered["prompts"] = {kind: payload["prompts"][kind]}
    return filtered


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build deterministic prompts for IPD task subagents.")
    parser.add_argument("--root", default=".")
    parser.add_argument("--feature", required=True)
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--task", required=True, help="TASK-001 style task id.")
    parser.add_argument(
        "--kind",
        choices=("all", "implementer", "spec-reviewer", "code-quality-reviewer"),
        default="all",
        help="Prompt kind to print. JSON output is filtered to this kind unless kind is all.",
    )
    parser.add_argument("--workdir")
    parser.add_argument("--implementer-report", default="[待实现子代理回报后填入]")
    parser.add_argument("--base-sha", default="[commit before task]")
    parser.add_argument("--head-sha", default="[current commit]")
    parser.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    input_failures = review_input_failures(args)
    if input_failures:
        print("ERROR: " + "; ".join(input_failures))
        return 1

    try:
        payload = build_prompts(
            Path(args.root),
            feature=args.feature,
            doc_id=args.doc_id,
            task=args.task,
            workdir=args.workdir,
            implementer_report=args.implementer_report,
            base_sha=args.base_sha,
            head_sha=args.head_sha,
        )
    except PromptBuildError as error:
        print(f"ERROR: {error}")
        return 1

    if args.json:
        print(json.dumps(output_payload_for_kind(payload, args.kind), ensure_ascii=False, indent=2))
        return 0

    if args.kind == "all":
        print(json.dumps({key: payload[key] for key in ("feature", "doc_id", "task_id", "prompt_hashes")}, ensure_ascii=False, indent=2))
        return 0

    print(payload["prompts"][args.kind])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
