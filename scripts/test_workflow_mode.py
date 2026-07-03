#!/usr/bin/env python3
"""Regression tests for workflow mode inference."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import workflow_mode


class WorkflowModeTests(unittest.TestCase):
    def test_analysis_only_for_read_or_explain_requests(self) -> None:
        result = workflow_mode.infer_mode("帮我分析当前架构，不要改代码")

        self.assertEqual(result["mode"], "analysis-only")
        self.assertIn("analysis", result["reason"])

    def test_docs_only_for_documentation_changes(self) -> None:
        result = workflow_mode.infer_mode(
            "更新 README 和安装说明",
            files=["README.md", "docs/installation.md"],
            task_count=2,
        )

        self.assertEqual(result["mode"], "docs-only")

    def test_tdd_only_for_small_clear_behavior_change(self) -> None:
        result = workflow_mode.infer_mode(
            "修复登录按钮禁用状态的一个明确 bug",
            files=["lib/login_button.ts", "tests/login_button.test.ts"],
            task_count=2,
        )

        self.assertEqual(result["mode"], "tdd-only")

    def test_full_chain_for_schema_or_api_contract_change(self) -> None:
        result = workflow_mode.infer_mode(
            "新增公开 API schema 和状态机契约",
            files=["src/api/schema.ts", "docs/api.md"],
            task_count=3,
        )

        self.assertEqual(result["mode"], "full-chain")

    def test_maintenance_chain_for_migration_with_compatibility_risk(self) -> None:
        result = workflow_mode.infer_mode(
            "升级依赖并迁移缓存格式，需要保持兼容和验证口径",
            files=["package.json", "src/cache/migrate.ts"],
            task_count=3,
        )

        self.assertEqual(result["mode"], "maintenance-chain")

    def test_explicit_mode_override_is_honored(self) -> None:
        result = workflow_mode.infer_mode(
            "更新 README",
            files=["README.md"],
            explicit_mode="full-chain",
        )

        self.assertEqual(result["mode"], "full-chain")
        self.assertTrue(result["explicit"])


if __name__ == "__main__":
    unittest.main()
