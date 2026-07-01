#!/usr/bin/env python3
"""Generate and validate the Coding Plugins feature-first document index."""

from __future__ import annotations

from pathlib import Path


class DocsIndexError(RuntimeError):
    """Raised when the generated artifact index contract is violated."""


ARTIFACT_INDEX_REQUIRED_COLUMNS = (
    "Feature",
    "Doc ID",
    "功能根目录",
    "需求文档",
    "技术设计",
    "技术实现",
    "测试用例",
    "实现计划",
    "证据",
    "标签",
    "更新日期",
)


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end == -1:
        return {}

    metadata: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"').strip("'")
    return metadata


def frontmatter_list_values(text: str, key: str) -> list[str]:
    if not text.startswith("---\n"):
        return []
    end = text.find("\n---", 4)
    if end == -1:
        return []

    values: list[str] = []
    in_key = False
    for line in text[4:end].splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if line.startswith(" ") and in_key and stripped.startswith("- "):
            values.append(stripped[2:].strip().strip('"').strip("'"))
            continue
        if ":" in line and not line.startswith(" "):
            current_key, value = line.split(":", 1)
            in_key = current_key.strip() == key
            if in_key and value.strip():
                values.append(value.strip().strip('"').strip("'"))
    return values


def feature_docs_root(root: Path) -> Path:
    return root / "docs" / "coding-plugins" / "features"


def collect_feature_roots(root: Path) -> list[Path]:
    features_root = feature_docs_root(root)
    if not features_root.exists():
        return []

    return sorted(path for path in features_root.iterdir() if path.is_dir())


def feature_root_for_document(root: Path, path: Path) -> tuple[str, Path] | None:
    try:
        relative_parts = path.relative_to(feature_docs_root(root)).parts
    except ValueError:
        return None
    if len(relative_parts) < 1:
        return None
    feature = relative_parts[0]
    return feature, feature_docs_root(root) / feature


def parse_markdown_table_headers(text: str) -> list[str]:
    lines = text.splitlines()
    for index, line in enumerate(lines[:-1]):
        if not line.lstrip().startswith("|"):
            continue
        headers = [cell.strip() for cell in line.strip().strip("|").split("|")]
        separator = [cell.strip() for cell in lines[index + 1].strip().strip("|").split("|")]
        if separator and all(cell.replace(":", "").strip("-") == "" and "---" in cell for cell in separator):
            return headers
    return []


def parse_chinese_document_info(text: str) -> dict[str, str]:
    info: dict[str, str] = {}
    for line in text.splitlines():
        if not line.lstrip().startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        key, value = cells[0], cells[1]
        if key in {"字段", "---"} or set(key) <= {"-", ":"}:
            continue
        info[key] = value
    return info


def relative_markdown_path(root: Path, path: Path) -> str:
    return str(path.relative_to(root))


def format_index_path_cell(root: Path, paths: list[Path]) -> str:
    if not paths:
        return "-"
    return "<br>".join(f"`{relative_markdown_path(root, path)}`" for path in paths)


ARTIFACT_SUFFIXES = ("PRD", "TDD", "TID", "TCD", "IPD", "TED")


def document_doc_id(path: Path) -> str:
    for suffix in ARTIFACT_SUFFIXES:
        marker = f"-{suffix}"
        if path.stem.endswith(marker):
            return path.stem[: -len(marker)]
    return path.stem


def feature_artifact_file(feature_root: Path, directory: str, suffix: str, doc_id: str | None = None) -> Path:
    return feature_root / directory / f"{doc_id or feature_root.name}-{suffix}.md"


def feature_artifact_files(feature_root: Path, directory: str, suffix: str) -> list[Path]:
    artifact_dir = feature_root / directory
    if not artifact_dir.exists():
        return []
    return sorted(path for path in artifact_dir.glob(f"*-{suffix}.md") if path.is_file())


def feature_artifact_files_for_doc_id(feature_root: Path, directory: str, suffix: str, doc_id: str) -> list[Path]:
    path = feature_artifact_file(feature_root, directory, suffix, doc_id)
    return [path] if path.exists() else []


