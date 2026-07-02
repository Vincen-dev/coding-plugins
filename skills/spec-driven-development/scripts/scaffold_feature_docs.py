#!/usr/bin/env python3
"""Create the feature-first SDD document scaffold."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPTS_DIR = REPO_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import document_metadata  # noqa: E402


FEATURE_NAME_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


@dataclass(frozen=True)
class ScaffoldResult:
    created: list[Path]
    skipped: list[Path]


def validate_feature_name(feature: str) -> None:
    if not FEATURE_NAME_RE.fullmatch(feature):
        raise ValueError("feature-name 只能包含字母、数字、点、下划线和连字符，不能包含路径分隔符。")


def yaml_list(values: list[str], *, fallback: str | None = None) -> str:
    if values:
        return "\n".join(f"  - {value}" for value in values)
    if fallback is not None:
        return f"  - {fallback}"
    return "[]"


def render_readme(feature: str, title: str, status: str, updated: str, tags: list[str]) -> str:
    return (
        "---\n"
        f"title: {title}\n"
        f"status: {status}\n"
        f"feature: {feature}\n"
        f"updated: {updated}\n"
        "tags:\n"
        f"{yaml_list(tags, fallback=feature)}\n"
        "---\n\n"
        f"# {title}\n\n"
        "## 文档信息\n\n"
        "| 字段 | 内容 |\n"
        "| --- | --- |\n"
        f"| 状态 | {status} |\n"
        f"| Feature | {feature} |\n\n"
        "## 总览\n\n"
        "请在本节用 2 到 4 句话说明 feature 目标、当前状态和主要文档入口。\n"
    )


def render_prd(feature: str, doc_id: str, title: str, status: str, current_date: str, tags: list[str]) -> str:
    tags_text = yaml_list(tags, fallback=feature)
    return (
        "---\n"
        f"title: {title}需求文档\n"
        "type: feature\n"
        f"status: {status}\n"
        f"feature: {feature}\n"
        f"doc_id: {doc_id}\n"
        f"created: {current_date}\n"
        f"updated: {current_date}\n"
        "tags:\n"
        f"{tags_text}\n"
        "related_code: []\n"
        "related_specs: []\n"
        "related_technical: []\n"
        "related_test_cases: []\n"
        "related_plans: []\n"
        "related_evidence: []\n"
        "---\n\n"
        f"# {title}需求文档\n\n"
        "## 文档信息\n\n"
        "| 字段 | 内容 |\n"
        "| --- | --- |\n"
        f"| 状态 | {status} |\n"
        f"| Feature | {feature} |\n"
        f"| Doc ID | {doc_id} |\n"
        "| 文档类型 | PRD |\n\n"
        "关联关系以 frontmatter 的 `related_*` 字段为准；正文只描述需求点、验收和验证口径。\n\n"
        "## 目标\n\n"
        "请写明要交付的能力、成功状态和可观察结果。\n\n"
        "## 非目标\n\n"
        "| 编号 | 非目标 |\n"
        "| --- | --- |\n"
        "| NON-001 | 请写明本次明确不做的范围。 |\n\n"
        "## 背景\n\n"
        "- 当前行为：请写明现在系统或流程如何工作。\n"
        "- 目标用户或调用方：请写明谁会使用或调用该能力。\n"
        "- 约束：请写明兼容性、平台、性能、安全或时间限制。\n\n"
        "## 需求总览\n\n"
        "| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |\n"
        "| --- | --- | --- | --- | --- |\n"
        "| REQ-001 | 请写明需求点标题。 | 必须 | feature | 请写明验证类型或人工验收证据。 |\n\n"
        "## 请写明需求点标题（REQ-001）\n\n"
        "### 用户或系统价值\n\n"
        "请说明这个需求点解决谁的问题，以及完成后可观察到什么变化。\n\n"
        "### 需求描述\n\n"
        "请用业务语言说明这个需求点要什么，不写技术方案、代码文件或任务步骤。\n\n"
        "### 行为规则\n\n"
        "- 规则 1：请写明触发条件、期望行为和结果。\n"
        "- 规则 2：请写明需要固定的业务约束、兼容要求或状态语义。\n\n"
        "### 输入与输出\n\n"
        "| 项目 | 内容 |\n"
        "| --- | --- |\n"
        "| 输入 | 请写明用户动作、调用参数、事件、状态或数据来源。 |\n"
        "| 输出 | 请写明页面结果、API 响应、状态变化、数据写入或可观察日志。 |\n\n"
        "### 关联契约\n\n"
        "- API / SDK / CLI：不涉及。\n"
        "- Schema / 数据：不涉及。\n"
        "- 状态机 / 生命周期：不涉及。\n"
        "- 维护 / 迁移 / 回归：不涉及。\n\n"
        "### 错误和边界\n\n"
        "| 编号 | 条件 | 期望行为 | 验证方式 |\n"
        "| --- | --- | --- | --- |\n"
        "| ERR-001 | 请写明错误或边界条件。 | 请写明明确结果。 | 请写明测试或验收证据。 |\n\n"
        "### 验收标准\n\n"
        "| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |\n"
        "| --- | --- | --- | --- | --- |\n"
        "| AC-001 | 请写明场景名。 | 请写明前置条件。 | 请写明用户或系统动作。 | 请写明可观察结果。 |\n\n"
        "### 验证方式\n\n"
        "- 验证类型：请写明单元测试、集成测试、契约校验、端到端测试或人工验收。\n"
        "- 覆盖对象：请写明需求点中的具体行为、契约、状态或边界。\n"
        "- 后续沉淀：具体测试用例写入 TCD，执行任务写入 IPD，实际证据写入 TED。\n\n"
        "## 追踪矩阵\n\n"
        "| 规格 ID | 验证类型 | 验证证据 | 状态 |\n"
        "| --- | --- | --- | --- |\n"
        "| REQ-001 | 请写明验证类型。 | TCD/TED 创建前写验证口径，创建后回填证据路径或命令。 | 计划中 |\n"
    )


def write_file(path: Path, content: str, *, force: bool) -> bool:
    if path.exists() and not force:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def scaffold_feature(
    root: Path,
    feature: str,
    title: str,
    *,
    doc_id: str | None = None,
    status: str = "draft",
    current_date: str | None = None,
    tags: list[str] | None = None,
    force: bool = False,
) -> ScaffoldResult:
    validate_feature_name(feature)
    doc_id = doc_id or feature
    validate_feature_name(doc_id)
    current_date = current_date or date.today().isoformat()
    tags = tags or [feature]

    feature_root = root / "docs" / "coding-plugins" / "features" / feature
    for directory in document_metadata.artifact_directories():
        (feature_root / directory).mkdir(parents=True, exist_ok=True)

    targets = {
        feature_root / "README.md": render_readme(feature, title, status, current_date, tags),
        document_metadata.artifact_file(feature_root, "PRD", doc_id): render_prd(
            feature, doc_id, title, status, current_date, tags
        ),
    }

    created: list[Path] = []
    skipped: list[Path] = []
    for path, content in targets.items():
        if write_file(path, content, force=force):
            created.append(path)
        else:
            skipped.append(path)

    return ScaffoldResult(created=created, skipped=skipped)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create feature-first SDD document scaffold.")
    parser.add_argument("feature_name", help="Feature name, used in docs/coding-plugins/features/<feature-name>.")
    parser.add_argument("--doc-id", default=None, help="Document chain id. Default: feature name.")
    parser.add_argument("--title", required=True, help="Chinese feature title.")
    parser.add_argument("--status", default="draft", help="Initial metadata status. Default: draft.")
    parser.add_argument("--date", default=None, help="Metadata date in YYYY-MM-DD. Default: today.")
    parser.add_argument("--tag", action="append", default=[], help="Metadata tag. Can be repeated.")
    parser.add_argument("--root", default=".", help="Repository root. Default: current directory.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing README.md and PRD.")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = scaffold_feature(
            Path(args.root),
            args.feature_name,
            args.title,
            doc_id=args.doc_id,
            status=args.status,
            current_date=args.date,
            tags=args.tag or [args.feature_name],
            force=args.force,
        )
    except ValueError as error:
        parser.error(str(error))

    for path in result.created:
        print(f"created {path}")
    for path in result.skipped:
        print(f"skipped existing {path}")
    print("next: python3 scripts/preflight.py --write-index")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
