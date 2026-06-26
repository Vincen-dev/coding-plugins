#!/usr/bin/env python3
"""Validate a Markdown SDD specification for minimum planning readiness."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict
from dataclasses import dataclass
from pathlib import Path


SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)-\d{3,}\b")
PLACEHOLDER_RE = re.compile(r"<[^>\n]{2,}>|\bTODO\b|\bTBD\b|待补充|待定|占位")
MAYBE_AMBIGUOUS = ("适当", "友好", "常见情况", "尽快", "合理", "必要时")
ALLOWED_TRACE_STATUSES = {"planned", "covered", "manual", "blocked", "deferred", "not-applicable", "n/a"}


@dataclass(frozen=True)
class Table:
    headers: list[str]
    rows: list[list[str]]
    start_line: int


@dataclass(frozen=True)
class ValidationResult:
    path: str
    ok: bool
    errors: list[str]
    warnings: list[str]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a Markdown SDD spec for Spec IDs, traceability, and placeholders."
    )
    parser.add_argument("spec_files", nargs="+", help="Path(s) to Markdown specification files.")
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format. Use json for CI or editor integrations.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warning-level ambiguous wording as validation errors.",
    )
    return parser.parse_args(argv)


def split_table_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_separator_row(cells: list[str]) -> bool:
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells)


def extract_tables(lines: list[str]) -> list[Table]:
    tables: list[Table] = []
    i = 0
    while i < len(lines):
        if not lines[i].lstrip().startswith("|") or i + 1 >= len(lines):
            i += 1
            continue

        headers = split_table_row(lines[i])
        separator = split_table_row(lines[i + 1])
        if not is_separator_row(separator):
            i += 1
            continue

        rows: list[list[str]] = []
        start_line = i + 1
        i += 2
        while i < len(lines) and lines[i].lstrip().startswith("|"):
            row = split_table_row(lines[i])
            if not is_separator_row(row):
                rows.append(row)
            i += 1
        tables.append(Table(headers=headers, rows=rows, start_line=start_line))
    return tables


def get_cell(row: list[str], headers: list[str], names: tuple[str, ...]) -> str:
    normalized = [header.strip().lower() for header in headers]
    for name in names:
        name = name.lower()
        for index, header in enumerate(normalized):
            if name in header and index < len(row):
                return row[index].strip()
    return ""


def contains_placeholder(text: str) -> bool:
    return bool(PLACEHOLDER_RE.search(text))


def normalize_cell(text: str) -> str:
    return text.strip().strip("`").strip()


def validate_spec(path: Path, strict: bool) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not path.exists():
        return [f"File does not exist: {path}"], warnings
    if not path.is_file():
        return [f"Path is not a file: {path}"], warnings

    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not text.strip():
        return ["Spec file is empty."], warnings

    for match in PLACEHOLDER_RE.finditer(text):
        line_no = text.count("\n", 0, match.start()) + 1
        errors.append(f"Line {line_no}: unresolved placeholder or TODO: {match.group(0)!r}.")

    for phrase in MAYBE_AMBIGUOUS:
        if phrase in text:
            warnings.append(f"Ambiguous wording found: {phrase!r}. Make it observable if it is normative.")

    ids = set(SPEC_ID_RE.findall(text))
    if not ids:
        errors.append("No Spec ID found. Use REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON-001 style IDs.")

    tables = extract_tables(lines)
    must_ids: set[str] = set()
    should_ids: set[str] = set()
    trace_ids: set[str] = set()
    defined_ids: dict[str, int] = {}

    for table in tables:
        header_text = " | ".join(table.headers).lower()
        is_trace_table = "spec id" in header_text and (
            "verification" in header_text or "test file" in header_text or "command" in header_text
        )
        has_status_column = any("status" in header.strip().lower() for header in table.headers)

        for offset, row in enumerate(table.rows, start=2):
            line_no = table.start_line + offset
            row_text = " | ".join(row)
            row_ids = set(SPEC_ID_RE.findall(row_text))
            priority = normalize_cell(get_cell(row, table.headers, ("priority",))).upper()

            if row_ids and not is_trace_table:
                for spec_id in row_ids:
                    if spec_id in defined_ids:
                        errors.append(
                            f"Line {line_no}: Duplicate Spec ID definition {spec_id} "
                            f"(first defined on line {defined_ids[spec_id]})."
                        )
                    else:
                        defined_ids[spec_id] = line_no

            if priority in {"MUST", "SHOULD"} and not row_ids:
                errors.append(f"Line {line_no}: {priority} row is missing a Spec ID.")

            if priority == "MUST":
                must_ids.update(row_ids)
                verification = get_cell(row, table.headers, ("verification",))
                if not verification or contains_placeholder(verification):
                    errors.append(f"Line {line_no}: MUST row lacks concrete verification evidence.")

            if priority == "SHOULD":
                should_ids.update(row_ids)

            if is_trace_table and row_ids:
                trace_ids.update(row_ids)
                verification_type = get_cell(row, table.headers, ("verification type", "verification"))
                test_command = get_cell(row, table.headers, ("test file", "command", "evidence"))
                if (
                    not verification_type
                    or not test_command
                    or contains_placeholder(verification_type)
                    or contains_placeholder(test_command)
                ):
                    errors.append(f"Line {line_no}: traceability row for {sorted(row_ids)} lacks evidence.")
                if has_status_column:
                    status = get_cell(row, table.headers, ("status",))
                    normalized_status = normalize_cell(status).lower()
                    if not status or contains_placeholder(status):
                        errors.append(f"Line {line_no}: traceability row for {sorted(row_ids)} lacks status.")
                    elif normalized_status not in ALLOWED_TRACE_STATUSES:
                        allowed = ", ".join(sorted(ALLOWED_TRACE_STATUSES))
                        errors.append(
                            f"Line {line_no}: invalid traceability status {status!r}; allowed: {allowed}."
                        )

    if must_ids and not trace_ids:
        errors.append("MUST requirements exist but no Traceability Matrix rows were found.")

    missing_trace = sorted(must_ids - trace_ids)
    if missing_trace:
        errors.append("MUST requirements missing from Traceability Matrix: " + ", ".join(missing_trace) + ".")

    missing_should_trace = sorted(should_ids - trace_ids)
    if missing_should_trace:
        warnings.append(
            "SHOULD requirements missing from Traceability Matrix: " + ", ".join(missing_should_trace) + "."
        )

    if strict and warnings:
        errors.extend(warnings)
        warnings = []

    return errors, warnings


def build_result(path: Path, strict: bool) -> ValidationResult:
    errors, warnings = validate_spec(path, strict)
    return ValidationResult(path=str(path), ok=not errors, errors=errors, warnings=warnings)


def print_text_results(results: list[ValidationResult]) -> None:
    for index, result in enumerate(results):
        if index:
            print()

        if result.errors:
            print(f"Spec validation failed: {result.path}")
            print("\nErrors:")
            for error in result.errors:
                print(f"- {error}")
        else:
            print(f"Spec validation passed: {result.path}")

        if result.warnings:
            print("\nWarnings:")
            for warning in result.warnings:
                print(f"- {warning}")


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    results = [build_result(Path(spec_file), args.strict) for spec_file in args.spec_files]
    ok = all(result.ok for result in results)

    if args.format == "json":
        payload = {
            "ok": ok,
            "error_count": sum(len(result.errors) for result in results),
            "warning_count": sum(len(result.warnings) for result in results),
            "results": [asdict(result) for result in results],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print_text_results(results)

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
