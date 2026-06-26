#!/usr/bin/env python3
"""Regression tests for repository preflight checks."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import preflight


class PreflightTests(unittest.TestCase):
    def test_manifest_version_check_accepts_matching_versions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".claude-plugin").mkdir()
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )
            (root / ".claude-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )

            preflight.check_manifest_versions(root)

    def test_manifest_version_check_rejects_mismatched_versions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".claude-plugin").mkdir()
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )
            (root / ".claude-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.4"}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Manifest versions differ"):
                preflight.check_manifest_versions(root)

    def test_removed_entry_scan_ignores_git_and_detects_active_references(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".git").mkdir()
            (root / "docs").mkdir()
            removed_entry = "using-" + "superpowers"
            (root / ".git" / "packed-refs").write_text(removed_entry, encoding="utf-8")
            (root / "docs" / "usage.md").write_text(f"call {removed_entry}", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Removed entry reference"):
                preflight.check_removed_entry_references(root)

    def test_collect_spec_files_excludes_index(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            specs = root / "docs" / "coding-plugins" / "specs"
            feature_dir = specs / "plugin" / "preflight"
            feature_dir.mkdir(parents=True)
            (specs / "INDEX.md").write_text("# Specs Index", encoding="utf-8")
            (feature_dir / "feature.md").write_text("# Feature", encoding="utf-8")

            self.assertEqual(
                preflight.collect_spec_files(root),
                [feature_dir / "feature.md"],
            )

    def test_collect_tdd_evidence_files_uses_default_docs_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "evidence" / "plugin" / "preflight"
            evidence_dir.mkdir(parents=True)
            report = evidence_dir / "tdd-evidence.md"
            report.write_text("# TDD Evidence", encoding="utf-8")

            self.assertEqual(
                preflight.collect_tdd_evidence_files(root),
                [report],
            )

    def test_build_commands_include_core_validation_steps(self) -> None:
        commands = preflight.build_validation_commands(
            Path("/repo"),
            [Path("/repo/spec.md")],
            [Path("/repo/docs/coding-plugins/evidence/plugin/preflight/tdd-evidence.md")],
        )
        command_text = "\n".join(" ".join(command) for command in commands)

        self.assertIn("test_validate_spec.py", command_text)
        self.assertIn("test_validate_tdd_evidence.py", command_text)
        self.assertIn("validate_spec.py", command_text)
        self.assertIn("--strict docs/coding-plugins/evidence/plugin/preflight/tdd-evidence.md", command_text)

    def test_sdd_template_check_rejects_english_headings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            template_dir = root / "skills" / "spec-driven-development" / "templates"
            template_dir.mkdir(parents=True)
            (template_dir / "feature-spec.md").write_text(
                "# Feature Specification\n\n## Goal\n\n| ID | Requirement |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "SDD template still contains English structure"):
                preflight.check_sdd_templates_are_chinese(root)


if __name__ == "__main__":
    unittest.main()
