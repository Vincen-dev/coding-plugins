#!/usr/bin/env python3
"""Regression tests for generated Coding Plugins document index."""

from __future__ import annotations

import tempfile
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import docs_index
import preflight


class DocsIndexTests(unittest.TestCase):
    def test_docs_index_module_exposes_index_contract(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "search"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "README.md").write_text(
                "---\n"
                "title: 搜索\n"
                "status: approved\n"
                "feature: search\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - search\n"
                "---\n"
                "# Search\n",
                encoding="utf-8",
            )
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text(
                "---\nupdated: 2026-06-29\n---\n# Feature\n",
                encoding="utf-8",
            )
            (feature_dir / "test-cases").mkdir()
            (feature_dir / "test-cases" / f"{feature_dir.name}-TCD.md").write_text(
                "---\nupdated: 2026-06-29\n---\n# Test cases\n",
                encoding="utf-8",
            )

            rendered = docs_index.render_artifact_index(root)

            self.assertIn("`docs/coding-plugins/features/search`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/requirements/search-PRD.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/test-cases/search-TCD.md`", rendered)
            self.assertIn("| Feature | Doc ID | 功能根目录 |", rendered)
            self.assertIn("| search | search | `docs/coding-plugins/features/search` |", rendered)
            self.assertIn("| search | 2026-06-29 |", rendered)

    def test_docs_index_renders_one_row_per_doc_id(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "search"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "technicals").mkdir()
            (feature_dir / "README.md").write_text(
                "---\n"
                "title: 搜索\n"
                "status: approved\n"
                "feature: search\n"
                "updated: 2026-07-01\n"
                "tags:\n"
                "  - search\n"
                "---\n"
                "# Search\n",
                encoding="utf-8",
            )
            (feature_dir / "requirements" / "search-basic-PRD.md").write_text(
                "---\nupdated: 2026-07-01\n---\n# Basic\n",
                encoding="utf-8",
            )
            (feature_dir / "requirements" / "search-advanced-PRD.md").write_text(
                "---\nupdated: 2026-07-02\n---\n# Advanced\n",
                encoding="utf-8",
            )
            (feature_dir / "technicals" / "search-basic-TDD.md").write_text(
                "---\nupdated: 2026-07-03\n---\n# Basic TDD\n",
                encoding="utf-8",
            )

            rendered = docs_index.render_artifact_index(root)

            self.assertIn(
                "| search | search-basic | `docs/coding-plugins/features/search` | "
                "`docs/coding-plugins/features/search/requirements/search-basic-PRD.md` | "
                "`docs/coding-plugins/features/search/technicals/search-basic-TDD.md` |",
                rendered,
            )
            self.assertIn(
                "| search | search-advanced | `docs/coding-plugins/features/search` | "
                "`docs/coding-plugins/features/search/requirements/search-advanced-PRD.md` | - |",
                rendered,
            )

    def test_docs_index_uses_readme_frontmatter_tags_not_body_table(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text(
                "---\n"
                "title: 搜索\n"
                "status: approved\n"
                "feature: search\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - frontmatter-tag\n"
                "---\n"
                "# Search\n\n"
                "| 字段 | 内容 |\n"
                "| --- | --- |\n"
                "| 标签 | stale-body-tag |\n",
                encoding="utf-8",
            )

            rendered = docs_index.render_artifact_index(root)

            self.assertIn("| frontmatter-tag |", rendered)
            self.assertNotIn("stale-body-tag", rendered)

    def test_preflight_delegates_artifact_index_checks_to_docs_index(self) -> None:
        self.assertIs(preflight.render_artifact_index, docs_index.render_artifact_index)
        self.assertIs(preflight.write_artifact_index, docs_index.write_artifact_index)

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs_root = root / "docs" / "coding-plugins"
            feature_dir = docs_root / "features" / "search"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "README.md").write_text(
                "---\n"
                "title: 搜索\n"
                "status: approved\n"
                "feature: search\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - search\n"
                "---\n"
                "# Search\n",
                encoding="utf-8",
            )
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text(
                "---\nupdated: 2026-06-29\n---\n# Feature\n",
                encoding="utf-8",
            )
            docs_index.write_artifact_index(root)

            preflight.check_artifact_index_covers_documents(root)


if __name__ == "__main__":
    unittest.main()