def feature_spec_files(feature_root: Path) -> list[Path]:
    return feature_artifact_files(feature_root, "requirements", "PRD")


def feature_spec_files_for_doc_id(feature_root: Path, doc_id: str) -> list[Path]:
    return feature_artifact_files_for_doc_id(feature_root, "requirements", "PRD", doc_id)


def feature_evidence_files(feature_root: Path) -> list[Path]:
    return feature_artifact_files(feature_root, "evidences", "TED")


def feature_evidence_files_for_doc_id(feature_root: Path, doc_id: str) -> list[Path]:
    return feature_artifact_files_for_doc_id(feature_root, "evidences", "TED", doc_id)


def feature_archived_evidence_files(feature_root: Path) -> list[Path]:
    archive_root = feature_root / "evidences" / "archive"
    if not archive_root.exists():
        return []
    return sorted(archive_root.rglob("*.md"))


def feature_technical_design_files(feature_root: Path) -> list[Path]:
    return feature_artifact_files(feature_root, "technicals", "TDD")


def feature_technical_design_files_for_doc_id(feature_root: Path, doc_id: str) -> list[Path]:
    return feature_artifact_files_for_doc_id(feature_root, "technicals", "TDD", doc_id)


def feature_technical_implementation_files(feature_root: Path) -> list[Path]:
    return feature_artifact_files(feature_root, "technicals", "TID")


def feature_technical_implementation_files_for_doc_id(feature_root: Path, doc_id: str) -> list[Path]:
    return feature_artifact_files_for_doc_id(feature_root, "technicals", "TID", doc_id)


def feature_plan_files(feature_root: Path) -> list[Path]:
    return feature_artifact_files(feature_root, "plans", "IPD")


def feature_plan_files_for_doc_id(feature_root: Path, doc_id: str) -> list[Path]:
    return feature_artifact_files_for_doc_id(feature_root, "plans", "IPD", doc_id)


def feature_test_case_files(feature_root: Path) -> list[Path]:
    return feature_artifact_files(feature_root, "test-cases", "TCD")


def feature_test_case_files_for_doc_id(feature_root: Path, doc_id: str) -> list[Path]:
    return feature_artifact_files_for_doc_id(feature_root, "test-cases", "TCD", doc_id)


def feature_doc_ids(feature_root: Path) -> list[str]:
    doc_ids = {
        document_doc_id(path)
        for path in (
            feature_spec_files(feature_root)
            + feature_technical_design_files(feature_root)
            + feature_technical_implementation_files(feature_root)
            + feature_test_case_files(feature_root)
            + feature_plan_files(feature_root)
            + feature_evidence_files(feature_root)
        )
    }
    return sorted(doc_ids)


def feature_tags(feature_root: Path) -> str:
    readme = feature_root / "README.md"
    if not readme.exists():
        return "-"
    tags = frontmatter_list_values(readme.read_text(encoding="utf-8"), "tags")
    return ", ".join(tags) if tags else "-"


def feature_updated(feature_root: Path, doc_id: str | None = None) -> str:
    updated_values: list[str] = []
    paths = (
        feature_spec_files(feature_root)
        + feature_technical_design_files(feature_root)
        + feature_technical_implementation_files(feature_root)
        + feature_test_case_files(feature_root)
        + feature_plan_files(feature_root)
    )
    if doc_id is not None:
        paths = [path for path in paths if document_doc_id(path) == doc_id]
    for path in paths:
        updated = parse_frontmatter(path.read_text(encoding="utf-8")).get("updated")
        if updated:
            updated_values.append(updated)
    return max(updated_values) if updated_values else "-"


