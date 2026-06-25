#!/usr/bin/env python3
"""Validate a Markdown SDD specification for minimum planning readiness."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)-\d{3,}\b")
PLACEHOLDER_RE = re.compile(r"<[^>\n]{2,}>|\bTODO\b|\bTBD\b|待补充|待定|占位")
MAYBE_AMBIGUOUS = ("适当", "友好", "常见情况", "尽快", "合理", "必要时")


@dataclass(frozen=True)
class Table:
    headers: list[str]
    rows: list[list[str]]
    start_line: int


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a Markdown SDD spec for Spec IDs, traceability, and placeholders."
    )
    parser.add_argument("spec_file", help="Path to the Markdown specification file.")
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
    trace_ids: set[str] = set()

    for table in tables:
        header_text = " | ".join(table.headers).lower()
        is_trace_table = "spec id" in header_text and (
            "verification" in header_text or "test file" in header_text or "command" in header_text
        )

        for offset, row in enumerate(table.rows, start=2):
            line_no = table.start_line + offset
            row_text = " | ".join(row)
            row_ids = set(SPEC_ID_RE.findall(row_text))
            priority = get_cell(row, table.headers, ("priority",))

            if priority in {"MUST", "SHOULD"} and not row_ids:
                errors.append(f"Line {line_no}: {priority} row is missing a Spec ID.")

            if priority == "MUST":
                must_ids.update(row_ids)
                verification = get_cell(row, table.headers, ("verification",))
                if not verification or contains_placeholder(verification):
                    errors.append(f"Line {line_no}: MUST row lacks concrete verification evidence.")

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

    if must_ids and not trace_ids:
        errors.append("MUST requirements exist but no Traceability Matrix rows were found.")

    missing_trace = sorted(must_ids - trace_ids)
    if missing_trace:
        errors.append("MUST requirements missing from Traceability Matrix: " + ", ".join(missing_trace) + ".")

    if strict and warnings:
        errors.extend(warnings)
        warnings = []

    return errors, warnings


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    errors, warnings = validate_spec(Path(args.spec_file), args.strict)

    if errors:
        print(f"Spec validation failed: {args.spec_file}")
        print("\nErrors:")
        for error in errors:
            print(f"- {error}")
    else:
        print(f"Spec validation passed: {args.spec_file}")

    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"- {warning}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
