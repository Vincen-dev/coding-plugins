#!/usr/bin/env python3
"""Generate and validate the Coding Plugins feature-first document index."""

from __future__ import annotations

from pathlib import Path


class DocsIndexError(RuntimeError):
    """Raised when the generated artifact index contract is violated."""


ARTIFACT_INDEX_REQUIRED_COLUMNS = (
    "Area",
    "Capability",
    "Feature Root",
    "Spec",
    "Technical Design",
    "Implementation Plan",
    "Evidence",
    "Tags",
    "Updated",
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


def feature_docs_root(root: Path) -> Path:
    return root / "docs" / "coding-plugins" / "features"


def collect_feature_roots(root: Path) -> list[Path]:
    features_root = feature_docs_root(root)
    if not features_root.exists():
        return []

    feature_roots: list[Path] = []
    for area_dir in sorted(path for path in features_root.iterdir() if path.is_dir()):
        for capability_dir in sorted(path for path in area_dir.iterdir() if path.is_dir()):
            feature_roots.append(capability_dir)
    return feature_roots


def feature_root_for_document(root: Path, path: Path) -> tuple[str, str, Path] | None:
    try:
        relative_parts = path.relative_to(feature_docs_root(root)).parts
    except ValueError:
        return None
    if len(relative_parts) < 2:
        return None
    area, capability = relative_parts[0], relative_parts[1]
    return area, capability, feature_docs_root(root) / area / capability


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


def feature_spec_files(feature_root: Path) -> list[Path]:
    specs_root = feature_root / "specs"
    if not specs_root.exists():
        return []
    return sorted(path for path in specs_root.rglob("*.md") if path.name != "INDEX.md")


def feature_evidence_files(feature_root: Path) -> list[Path]:
    evidence_root = feature_root / "evidence"
    if not evidence_root.exists():
        return []
    return sorted(evidence_root.rglob("*.md"))


def feature_technical_design_files(feature_root: Path) -> list[Path]:
    path = feature_root / "technical" / "technical-design.md"
    return [path] if path.exists() else []


def feature_plan_files(feature_root: Path) -> list[Path]:
    path = feature_root / "plans" / "implementation.md"
    return [path] if path.exists() else []


def feature_tags(feature_root: Path) -> str:
    readme = feature_root / "README.md"
    if not readme.exists():
        return "-"
    metadata = parse_chinese_document_info(readme.read_text(encoding="utf-8"))
    return metadata.get("标签", "").strip() or "-"


def feature_updated(feature_root: Path) -> str:
    updated_values: list[str] = []
    for path in (
        feature_spec_files(feature_root)
        + feature_technical_design_files(feature_root)
        + feature_plan_files(feature_root)
    ):
        updated = parse_frontmatter(path.read_text(encoding="utf-8")).get("updated")
        if updated:
            updated_values.append(updated)
    return max(updated_values) if updated_values else "-"


def render_artifact_index(root: Path) -> str:
    lines = [
        "# Coding Plugins Feature 索引",
        "",
        "本索引用于按 `Area` 和 `Capability` 检索 feature-first 文档链路。运行 `python3 scripts/preflight.py --write-index` 可根据 feature root 重新生成本文件。",
        "",
        "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]

    for feature_root in collect_feature_roots(root):
        feature_context = feature_root_for_document(root, feature_root / "README.md")
        if feature_context is None:
            continue
        area, capability, _feature_root = feature_context
        lines.append(
            "| "
            + " | ".join(
                (
                    area,
                    capability,
                    f"`{relative_markdown_path(root, feature_root)}`",
                    format_index_path_cell(root, feature_spec_files(feature_root)),
                    format_index_path_cell(root, feature_technical_design_files(feature_root)),
                    format_index_path_cell(root, feature_plan_files(feature_root)),
                    format_index_path_cell(root, feature_evidence_files(feature_root)),
                    feature_tags(feature_root),
                    feature_updated(feature_root),
                )
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "Rules:",
            "",
            "- `Area` 和 `Capability` 必须和 `Feature Root` 路径一致。",
            "- `Feature Root` 指向 `docs/coding-plugins/features/<area>/<capability>`。",
            "- `Spec` 指向该 capability 的规格文件；有多个规格时在同一个单元格用 `<br>` 分隔。",
            "- `Technical Design` 指向默认技术设计 `docs/coding-plugins/features/<area>/<capability>/technical/technical-design.md`；没有技术设计时使用 `-`。",
            "- `Implementation Plan` 指向默认实现计划 `docs/coding-plugins/features/<area>/<capability>/plans/implementation.md`；没有计划时使用 `-`。",
            "- `Evidence` 指向该 capability 的 evidence 文件；有多个 evidence 时在同一个单元格用 `<br>` 分隔；没有 evidence 时使用 `-`。",
            "- `Tags` 来自 feature README 的 `标签` 行；日期来自规格、技术设计或计划 frontmatter 的最大 `updated` 值。",
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
