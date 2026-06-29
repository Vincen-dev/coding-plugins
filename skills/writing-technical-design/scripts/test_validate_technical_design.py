#!/usr/bin/env python3
"""Tests for the standalone technical design validator."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import validate_technical_design as validator


SCRIPT_PATH = Path(__file__).resolve().with_name("validate_technical_design.py")


class TechnicalDesignValidatorTests(unittest.TestCase):
    def write_feature(
        self,
        root: Path,
        *,
        spec_updated: str = "2026-06-29",
        technical_updated: str = "2026-06-29",
        mapping_rows: str = "| REQ-001 | `scripts/preflight.py` | 具体设计 | 单测 |\n",
        related_evidence: bool = True,
        include_mapping_section: bool = True,
        include_technical_updated: bool = True,
    ) -> Path:
        feature_root = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
        spec_dir = feature_root / "specs"
        technical_dir = feature_root / "technical"
        plan_dir = feature_root / "plans"
        evidence_dir = feature_root / "evidence"
        spec_dir.mkdir(parents=True)
        technical_dir.mkdir()
        plan_dir.mkdir()
        evidence_dir.mkdir()

        (spec_dir / "feature.md").write_text(
            "---\n"
            "status: approved\n"
            "area: plugin\n"
            "capability: routing\n"
            f"updated: {spec_updated}\n"
            "---\n"
            "# Feature\n\n"
            "| 编号 | 优先级 | 需求 | 验证方式 |\n"
            "| --- | --- | --- | --- |\n"
            "| REQ-001 | 必须 | 必须有技术设计落点 | 单测 |\n",
            encoding="utf-8",
        )
        (plan_dir / "implementation.md").write_text("# Plan\n", encoding="utf-8")
        (evidence_dir / "tdd-evidence.md").write_text("# Evidence\n", encoding="utf-8")

        updated_line = f"updated: {technical_updated}\n" if include_technical_updated else ""
        evidence_metadata = (
            "related_evidence:\n"
            "  - docs/coding-plugins/features/plugin/routing/evidence/tdd-evidence.md\n"
            if related_evidence
            else ""
        )
        mapping_section = (
            "## 规格到设计映射\n\n"
            "| Spec ID | 技术落点 | 设计决策 | 测试策略 |\n"
            "| --- | --- | --- | --- |\n"
            f"{mapping_rows}\n"
            if include_mapping_section
            else ""
        )
        technical = technical_dir / "technical-design.md"
        technical.write_text(
            "---\n"
            "title: 技术设计\n"
            "status: approved\n"
            "area: plugin\n"
            "capability: routing\n"
            "created: 2026-06-29\n"
            f"{updated_line}"
            "related_specs:\n"
            "  - docs/coding-plugins/features/plugin/routing/specs/feature.md\n"
            "related_plans:\n"
            "  - docs/coding-plugins/features/plugin/routing/plans/implementation.md\n"
            f"{evidence_metadata}"
            "---\n\n"
            "# 技术设计\n\n"
            "## 文档信息\n\n"
            "| 字段 | 内容 |\n"
            "| --- | --- |\n"
            "| 状态 | 已批准 |\n"
            "| 领域 | plugin |\n"
            "| 能力 | routing |\n\n"
            "## 设计摘要\n\n"
            "设计摘要。\n\n"
            "## 规格缺口审查\n\n"
            "| 检查项 | 结论 |\n"
            "| --- | --- |\n"
            "| 未覆盖需求 | 无。 |\n"
            "| 验收标准不清 | 无。 |\n"
            "| 新增外部行为 | 无。 |\n"
            "| 处理状态 | 通过，未发现需要回写 spec 的缺口。 |\n\n"
            f"{mapping_section}"
            "## 无需技术设计的规格\n\n"
            "| Spec ID | 原因 |\n"
            "| --- | --- |\n"
            "| 无 | 全部 MUST 规格都有技术落点。 |\n",
            encoding="utf-8",
        )
        return technical

    def test_validator_rejects_missing_required_sections(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root, include_mapping_section=False)

            result = validator.validate_repository(root, strict=False)

            self.assertFalse(result.ok)
            self.assertIn("missing required section", "\n".join(result.errors))

    def test_validator_rejects_missing_must_spec_mapping(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root, mapping_rows="| REQ-999 | `scripts/preflight.py` | 错误映射 | 单测 |\n")

            result = validator.validate_repository(root, strict=False)

            self.assertFalse(result.ok)
            self.assertIn("does not cover required Spec IDs", "\n".join(result.errors))
            self.assertIn("REQ-001", "\n".join(result.errors))

    def test_validator_rejects_missing_related_metadata_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root, related_evidence=False)

            result = validator.validate_repository(root, strict=False)

            self.assertFalse(result.ok)
            self.assertIn("related metadata", "\n".join(result.errors))
            self.assertIn("related_evidence", "\n".join(result.errors))

    def test_validator_warns_about_generic_mapping(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(
                root,
                mapping_rows=(
                    "| REQ-001 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 "
                    "| 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |\n"
                ),
            )

            result = validator.validate_repository(root, strict=False)

            self.assertTrue(result.ok)
            self.assertIn("generic mapping", "\n".join(result.warnings))

    def test_strict_validator_rejects_generic_mapping(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(
                root,
                mapping_rows=(
                    "| REQ-001 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 "
                    "| 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |\n"
                ),
            )

            result = validator.validate_repository(root, strict=True)

            self.assertFalse(result.ok)
            self.assertIn("generic mapping", "\n".join(result.errors))

    def test_validator_warns_when_spec_is_newer_than_technical(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root, spec_updated="2026-06-30", technical_updated="2026-06-29")

            result = validator.validate_repository(root, strict=False)

            self.assertTrue(result.ok)
            self.assertIn("stale technical", "\n".join(result.warnings))

    def test_strict_validator_rejects_stale_technical(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root, spec_updated="2026-06-30", technical_updated="2026-06-29")

            result = validator.validate_repository(root, strict=True)

            self.assertFalse(result.ok)
            self.assertIn("stale technical", "\n".join(result.errors))

    def test_validator_skips_stale_check_when_updated_is_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root, spec_updated="2026-06-30", include_technical_updated=False)

            result = validator.validate_repository(root, strict=True)

            self.assertTrue(result.ok)
            self.assertNotIn("stale technical", "\n".join(result.errors + result.warnings))

    def test_cli_validates_repository_technical_docs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_feature(root)

            completed = subprocess.run(
                [sys.executable, str(SCRIPT_PATH), "--root", str(root), "--format", "json"],
                check=False,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            self.assertEqual(completed.returncode, 0, completed.stderr)
            payload = json.loads(completed.stdout)
            self.assertTrue(payload["ok"])
            self.assertEqual(payload["error_count"], 0)


if __name__ == "__main__":
    raise SystemExit(unittest.main())
