#!/usr/bin/env python3
"""Build a compact execution brief from the IPD-centered workflow state."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import workflow_guard


def extract_task_headings(text: str) -> list[str]:
    headings: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("## ") and "TASK-" in stripped:
            headings.append(stripped.removeprefix("## ").strip())
    return headings


def build_brief(root: Path | str, *, feature: str, doc_id: str, target: str = "execute") -> dict[str, Any]:
    root_path = Path(root)
    guard = workflow_guard.check(root_path, feature=feature, doc_id=doc_id, target=target)
    next_context = guard["next_context"]
    must_read = next_context["must_read"]

    task_headings: list[str] = []
    if must_read:
        ipd_path = root_path / must_read[0]
        if ipd_path.exists():
            task_headings = extract_task_headings(ipd_path.read_text(encoding="utf-8"))

    return {
        "pass": guard["pass"],
        "feature": feature,
        "doc_id": doc_id,
        "target": target,
        "state": guard["state"],
        "reason": guard["reason"],
        "next_skill": guard["next_skill"],
        "failures": guard["failures"],
        "must_read": must_read,
        "may_skip": next_context["may_skip"],
        "focus_sections": next_context["focus_sections"],
        "task_headings": task_headings,
        "execution_source": next_context["execution_source"],
        "new_plan_policy": "create-new-ipd",
    }


def format_plain(payload: dict[str, Any]) -> str:
    lines = [
        f"State: {payload['state']}",
        f"Pass: {str(payload['pass']).lower()}",
        f"Reason: {payload['reason']}",
        f"Next skill: {payload['next_skill']}",
        "Must read:",
    ]
    lines.extend(f"- {path}" for path in payload["must_read"] or ["-"])
    lines.append("May skip unless rewind triggers fire:")
    lines.extend(f"- {path}" for path in payload["may_skip"] or ["-"])
    if payload["task_headings"]:
        lines.append("Task chapters:")
        lines.extend(f"- {heading}" for heading in payload["task_headings"])
    if payload["failures"]:
        lines.append("Failures:")
        lines.extend(f"- {failure}" for failure in payload["failures"])
    lines.append(f"Execution source: {payload['execution_source']}")
    lines.append(f"New plan policy: {payload['new_plan_policy']}")
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build a compact Coding Plugins workflow brief.")
    parser.add_argument("--root", default=".")
    parser.add_argument("--feature", required=True)
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--target", choices=sorted(workflow_guard.VALID_TARGETS), default="execute")
    parser.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    payload = build_brief(Path(args.root), feature=args.feature, doc_id=args.doc_id, target=args.target)
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(format_plain(payload))
    return 0 if payload["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
