#!/usr/bin/env python3
"""Scaffold formal feature-chain fixture cases."""

from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

import workflow_state


SLUG_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


def validate_slug(label: str, value: str) -> None:
    if not SLUG_RE.fullmatch(value):
        raise ValueError(f"{label} must be a flat slug using letters, digits, dots, underscores or hyphens: {value}")


def docs_path(feature: str, directory: str, filename: str) -> str:
    return f"docs/coding-plugins/features/{feature}/{directory}/{filename}"


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def append_case_index(
    root: Path,
    *,
    feature: str,
    case_id: str,
    source_type: str,
    source_reference: str,
    optimization_target: str,
    covered_risk: str,
) -> None:
    index_path = root / "CASE-INDEX.md"
    if index_path.exists():
        text = index_path.read_text(encoding="utf-8").rstrip() + "\n\n"
        if f"## {feature}" in text:
            raise ValueError(f"CASE-INDEX.md already contains feature: {feature}")
    else:
        text = (
            "# Formal Feature Chain Case Index\n\n"
            "本索引用于说明 fixture 中每个案例的来源、优化目标和覆盖风险。\n\n"
        )

    text += (
        f"## {feature}\n\n"
        f"- case_id: {case_id}\n"
        f"- source_type: {source_type}\n"
        f"- source_reference: {source_reference}\n"
        f"- optimization_target: {optimization_target}\n"
        "- covered_risks:\n"
        f"  - {covered_risk}\n"
    )
    index_path.write_text(text, encoding="utf-8")


