#!/usr/bin/env python3
"""Regression tests for fixture case scaffolding."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import preflight
import scaffold_fixture_case


class ScaffoldFixtureCaseTests(unittest.TestCase):
    def test_scaffold_creates_case_index_and_valid_document_chain(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            scaffold_fixture_case.scaffold_fixture_case(
                root,
                feature="cache-fixture",
                doc_id="cache-refresh",
                title="缓存刷新",
                case_id="CASE-CACHE-999",
                source_type="release_regression",
                source_reference="coding-plugins cache refresh",
                optimization_target="验证缓存刷新链路闭环",
                covered_risk="缓存未刷新导致 Codex 使用旧链路",
                current_date="2026-07-02",
            )

            feature_root = root / "docs" / "coding-plugins" / "features" / "cache-fixture"
            self.assertTrue((root / "CASE-INDEX.md").exists())
            self.assertTrue((feature_root / "README.md").exists())
            self.assertTrue((feature_root / "requirements" / "cache-refresh-PRD.md").exists())
            self.assertTrue((feature_root / "technicals" / "cache-refresh-TDD.md").exists())
            self.assertTrue((feature_root / "technicals" / "cache-refresh-TID.md").exists())
            self.assertTrue((feature_root / "test-cases" / "cache-refresh-TCD.md").exists())
            self.assertTrue((feature_root / "plans" / "cache-refresh-IPD.md").exists())
            self.assertTrue((feature_root / "evidences" / "cache-refresh-TED.md").exists())

            case_index = (root / "CASE-INDEX.md").read_text(encoding="utf-8")
            self.assertIn("## cache-fixture", case_index)
            self.assertIn("case_id: CASE-CACHE-999", case_index)

            preflight.check_formal_fixture_case_index(root)
            preflight.check_feature_document_chain_closure(root)
            preflight.check_traceability_closure(root)

    def test_scaffold_rejects_nested_feature_or_doc_id(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            with self.assertRaises(ValueError):
                scaffold_fixture_case.scaffold_fixture_case(
                    root,
                    feature="area/cache",
                    doc_id="cache-refresh",
                    title="缓存刷新",
                    case_id="CASE-CACHE-999",
                    source_type="release_regression",
                    source_reference="coding-plugins cache refresh",
                    optimization_target="验证缓存刷新链路闭环",
                    covered_risk="缓存未刷新导致 Codex 使用旧链路",
                )

            with self.assertRaises(ValueError):
                scaffold_fixture_case.scaffold_fixture_case(
                    root,
                    feature="cache-fixture",
                    doc_id="cache/refresh",
                    title="缓存刷新",
                    case_id="CASE-CACHE-999",
                    source_type="release_regression",
                    source_reference="coding-plugins cache refresh",
                    optimization_target="验证缓存刷新链路闭环",
                    covered_risk="缓存未刷新导致 Codex 使用旧链路",
                )


if __name__ == "__main__":
    unittest.main()
