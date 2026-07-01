#!/usr/bin/env python3
"""Regression tests for document contract migration helpers."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import migrate_document_contract


class DocumentContractMigrationTests(unittest.TestCase):
    def test_migrates_status_aliases_and_splits_related_spec_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "features" / "demo-app" / "evidence"
            evidence_dir.mkdir(parents=True)
            evidence = evidence_dir / "tdd-evidence.md"
            evidence.write_text(
                "---\n"
                "feature: demo-app\n"
                "status: 已实现\n"
                "related_specs:\n"
                "  - REQ-DEMO-009\n"
                "  - docs/coding-plugins/features/demo-app/specs/feature.md\n"
                "---\n"
                "# Evidence\n",
                encoding="utf-8",
            )

            changed = migrate_document_contract.migrate_root(root)
            migrated = evidence.read_text(encoding="utf-8")

        self.assertTrue(changed)
        self.assertIn("status: covered", migrated)
        self.assertIn("related_specs:", migrated)
        self.assertIn("docs/coding-plugins/features/demo-app/specs/feature.md", migrated)
        self.assertIn("related_spec_ids:", migrated)
        self.assertIn("REQ-DEMO-009", migrated)
        self.assertIn("title: demo-app TDD Evidence", migrated)
        self.assertIn("created:", migrated)
        self.assertIn("updated:", migrated)

    def test_dry_run_reports_without_writing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "features" / "demo-app" / "evidence"
            evidence_dir.mkdir(parents=True)
            evidence = evidence_dir / "tdd-evidence.md"
            original = (
                "---\n"
                "feature: demo-app\n"
                "status: 已实现\n"
                "---\n"
                "# Evidence\n"
            )
            evidence.write_text(original, encoding="utf-8")

            changed = migrate_document_contract.migrate_root(root, dry_run=True)

            self.assertTrue(changed)
            self.assertEqual(evidence.read_text(encoding="utf-8"), original)


if __name__ == "__main__":
    unittest.main()