def scaffold_fixture_case(
    root: Path,
    *,
    feature: str,
    doc_id: str,
    title: str,
    case_id: str,
    source_type: str,
    source_reference: str,
    optimization_target: str,
    covered_risk: str,
    current_date: str | None = None,
) -> Path:
    validate_slug("feature", feature)
    validate_slug("doc_id", doc_id)
    current_date = current_date or date.today().isoformat()

    prd_path = docs_path(feature, "requirements", f"{doc_id}-PRD.md")
    tdd_path = docs_path(feature, "technicals", f"{doc_id}-TDD.md")
    tid_path = docs_path(feature, "technicals", f"{doc_id}-TID.md")
    tcd_path = docs_path(feature, "test-cases", f"{doc_id}-TCD.md")
    ipd_path = docs_path(feature, "plans", f"{doc_id}-IPD.md")
    ted_path = docs_path(feature, "evidences", f"{doc_id}-TED.md")
    feature_root = root / "docs" / "coding-plugins" / "features" / feature

    append_case_index(
        root,
        feature=feature,
        case_id=case_id,
        source_type=source_type,
        source_reference=source_reference,
        optimization_target=optimization_target,
        covered_risk=covered_risk,
    )

    write(
        feature_root / "README.md",
        (
            "---\n"
            f"title: {title}\n"
            "status: approved\n"
            f"feature: {feature}\n"
            f"updated: {current_date}\n"
            "tags:\n"
            "  - fixture\n"
            "---\n"
            f"# {title}\n\n"
            "## 文档信息\n\n"
            "| 字段 | 内容 |\n"
            "| --- | --- |\n"
            "| 状态 | approved |\n"
            f"| Feature | {feature} |\n"
        ),
    )

    common_frontmatter = (
        "status: approved\n"
        f"feature: {feature}\n"
        f"doc_id: {doc_id}\n"
        f"created: {current_date}\n"
        f"updated: {current_date}\n"
    )

    write(
        root / prd_path,
        (
            "---\n"
            f"title: {title} PRD\n"
            "type: feature\n"
            f"{common_frontmatter}"
            "related_specs: []\n"
            "related_technical:\n"
            f"  - {tdd_path}\n"
            f"  - {tid_path}\n"
            "related_test_cases:\n"
            f"  - {tcd_path}\n"
            "related_plans:\n"
            f"  - {ipd_path}\n"
            "related_evidence:\n"
            f"  - {ted_path}\n"
            "---\n"
            f"# {title} PRD\n\n"
            "## 需求总览\n\n"
            "| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |\n"
            "| --- | --- | --- | --- | --- |\n"
            f"| REQ-001 | {title} | 必须 | fixture | contract 测试 |\n\n"
            f"## {title}（REQ-001）\n\n"
            "### 需求描述\n\n"
            f"{optimization_target}\n\n"
            "## 追踪矩阵\n\n"
            "| 规格 ID | 验证类型 | 验证证据 | 状态 |\n"
            "| --- | --- | --- | --- |\n"
            f"| REQ-001 | contract | `{ted_path}` | 已覆盖 |\n"
        ),
    )

    write(
        root / tdd_path,
        (
            "---\n"
            f"title: {title} TDD\n"
            f"{common_frontmatter}"
            "lifecycle_status: approved\n"
            "related_specs:\n"
            f"  - {prd_path}\n"
            "related_technical:\n"
            f"  - {tid_path}\n"
            "related_test_cases:\n"
            f"  - {tcd_path}\n"
            "related_plans:\n"
            f"  - {ipd_path}\n"
            "related_evidence:\n"
            f"  - {ted_path}\n"
            "---\n"
            f"# {title} TDD\n\n"
            "## 文档信息\n\n"
            "| 字段 | 内容 |\n"
            "| --- | --- |\n"
            "| 状态 | approved |\n"
            f"| Feature | {feature} |\n\n"
            "## 规格缺口审查\n\n"
            "| 检查项 | 结论 |\n"
            "| --- | --- |\n"
            "| 未覆盖需求 | 无。 |\n"
            "| 验收标准 | 清楚。 |\n"
            "| 外部行为 | 已在 PRD 描述。 |\n"
            "| 处理状态 | 通过，未发现需要回写 spec 的缺口。 |\n\n"
            "## 规格到设计映射\n\n"
            "| 规格 ID | 技术落点 | 设计决策 | 测试策略 |\n"
            "| --- | --- | --- | --- |\n"
            "| REQ-001 | `tests/fixtures` | fixture 文档链路覆盖 | contract 测试 |\n\n"
            "## 无需技术设计的规格\n\n"
            "| 规格 ID | 原因 |\n"
            "| --- | --- |\n"
            "| 无 | 无。 |\n"
        ),
    )

    write(
        root / tid_path,
        (
            "---\n"
            f"title: {title} TID\n"
            f"{common_frontmatter}"
            "lifecycle_status: approved\n"
            "related_specs:\n"
            f"  - {prd_path}\n"
            "related_technical:\n"
            f"  - {tdd_path}\n"
            "related_test_cases:\n"
            f"  - {tcd_path}\n"
            "related_plans:\n"
            f"  - {ipd_path}\n"
            "related_evidence:\n"
            f"  - {ted_path}\n"
            "---\n"
            f"# {title} TID\n\n"
            "## 实现点总览\n\n"
            "| 实现点 | 标题 | 覆盖规格 | 关联设计 | 主要落点 |\n"
            "| --- | --- | --- | --- | --- |\n"
            f"| IMPL-001 | {title} | REQ-001 | TD-001 | `tests/fixtures` |\n\n"
            f"## {title}（IMPL-001 / REQ-001）\n\n"
            "### 实现目标\n\n"
            "建立可回归验证的 fixture 文档链路。\n"
        ),
    )

    write(
        root / tcd_path,
        (
            "---\n"
            f"title: {title} TCD\n"
            f"{common_frontmatter}"
            "related_specs:\n"
            f"  - {prd_path}\n"
            "related_technical:\n"
            f"  - {tdd_path}\n"
            f"  - {tid_path}\n"
            "related_test_cases: []\n"
            "related_plans:\n"
            f"  - {ipd_path}\n"
            "related_evidence:\n"
            f"  - {ted_path}\n"
            "---\n"
            f"# {title} TCD\n\n"
            "## 测试用例总览\n\n"
            "| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |\n"
            "| --- | --- | --- | --- | --- | --- |\n"
            f"| TC-001 | {title} | REQ-001 | contract | 自动化 | TED |\n\n"
            f"## {title}（TC-001 / REQ-001）\n\n"
            "### 断言\n\n"
            "- fixture 文档链路可以被 preflight 校验。\n"
        ),
    )

    source_hash = workflow_state.compute_upstream_hash(root, feature=feature, doc_id=doc_id)
    if source_hash is None:
        raise RuntimeError(f"could not compute source_hash for {feature}/{doc_id}")

    write(
        root / ipd_path,
        (
            "---\n"
            f"title: {title} Implementation Procedure Document\n"
            f"{common_frontmatter}"
            f"source_hash: {source_hash}\n"
            "related_specs:\n"
            f"  - {prd_path}\n"
            "related_technical:\n"
            f"  - {tdd_path}\n"
            f"  - {tid_path}\n"
            "related_test_cases:\n"
            f"  - {tcd_path}\n"
            "related_plans: []\n"
            "related_evidence:\n"
            f"  - {ted_path}\n"
            "---\n"
            f"# {title} 任务执行文档（IPD）\n\n"
            "## 执行锁定区\n\n"
            f"- **Intent Lock:** 只执行 {title} fixture 链路校验。\n"
            "- **Scope Fence:** 包含 fixture 文档链路；不包含发布、缓存刷新或仓库集成。\n"
            "- **Required Spec IDs:** REQ-001\n"
            "- **Required Tests:** `python3 scripts/preflight.py`\n"
            "- **Review Gates:** 检查 IPD source_hash、执行简报和 TASK-001 追踪。\n"
            "- **Rewind Triggers:** 上游 PRD/TDD/TID/TCD 变更、source_hash 不匹配或 fixture 校验失败。\n\n"
            "## 执行简报\n\n"
            "- **执行来源:** 只按本 IPD 的任务章节执行。\n"
            "- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。\n"
            "- **可跳过内容:** PRD/TDD/TID/TCD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。\n"
            "- **新计划策略:** 每次新计划新建 IPD，不向旧 IPD 追加任务。\n\n"
            "## 任务总览\n\n"
            "| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |\n"
            "| --- | --- | --- | --- | --- |\n"
            f"| TASK-001 | {title} | REQ-001 | preflight fixture 校验 | `{ted_path}` |\n\n"
            f"## {title}（TASK-001 / REQ-001）\n\n"
            "### 执行步骤\n\n"
            "- [ ] 运行 fixture 校验。\n"
        ),
    )

    write(
        root / ted_path,
        (
            "---\n"
            f"title: {title} TED\n"
            f"{common_frontmatter}"
            "related_specs:\n"
            f"  - {prd_path}\n"
            "related_technical:\n"
            f"  - {tdd_path}\n"
            f"  - {tid_path}\n"
            "related_test_cases:\n"
            f"  - {tcd_path}\n"
            "related_plans:\n"
            f"  - {ipd_path}\n"
            "related_evidence: []\n"
            "---\n"
            f"# {title} TED\n\n"
            "## TDD 证据\n\n"
            "- **规格/缺陷/验收:** REQ-001\n"
            "- **测试类型:** `contract`\n"
            "- **RED 测试:** `scripts.test_scaffold_fixture_case`\n"
            "- **RED 命令:** `python3 -m unittest scripts/test_scaffold_fixture_case.py`\n"
            "- **RED 失败:** 缺少 fixture case 脚手架时测试失败。\n"
            "- **GREEN 变更:** 生成完整 fixture 文档链路。\n"
            "- **GREEN 命令:** `python3 -m unittest scripts/test_scaffold_fixture_case.py`\n"
            "- **REFACTOR 命令:** `python3 scripts/preflight.py`\n"
            "- **最终验证:** PASS：fixture 文档链路通过。\n"
        ),
    )

    return feature_root


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a formal feature-chain fixture case.")
    parser.add_argument("root", type=Path)
    parser.add_argument("--feature", required=True)
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--case-id", required=True)
    parser.add_argument("--source-type", required=True)
    parser.add_argument("--source-reference", required=True)
    parser.add_argument("--optimization-target", required=True)
    parser.add_argument("--covered-risk", required=True)
    parser.add_argument("--date", default=None)
    args = parser.parse_args()

    scaffold_fixture_case(
        args.root,
        feature=args.feature,
        doc_id=args.doc_id,
        title=args.title,
        case_id=args.case_id,
        source_type=args.source_type,
        source_reference=args.source_reference,
        optimization_target=args.optimization_target,
        covered_risk=args.covered_risk,
        current_date=args.date,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
