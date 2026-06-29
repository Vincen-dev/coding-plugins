#!/usr/bin/env python3
"""Regression tests for validate_spec.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


VALIDATOR = Path(__file__).with_name("validate_spec.py")
FIXTURES = Path(__file__).with_name("fixtures")


GOOD_SPEC = """# Export Config Specification

## Functional Requirements

| ID | Priority | Requirement | Verification |
| --- | --- | --- | --- |
| REQ-001 | MUST | Exported config output includes a non-empty `version` field. | Unit test for exported config payload. |

## Traceability

| Spec ID | Verification type | Test file / command | Plan task | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | unit test | `python3 -m pytest tests/test_export_config.py` | Task 1 | planned |
"""


CHINESE_SPEC = """# 导出配置规格

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 导出的配置结果必须包含非空 `version` 字段。 | 单元测试验证导出配置 payload。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m pytest tests/test_export_config.py` | Task 1 | 计划中 |
"""


SHOULD_UNTRACED_SPEC = """# Export Config Specification

## Functional Requirements

| ID | Priority | Requirement | Verification |
| --- | --- | --- | --- |
| REQ-001 | MUST | Exported config output includes a non-empty `version` field. | Unit test for exported config payload. |
| REQ-002 | SHOULD | The version value follows the current project schema version. | Unit test for version value. |

## Traceability

| Spec ID | Verification type | Test file / command | Plan task | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | unit test | `python3 -m pytest tests/test_export_config.py` | Task 1 | planned |
"""


DUPLICATE_ID_SPEC = """# Duplicate ID Specification

## Functional Requirements

| ID | Priority | Requirement | Verification |
| --- | --- | --- | --- |
| REQ-001 | MUST | Export includes a version field. | Unit test. |
| REQ-001 | MUST | Export includes an owner field. | Unit test. |

## Traceability

| Spec ID | Verification type | Test file / command | Plan task | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | unit test | `python3 -m pytest tests/test_export_config.py` | Task 1 | planned |
"""


BAD_STATUS_SPEC = """# Bad Status Specification

## Functional Requirements

| ID | Priority | Requirement | Verification |
| --- | --- | --- | --- |
| REQ-001 | MUST | Export includes a version field. | Unit test. |

## Traceability

| Spec ID | Verification type | Test file / command | Plan task | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | unit test | `python3 -m pytest tests/test_export_config.py` | Task 1 | maybe |
"""


class ValidateSpecTests(unittest.TestCase):
    def run_validator(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(VALIDATOR), *args],
            check=False,
            text=True,
            capture_output=True,
        )

    def write_spec(self, directory: Path, name: str, text: str) -> Path:
        path = directory / name
        path.write_text(text, encoding="utf-8")
        return path

    def test_accepts_multiple_files_and_json_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            first = self.write_spec(directory, "first.md", GOOD_SPEC)
            second = self.write_spec(directory, "second.md", GOOD_SPEC.replace("REQ-001", "REQ-002"))

            result = self.run_validator("--format", "json", str(first), str(second))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(len(payload["results"]), 2)

    def test_accepts_chinese_headers_and_statuses(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            spec = self.write_spec(Path(tmp), "chinese.md", CHINESE_SPEC)
            result = self.run_validator("--strict", str(spec))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_duplicate_definition_id_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            spec = self.write_spec(Path(tmp), "duplicate.md", DUPLICATE_ID_SPEC)
            result = self.run_validator(str(spec))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Duplicate Spec ID definition", result.stdout)

    def test_invalid_traceability_status_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            spec = self.write_spec(Path(tmp), "bad-status.md", BAD_STATUS_SPEC)
            result = self.run_validator(str(spec))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("invalid traceability status", result.stdout)

    def test_should_missing_traceability_is_warning(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            spec = self.write_spec(Path(tmp), "should-warning.md", SHOULD_UNTRACED_SPEC)
            result = self.run_validator(str(spec))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("SHOULD requirements missing from Traceability Matrix", result.stdout)

    def test_strict_promotes_should_traceability_warning(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            spec = self.write_spec(Path(tmp), "should-warning.md", SHOULD_UNTRACED_SPEC)
            result = self.run_validator("--strict", str(spec))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SHOULD requirements missing from Traceability Matrix", result.stdout)

    def test_fixture_valid_feature_spec_passes_strict_validation(self) -> None:
        result = self.run_validator("--strict", str(FIXTURES / "valid-feature-spec.md"))

        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_fixture_invalid_placeholder_spec_fails_validation(self) -> None:
        result = self.run_validator("--strict", str(FIXTURES / "invalid-placeholder-spec.md"))

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unresolved placeholder", result.stdout)


if __name__ == "__main__":
    unittest.main()
