#!/usr/bin/env python3
"""Regression tests for feature document scaffold creation."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import scaffold_feature_docs


class ScaffoldFeatureDocsTests(unittest.TestCase):
    def test_creates_feature_readme_prd_and_subdirectories(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            result = scaffold_feature_docs.scaffold_feature(
                root,
                "metadata-chain",
                "文档关系链路",
                current_date="2026-07-01",
                tags=["metadata", "sdd"],
            )

            feature_root = root / "docs" / "coding-plugins" / "features" / "metadata-chain"
            self.assertEqual(
                sorted(path.relative_to(root) for path in result.created),
                [
                    Path("docs/coding-plugins/features/metadata-chain/README.md"),
                    Path("docs/coding-plugins/features/metadata-chain/requirements/metadata-chain-PRD.md"),
                ],
            )
            for directory in ("requirements", "technicals", "test-cases", "plans", "evidences"):
                self.assertTrue((feature_root / directory).is_dir())

            readme = (feature_root / "README.md").read_text(encoding="utf-8")
            prd = (feature_root / "requirements" / "metadata-chain-PRD.md").read_text(encoding="utf-8")
            self.assertIn("feature: metadata-chain", readme)
            self.assertIn("  - metadata", readme)
            self.assertIn("related_test_cases: []", prd)
            self.assertIn("## 追踪矩阵", prd)

    def test_creates_custom_doc_id_prd_inside_feature(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            result = scaffold_feature_docs.scaffold_feature(
                root,
                "routing",
                "登录路由",
                doc_id="routing-login",
                current_date="2026-07-01",
            )

            feature_root = root / "docs" / "coding-plugins" / "features" / "routing"
            prd = feature_root / "requirements" / "routing-login-PRD.md"
            self.assertIn(prd, result.created)
            text = prd.read_text(encoding="utf-8")
            self.assertNotIn("spec_id:", text)
            self.assertIn("feature: routing", text)
            self.assertIn("doc_id: routing-login", text)
            self.assertIn("| Doc ID | routing-login |", text)

    def test_does_not_overwrite_existing_files_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_root = root / "docs" / "coding-plugins" / "features" / "routing"
            (feature_root / "requirements").mkdir(parents=True)
            readme = feature_root / "README.md"
            readme.write_text("custom", encoding="utf-8")

            result = scaffold_feature_docs.scaffold_feature(root, "routing", "路由", current_date="2026-07-01")

            self.assertEqual(readme.read_text(encoding="utf-8"), "custom")
            self.assertIn(readme, result.skipped)
            self.assertTrue((feature_root / "requirements" / "routing-PRD.md").exists())

    def test_force_overwrites_existing_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_root = root / "docs" / "coding-plugins" / "features" / "routing"
            feature_root.mkdir(parents=True)
            readme = feature_root / "README.md"
            readme.write_text("custom", encoding="utf-8")

            scaffold_feature_docs.scaffold_feature(
                root,
                "routing",
                "路由",
                current_date="2026-07-01",
                force=True,
            )

            self.assertIn("feature: routing", readme.read_text(encoding="utf-8"))

    def test_rejects_nested_feature_name(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, "路径分隔符"):
                scaffold_feature_docs.scaffold_feature(Path(tmp), "area/routing", "路由")

    def test_rejects_nested_doc_id(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(ValueError, "路径分隔符"):
                scaffold_feature_docs.scaffold_feature(Path(tmp), "routing", "路由", doc_id="auth/login")


if __name__ == "__main__":
    unittest.main()
