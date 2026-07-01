#!/usr/bin/env python3
"""Validate Markdown reports for TDD evidence or an explicit TDD exception."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict
from dataclasses import dataclass
from pathlib import Path


EVIDENCE_HEADING_RE = re.compile(r"^\s{0,3}#{1,6}\s+TDD 证据\s*$", re.IGNORECASE | re.MULTILINE)
EXCEPTION_HEADING_RE = re.compile(
    r"^\s{0,3}#{1,6}\s+TDD 例外记录\s*$", re.IGNORECASE | re.MULTILINE
)
SPEC_SOURCE_RE = re.compile(
    r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}\b|bug|复现|验收|acceptance",
    re.IGNORECASE,
)
PLACEHOLDER_RE = re.compile(r"<[^>\n]{2,}>|\[[^\]\n]{2,}\]|\bTODO\b|\bTBD\b|待补充|待定|占位|\.\.\.")
SUSPICIOUS_RE = re.compile(
    r"先实现|后补测|补测试|测试后补|直接实现|先写代码|实现后写测试|test after|implemented first",
    re.IGNORECASE,
)

EVIDENCE_FIELDS = (
    "规格/缺陷/验收",
    "RED 测试",
    "RED 命令",
    "RED 失败",
    "GREEN 变更",
    "GREEN 命令",
    "REFACTOR 命令",
    "最终验证",
)
OPTIONAL_TEST_TYPE_FIELD = "测试类型"
ALLOWED_TEST_TYPES = {"behavior", "contract", "architecture", "source-scan", "config"}
BEHAVIOR_SOURCE_RE = re.compile(r"用户|点击|按钮|页面|界面|交互|流程|UI|widget|behavior", re.IGNORECASE)
EXCEPTION_FIELDS = (
    "原因",
    "用户批准",
    "替代验证",
    "风险",
)


@dataclass(frozen=True)
class ValidationResult:
    path: str
    ok: bool
    errors: list[str]
    warnings: list[str]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Markdown TDD evidence reports for RED/GREEN/REFACTOR proof."
    )
    parser.add_argument("evidence_files", nargs="+", help="Path(s) to Markdown report files.")
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        help="Output format. Use json for CI or editor integrations.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warning-level weak evidence as validation errors.",
    )
    return parser.parse_args(argv)


def field_pattern(label: str) -> re.Pattern[str]:
    escaped = re.escape(label)
    return re.compile(
        rf"^\s*(?:[-*]\s*)?(?:\*\*)?{escaped}\s*(?::\*\*|\*\*\s*:|:)\s*(.+?)\s*$",
        re.IGNORECASE | re.MULTILINE,
    )


def get_field(text: str, label: str) -> str | None:
    match = field_pattern(label).search(text)
    if not match:
        return None
    return match.group(1).strip()


def is_placeholder(value: str) -> bool:
    cleaned = value.strip().strip("`").strip()
    return not cleaned or bool(PLACEHOLDER_RE.search(cleaned))


def require_fields(text: str, labels: tuple[str, ...], section_name: str) -> list[str]:
    errors: list[str] = []
    for label in labels:
        value = get_field(text, label)
        if value is None:
            errors.append(f"{section_name} is missing required field: {label}.")
        elif is_placeholder(value):
            errors.append(f"{section_name} field {label!r} still contains a placeholder: {value!r}.")
    return errors


def validate_text(text: str, strict: bool) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not text.strip():
        return ["Evidence file is empty."], warnings

    if SUSPICIOUS_RE.search(text):
        errors.append("Suspicious after-the-fact testing wording found; TDD requires RED before implementation.")

    has_evidence = bool(EVIDENCE_HEADING_RE.search(text))
    has_exception = bool(EXCEPTION_HEADING_RE.search(text))

    if not has_evidence and not has_exception:
        errors.append("Missing TDD 证据 or TDD 例外记录 section.")

    if has_evidence:
        errors.extend(require_fields(text, EVIDENCE_FIELDS, "TDD 证据"))
        source = get_field(text, "规格/缺陷/验收")
        test_type = get_field(text, OPTIONAL_TEST_TYPE_FIELD)
        red_failure = get_field(text, "RED 失败")
        final_verification = get_field(text, "最终验证")

        if source and not is_placeholder(source) and not SPEC_SOURCE_RE.search(source):
            warnings.append(
                "规格/缺陷/验收 does not look traceable to a Spec ID, bug reproduction, or acceptance criterion."
            )

        if test_type:
            normalized_test_type = test_type.strip().strip("`").lower()
            if normalized_test_type not in ALLOWED_TEST_TYPES:
                errors.append(
                    "invalid 测试类型: "
                    + test_type
                    + ". Allowed: "
                    + ", ".join(sorted(ALLOWED_TEST_TYPES))
                    + "."
                )
            elif normalized_test_type == "source-scan" and source and BEHAVIOR_SOURCE_RE.search(source):
                warnings.append("source-scan should not be used as the primary proof for user-facing behavior.")

        if red_failure and re.search(r"\bpass(?:ed)?\b|通过", red_failure, re.IGNORECASE):
            warnings.append("RED 失败提到了类似通过的结果；请确认测试确实先失败。")

        if final_verification and re.search(r"not run|未运行|无法运行", final_verification, re.IGNORECASE):
            warnings.append("最终验证未运行；如果自动化被阻塞，请使用 TDD 例外记录。")

    if has_exception:
        errors.extend(require_fields(text, EXCEPTION_FIELDS, "TDD 例外记录"))

    if strict and warnings:
        errors.extend(warnings)
        warnings = []

    return errors, warnings


def build_result(path: Path, strict: bool) -> ValidationResult:
    if not path.exists():
        return ValidationResult(path=str(path), ok=False, errors=[f"File does not exist: {path}"], warnings=[])
    if not path.is_file():
        return ValidationResult(path=str(path), ok=False, errors=[f"Path is not a file: {path}"], warnings=[])

    text = path.read_text(encoding="utf-8")
    errors, warnings = validate_text(text, strict)
    return ValidationResult(path=str(path), ok=not errors, errors=errors, warnings=warnings)


def print_text_results(results: list[ValidationResult]) -> None:
    for index, result in enumerate(results):
        if index:
            print()

        if result.errors:
            print(f"TDD evidence validation failed: {result.path}")
            print("\nErrors:")
            for error in result.errors:
                print(f"- {error}")
        else:
            print(f"TDD evidence validation passed: {result.path}")

        if result.warnings:
            print("\nWarnings:")
            for warning in result.warnings:
                print(f"- {warning}")


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    results = [build_result(Path(evidence_file), args.strict) for evidence_file in args.evidence_files]
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
