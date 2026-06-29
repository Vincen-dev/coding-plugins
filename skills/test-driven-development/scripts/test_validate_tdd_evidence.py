#!/usr/bin/env python3
"""Regression tests for validate_tdd_evidence.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


VALIDATOR = Path(__file__).with_name("validate_tdd_evidence.py")
FIXTURES = Path(__file__).with_name("fixtures")


GOOD_EVIDENCE = """# Task Report

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **RED 测试:** `tests/test_export.py::test_exports_version`
- **RED 命令:** `pytest tests/test_export.py::test_exports_version -v`
- **RED 失败:** AssertionError because exported payload lacks version
- **GREEN 变更:** Added version field to export payload
- **GREEN 命令:** `pytest tests/test_export.py::test_exports_version -v`
- **REFACTOR 命令:** `pytest tests/test_export.py -v`
- **最终验证:** `pytest tests/test_export.py -v` PASS
"""


MISSING_RED_COMMAND = """# Task Report

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **RED 测试:** `tests/test_export.py::test_exports_version`
- **RED 失败:** AssertionError because exported payload lacks version
- **GREEN 变更:** Added version field to export payload
- **GREEN 命令:** `pytest tests/test_export.py::test_exports_version -v`
- **REFACTOR 命令:** `pytest tests/test_export.py -v`
- **最终验证:** `pytest tests/test_export.py -v` PASS
"""


EXCEPTION_ONLY = """# Task Report

## TDD 例外记录

- **原因:** Manifest metadata-only change with no executable behavior
- **用户批准:** User explicitly approved skipping TDD for this metadata update
- **替代验证:** `python3 validate_plugin.py .` PASS
- **风险:** Low; plugin manifest validation covers schema compatibility
"""


INCOMPLETE_EXCEPTION = """# Task Report

## TDD 例外记录

- **原因:** Manifest metadata-only change with no executable behavior
- **用户批准:** User explicitly approved skipping TDD for this metadata update
"""


SUSPICIOUS_REPORT = """# Task Report

先实现后补测试。

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **RED 测试:** `tests/test_export.py::test_exports_version`
- **RED 命令:** `pytest tests/test_export.py::test_exports_version -v`
- **RED 失败:** AssertionError because exported payload lacks version
- **GREEN 变更:** Added version field to export payload
- **GREEN 命令:** `pytest tests/test_export.py::test_exports_version -v`
- **REFACTOR 命令:** `pytest tests/test_export.py -v`
- **最终验证:** `pytest tests/test_export.py -v` PASS
"""


ENGLISH_DISPLAY_REPORT = """# Task Report

## TDD Evidence

- **Spec/Bug/AC:** REQ-001
- **RED test:** `tests/test_export.py::test_exports_version`
- **RED command:** `pytest tests/test_export.py::test_exports_version -v`
- **RED failure:** AssertionError because exported payload lacks version
- **GREEN change:** Added version field to export payload
- **GREEN command:** `pytest tests/test_export.py::test_exports_version -v`
- **REFACTOR command:** `pytest tests/test_export.py -v`
- **Final verification:** `pytest tests/test_export.py -v` PASS
"""


WEAK_SOURCE = GOOD_EVIDENCE.replace("REQ-001", "task request")


class ValidateTddEvidenceTests(unittest.TestCase):
    def run_validator(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(VALIDATOR), *args],
            check=False,
            text=True,
            capture_output=True,
        )

    def write_report(self, directory: Path, name: str, text: str) -> Path:
        path = directory / name
        path.write_text(text, encoding="utf-8")
        return path

    def test_accepts_multiple_files_and_json_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            first = self.write_report(directory, "first.md", GOOD_EVIDENCE)
            second = self.write_report(directory, "second.md", EXCEPTION_ONLY)

            result = self.run_validator("--format", "json", str(first), str(second))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(len(payload["results"]), 2)

    def test_missing_required_evidence_field_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = self.write_report(Path(tmp), "missing-red-command.md", MISSING_RED_COMMAND)
            result = self.run_validator(str(report))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("RED 命令", result.stdout)

    def test_accepts_complete_exception_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = self.write_report(Path(tmp), "exception.md", EXCEPTION_ONLY)
            result = self.run_validator(str(report))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_incomplete_exception_record_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = self.write_report(Path(tmp), "incomplete-exception.md", INCOMPLETE_EXCEPTION)
            result = self.run_validator(str(report))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("替代验证", result.stdout)
        self.assertIn("风险", result.stdout)

    def test_suspicious_after_the_fact_wording_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = self.write_report(Path(tmp), "suspicious.md", SUSPICIOUS_REPORT)
            result = self.run_validator(str(report))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("after-the-fact", result.stdout)

    def test_strict_promotes_weak_source_warning(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = self.write_report(Path(tmp), "weak-source.md", WEAK_SOURCE)
            result = self.run_validator(str(report))
            strict_result = self.run_validator("--strict", str(report))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("does not look traceable", result.stdout)
        self.assertNotEqual(strict_result.returncode, 0)
        self.assertIn("does not look traceable", strict_result.stdout)

    def test_english_display_fields_fail_validation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = self.write_report(Path(tmp), "english-display.md", ENGLISH_DISPLAY_REPORT)
            result = self.run_validator(str(report))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Missing TDD 证据 or TDD 例外记录 section", result.stdout)

    def test_fixture_valid_tdd_evidence_passes_strict_validation(self) -> None:
        result = self.run_validator("--strict", str(FIXTURES / "valid-tdd-evidence.md"))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_fixture_invalid_after_the_fact_evidence_fails_validation(self) -> None:
        result = self.run_validator("--strict", str(FIXTURES / "invalid-after-the-fact-evidence.md"))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("after-the-fact", result.stdout)


if __name__ == "__main__":
    unittest.main()