def render_artifact_index(root: Path) -> str:
    lines = [
        "# Coding Plugins Feature 索引",
        "",
        "本索引用于按 `Feature` 检索 feature-first 文档链路。运行 `python3 scripts/preflight.py --write-index` 可根据 feature root 重新生成本文件。",
        "",
        "| Feature | Doc ID | 功能根目录 | 需求文档 | 技术设计 | 技术实现 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]

    for feature_root in collect_feature_roots(root):
        feature_context = feature_root_for_document(root, feature_root / "README.md")
        if feature_context is None:
            continue
        feature, _feature_root = feature_context
        doc_ids = feature_doc_ids(feature_root) or [feature]
        for doc_id in doc_ids:
            lines.append(
                "| "
                + " | ".join(
                    (
                        feature,
                        doc_id,
                        f"`{relative_markdown_path(root, feature_root)}`",
                        format_index_path_cell(root, feature_spec_files_for_doc_id(feature_root, doc_id)),
                        format_index_path_cell(root, feature_technical_design_files_for_doc_id(feature_root, doc_id)),
                        format_index_path_cell(
                            root, feature_technical_implementation_files_for_doc_id(feature_root, doc_id)
                        ),
                        format_index_path_cell(root, feature_test_case_files_for_doc_id(feature_root, doc_id)),
                        format_index_path_cell(root, feature_plan_files_for_doc_id(feature_root, doc_id)),
                        format_index_path_cell(root, feature_evidence_files_for_doc_id(feature_root, doc_id)),
                        feature_tags(feature_root),
                        feature_updated(feature_root, doc_id),
                    )
                )
                + " |"
            )

    lines.extend(
        [
            "",
            "规则:",
            "",
            "- `Feature` 必须和 `功能根目录` 路径一致。",
            "- `Doc ID` 来自文件名去掉 `-PRD`、`-TDD`、`-TID`、`-TCD`、`-IPD` 或 `-TED` 后的前缀，用于区分同一 feature 下多条文档链路。",
            "- `功能根目录` 指向 `docs/coding-plugins/features/<feature-name>`。",
            "- `需求文档` 指向 `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`；没有需求文档时使用 `-`。",
            "- `技术设计` 指向 `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md`；没有技术设计时使用 `-`。",
            "- `技术实现` 指向 `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md`；没有技术实现文档时使用 `-`。",
            "- `测试用例` 指向 `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md`；没有测试用例时使用 `-`。",
            "- `实现计划` 指向 `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md`；没有计划时使用 `-`。",
            "- `证据` 指向 `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md`；没有证据时使用 `-`。",
            "- `标签` 来自 feature README frontmatter 的 `tags` 列表；日期来自需求文档、技术设计、测试用例或计划 frontmatter 的最大 `updated` 值。",
        ]
    )
    return "\n".join(lines) + "\n"


def write_artifact_index(root: Path) -> None:
    index_path = root / "docs" / "coding-plugins" / "INDEX.md"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(render_artifact_index(root), encoding="utf-8")


def collect_index_document_files(root: Path) -> list[Path]:
    documents: list[Path] = []
    for feature_root in collect_feature_roots(root):
        documents.extend(feature_spec_files(feature_root))
        documents.extend(feature_technical_design_files(feature_root))
        documents.extend(feature_technical_implementation_files(feature_root))
        documents.extend(feature_test_case_files(feature_root))
        documents.extend(feature_plan_files(feature_root))
        documents.extend(feature_evidence_files(feature_root))
    return sorted(documents)


def check_artifact_index_covers_documents(root: Path) -> None:
    feature_roots = collect_feature_roots(root)
    documents = collect_index_document_files(root)
    if not feature_roots and not documents:
        return

    index_path = root / "docs" / "coding-plugins" / "INDEX.md"
    if not index_path.exists():
        raise DocsIndexError("Missing artifact index: docs/coding-plugins/INDEX.md.")

    text = index_path.read_text(encoding="utf-8")
    headers = parse_markdown_table_headers(text)
    missing_columns = [column for column in ARTIFACT_INDEX_REQUIRED_COLUMNS if column not in headers]
    if missing_columns:
        raise DocsIndexError("Artifact index is missing required columns: " + ", ".join(missing_columns) + ".")

    expected_paths = [str(path.relative_to(root)) for path in feature_roots] + [
        str(path.relative_to(root)) for path in documents
    ]
    missing_paths = [path for path in expected_paths if path not in text]
    if missing_paths:
        raise DocsIndexError("Artifact index is missing document paths: " + ", ".join(missing_paths) + ".")

    expected_text = render_artifact_index(root)
    if text != expected_text:
        raise DocsIndexError(
            "Artifact index does not match generated content. Run `python3 scripts/preflight.py --write-index`."
        )
