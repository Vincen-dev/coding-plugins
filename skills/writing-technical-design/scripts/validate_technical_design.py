#!/usr/bin/env python3
"""Validate feature-first technical design Markdown documents."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPTS_DIR = REPO_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import docs_index  # noqa: E402
from docs_index import feature_root_for_document, parse_frontmatter  # noqa: E402


SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)-\d{3,}\b")
TD_ID_RE = re.compile(r"\bTD-\d{3,}\b")
TECHNICAL_DESIGN_REQUIRED_SECTIONS = ("规格到设计映射", "无需技术设计的规格")
TECHNICAL_MAPPING_HEADERS = ("Spec ID", "规格摘要", "技术落点", "关键决策 ID", "影响文件/符号", "验证命令", "Evidence")
TECHNICAL_DECISION_HEADERS = ("决策 ID", "决策", "原因", "取舍")
TECHNICAL_LIFECYCLE_STATUSES = {"draft", "approved", "implemented", "stale", "superseded"}
TECHNICAL_LIFECYCLE_REQUIRED_FIELDS = ("lifecycle_status", "implemented_commits", "validated_by")
GENERIC_MAPPING_PATTERNS = (
    "见本设计的 `影响组件`",
    "见本设计的",
    "按本 technical",
    "见 `## 测试策略`",
    "对应计划追踪",
)
HIDDEN_REQUIREMENT_TERMS = ("必须", "不得", "禁止", "MUST", "SHOULD")
HIDDEN_REQUIREMENT_EXCLUDED_SECTIONS = ("规格缺口审查", "规格到设计映射", "无需技术设计的规格", "测试策略")


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    checked_files: list[str]
    errors: list[str]
    warnings: list[str]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate technical design documents.")
    parser.add_argument("technical_files", nargs="*", help="Optional technical-design.md files to validate.")
    parser.add_argument("--root", default=str(REPO_ROOT), help="Repository root. Defaults to this plugin repository.")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as validation errors.")
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format. Use json for CI or editor integrations.",
    )
    return parser.parse_args(argv)


def markdown_section(text: str, heading: str) -> str | None:
    match = re.search(rf"^##[ \t]+{re.escape(heading)}[ \t]*$", text, re.MULTILINE)
    if match is None:
        return None

    next_match = re.search(r"^##[ \t]+", text[match.end() :], re.MULTILINE)
    if next_match is None:
        return text[match.start() :]
    return text[match.start() : match.end() + next_match.start()]


def markdown_sections(text: str) -> list[tuple[str, str]]:
    matches = list(re.finditer(r"^##[ \t]+(.+?)[ \t]*$", text, re.MULTILINE))
    sections: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        sections.append((match.group(1).strip(), text[match.start() : end]))
    return sections


def parse_markdown_table(section: str) -> tuple[list[str], list[list[str]]]:
    lines = section.splitlines()
    for index, line in enumerate(lines[:-1]):
        if not line.lstrip().startswith("|"):
            continue
        header = [cell.strip() for cell in line.strip().strip("|").split("|")]
        separator = [cell.strip() for cell in lines[index + 1].strip().strip("|").split("|")]
        if not separator or not all(cell.replace(":", "").strip("-") == "" and "---" in cell for cell in separator):
            continue
        rows: list[list[str]] = []
        for row in lines[index + 2 :]:
            if not row.lstrip().startswith("|"):
                break
            cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
            if len(cells) == len(header):
                rows.append(cells)
        return header, rows
    return [], []


def relative_path(root: Path, path: Path) -> str:
    return str(path.relative_to(root)) if path.is_relative_to(root) else str(path)


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


def collect_technical_design_files(root: Path, technical_files: list[Path] | None = None) -> list[Path]:
    if technical_files:
        return sorted(path if path.is_absolute() else root / path for path in technical_files)

    files: list[Path] = []
    for feature_root in docs_index.collect_feature_roots(root):
        technical_file = feature_root / "technical" / "technical-design.md"
        if technical_file.exists():
            files.append(technical_file)
    return sorted(files)


def approved_spec_files_for_feature(feature_root: Path) -> list[Path]:
    approved: list[Path] = []
    for spec_file in docs_index.feature_spec_files(feature_root):
        metadata = parse_frontmatter(spec_file.read_text(encoding="utf-8"))
        if metadata.get("status") == "approved":
            approved.append(spec_file)
    return approved


def required_spec_ids_from_specs(spec_files: list[Path]) -> set[str]:
    ids: set[str] = set()
    for spec_file in spec_files:
        for line in spec_file.read_text(encoding="utf-8").splitlines():
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if not cells or not line.lstrip().startswith("|"):
                continue
            if any(cell in {"必须", "MUST"} for cell in cells):
                ids.update(SPEC_ID_RE.findall(line))
    return ids


def technical_design_coverage_ids(technical_text: str) -> set[str]:
    ids: set[str] = set()
    for heading in TECHNICAL_DESIGN_REQUIRED_SECTIONS:
        section = markdown_section(technical_text, heading)
        if section:
            ids.update(SPEC_ID_RE.findall(section))
    return ids


def validate_lifecycle_metadata(root: Path, technical_file: Path, text: str) -> list[str]:
    metadata = parse_frontmatter(text)
    errors: list[str] = []
    missing = [field for field in TECHNICAL_LIFECYCLE_REQUIRED_FIELDS if not metadata.get(field)]
    if missing:
        errors.append(f"{relative_path(root, technical_file)} lifecycle metadata missing {', '.join(missing)}")
        return errors

    status = metadata["lifecycle_status"]
    if status not in TECHNICAL_LIFECYCLE_STATUSES:
        errors.append(
            f"{relative_path(root, technical_file)} lifecycle metadata has invalid lifecycle_status={status}"
        )
    return errors


def validate_required_sections(root: Path, technical_file: Path, text: str) -> list[str]:
    missing = [section for section in TECHNICAL_DESIGN_REQUIRED_SECTIONS if markdown_section(text, section) is None]
    if not missing:
        return []
    return [f"{technical_file.relative_to(root)} missing required section: {', '.join(missing)}"]


def validate_must_spec_coverage(root: Path, technical_file: Path, text: str) -> list[str]:
    feature_context = feature_root_for_document(root, technical_file)
    if feature_context is None:
        return []
    _area, _capability, feature_root = feature_context
    required_ids = required_spec_ids_from_specs(approved_spec_files_for_feature(feature_root))
    if not required_ids:
        return []

    covered_ids = technical_design_coverage_ids(text)
    missing = sorted(required_ids - covered_ids)
    if not missing:
        return []
    return [f"{technical_file.relative_to(root)} does not cover required Spec IDs: {', '.join(missing)}"]


def validate_related_metadata(root: Path, technical_file: Path, text: str) -> list[str]:
    feature_context = feature_root_for_document(root, technical_file)
    if feature_context is None:
        return []
    _area, _capability, feature_root = feature_context
    expected_by_key = {
        "related_specs": docs_index.feature_spec_files(feature_root),
        "related_plans": docs_index.feature_plan_files(feature_root),
        "related_evidence": docs_index.feature_evidence_files(feature_root),
    }

    errors: list[str] = []
    for key, expected_paths in expected_by_key.items():
        if not expected_paths:
            continue
        actual_values = set(frontmatter_list_values(text, key))
        expected_values = {str(path.relative_to(root)) for path in expected_paths}
        missing_values = sorted(expected_values - actual_values)
        missing_existing = sorted(
            value for value in actual_values if value.startswith("docs/coding-plugins/") and not (root / value).exists()
        )
        if missing_values:
            errors.append(
                f"{technical_file.relative_to(root)} related metadata {key} missing {', '.join(missing_values)}"
            )
        if missing_existing:
            errors.append(
                f"{technical_file.relative_to(root)} related metadata {key} references missing "
                + ", ".join(missing_existing)
            )
    return errors


def validate_mapping_table_schema(root: Path, technical_file: Path, text: str) -> list[str]:
    section = markdown_section(text, "规格到设计映射")
    if section is None:
        return []

    header, rows = parse_markdown_table(section)
    errors: list[str] = []
    if tuple(header) != TECHNICAL_MAPPING_HEADERS:
        errors.append(
            f"{relative_path(root, technical_file)} mapping table header must be: "
            + " | ".join(TECHNICAL_MAPPING_HEADERS)
        )
        return errors

    for index, row in enumerate(rows, start=1):
        if not SPEC_ID_RE.search(row[0]):
            continue
        empty_columns = [TECHNICAL_MAPPING_HEADERS[column] for column, value in enumerate(row) if not value]
        if empty_columns:
            errors.append(
                f"{relative_path(root, technical_file)} mapping table row {index} has empty columns: "
                + ", ".join(empty_columns)
            )
    return errors


def decision_ids_from_design(text: str) -> set[str]:
    section = markdown_section(text, "关键决策")
    if section is None:
        return set()
    header, rows = parse_markdown_table(section)
    if tuple(header) != TECHNICAL_DECISION_HEADERS:
        return set()
    return {decision_id for row in rows for decision_id in TD_ID_RE.findall(row[0])}


def validate_decision_id_references(root: Path, technical_file: Path, text: str) -> list[str]:
    section = markdown_section(text, "规格到设计映射")
    if section is None:
        return []
    header, rows = parse_markdown_table(section)
    if tuple(header) != TECHNICAL_MAPPING_HEADERS:
        return []

    declared_ids = decision_ids_from_design(text)
    errors: list[str] = []
    if not declared_ids:
        errors.append(f"{relative_path(root, technical_file)} missing key decision table with TD decision IDs")
        return errors

    decision_column = header.index("关键决策 ID")
    referenced_ids = sorted({decision_id for row in rows for decision_id in TD_ID_RE.findall(row[decision_column])})
    missing = sorted(set(referenced_ids) - declared_ids)
    if missing:
        errors.append(
            f"{relative_path(root, technical_file)} references unknown decision IDs: " + ", ".join(missing)
        )
    return errors


def validate_hidden_requirements(root: Path, technical_file: Path, text: str) -> list[str]:
    errors: list[str] = []
    in_code_fence = False
    for heading, section in markdown_sections(text):
        if heading in HIDDEN_REQUIREMENT_EXCLUDED_SECTIONS:
            continue
        for line_number, line in enumerate(section.splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_fence = not in_code_fence
                continue
            if in_code_fence or not stripped or stripped.startswith("#"):
                continue
            if not any(term in stripped for term in HIDDEN_REQUIREMENT_TERMS):
                continue
            if SPEC_ID_RE.search(stripped) or TD_ID_RE.search(stripped) or "设计约束" in stripped:
                continue
            errors.append(
                f"{relative_path(root, technical_file)} hidden requirement in {heading} line {line_number}: "
                + stripped
            )
    return errors


def generic_mapping_warnings(root: Path, technical_file: Path, text: str) -> list[str]:
    section = markdown_section(text, "规格到设计映射")
    if section is None:
        return []

    warnings: list[str] = []
    for index, line in enumerate(section.splitlines(), start=1):
        if not SPEC_ID_RE.search(line):
            continue
        if any(pattern in line for pattern in GENERIC_MAPPING_PATTERNS):
            spec_ids = ", ".join(SPEC_ID_RE.findall(line))
            warnings.append(
                f"{technical_file.relative_to(root)} has generic mapping for {spec_ids} "
                + f"in 规格到设计映射 line {index}"
            )
    return warnings


def stale_warnings(root: Path, technical_file: Path, text: str) -> list[str]:
    technical_metadata = parse_frontmatter(text)
    technical_updated = technical_metadata.get("updated", "")
    if not technical_updated:
        return []

    feature_context = feature_root_for_document(root, technical_file)
    if feature_context is None:
        return []
    _area, _capability, feature_root = feature_context

    warnings: list[str] = []
    for spec_file in approved_spec_files_for_feature(feature_root):
        spec_metadata = parse_frontmatter(spec_file.read_text(encoding="utf-8"))
        spec_updated = spec_metadata.get("updated", "")
        if spec_updated and spec_updated > technical_updated:
            warnings.append(
                f"{technical_file.relative_to(root)} is stale technical: "
                + f"{spec_file.relative_to(root)} updated {spec_updated} > technical updated {technical_updated}"
            )
    return warnings


def validate_repository(
    root: Path,
    *,
    strict: bool,
    technical_files: list[Path] | None = None,
) -> ValidationResult:
    root = root.resolve()
    files = collect_technical_design_files(root, technical_files)
    errors: list[str] = []
    warnings: list[str] = []

    for technical_file in files:
        if not technical_file.exists():
            errors.append(f"Technical design file does not exist: {technical_file}")
            continue
        text = technical_file.read_text(encoding="utf-8")
        errors.extend(validate_required_sections(root, technical_file, text))
        errors.extend(validate_lifecycle_metadata(root, technical_file, text))
        errors.extend(validate_must_spec_coverage(root, technical_file, text))
        errors.extend(validate_related_metadata(root, technical_file, text))
        errors.extend(validate_mapping_table_schema(root, technical_file, text))
        errors.extend(validate_decision_id_references(root, technical_file, text))
        errors.extend(validate_hidden_requirements(root, technical_file, text))
        warnings.extend(generic_mapping_warnings(root, technical_file, text))
        warnings.extend(stale_warnings(root, technical_file, text))

    final_errors = errors + warnings if strict else errors
    final_warnings = [] if strict and warnings else warnings
    return ValidationResult(
        ok=not final_errors,
        checked_files=[str(path.relative_to(root)) if path.is_relative_to(root) else str(path) for path in files],
        errors=final_errors,
        warnings=final_warnings,
    )


def print_text_result(result: ValidationResult) -> None:
    if result.ok:
        print(f"Technical design validation passed: {len(result.checked_files)} file(s)")
    else:
        print("Technical design validation failed")

    if result.errors:
        print("\nErrors:")
        for error in result.errors:
            print(f"- {error}")
    if result.warnings:
        print("\nWarnings:")
        for warning in result.warnings:
            print(f"- {warning}")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(list(sys.argv[1:] if argv is None else argv))
    root = Path(args.root)
    result = validate_repository(
        root,
        strict=args.strict,
        technical_files=[Path(path) for path in args.technical_files] or None,
    )

    if args.format == "json":
        payload = asdict(result)
        payload["error_count"] = len(result.errors)
        payload["warning_count"] = len(result.warnings)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print_text_result(result)

    return 0 if result.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
