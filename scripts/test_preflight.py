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

    def test_collect_plan_files_uses_default_docs_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_dir = root / "docs" / "coding-plugins" / "plans" / "plugin" / "preflight"
            plan_dir.mkdir(parents=True)
            plan = plan_dir / "implementation.md"
            plan.write_text("# Implementation", encoding="utf-8")

            self.assertEqual(
                preflight.collect_plan_files(root),
                [plan],
            )

    def test_collect_technical_design_files_uses_default_docs_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            technical_dir = root / "docs" / "coding-plugins" / "technical" / "plugin" / "preflight"
            technical_dir.mkdir(parents=True)
            design = technical_dir / "technical-design.md"
            design.write_text("# Technical Design", encoding="utf-8")
            index = root / "docs" / "coding-plugins" / "technical" / "INDEX.md"
            index.write_text("# Technical Index", encoding="utf-8")

            self.assertEqual(
                preflight.collect_technical_design_files(root),
                [design],
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
        self.assertIn("test_bump_version.py", command_text)
        self.assertIn("tests.behavior.test_routing", command_text)
        self.assertIn("tests/hooks/test-session-start.sh", command_text)
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

    def test_codex_manifest_declares_hook_config(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({"hooks": "./hooks/hooks-codex.json"}),
                encoding="utf-8",
            )

            preflight.check_codex_hook_config_declared(root)

    def test_codex_manifest_rejects_missing_hook_config(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Codex manifest must declare hooks"):
                preflight.check_codex_hook_config_declared(root)

    def test_artifact_index_allows_empty_docs_tree(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            preflight.check_artifact_index_covers_documents(Path(tmp))

    def test_artifact_index_requires_index_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "specs" / "plugin" / "search"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text("# Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Missing artifact index"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_expected_headers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            spec_dir = docs / "specs" / "plugin" / "search"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text("# Feature", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Spec |\n| --- | --- | --- |\n| plugin | search | `docs/coding-plugins/specs/plugin/search/feature.md` |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing required columns"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_technical_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            technical_dir = docs / "technical" / "plugin" / "search"
            technical_dir.mkdir(parents=True)
            (technical_dir / "technical-design.md").write_text("# Technical", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Spec | Technical | Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_spec_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            spec_dir = docs / "specs" / "plugin" / "search"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text("# Feature", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Spec | Technical | Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_plan_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            plan_dir = docs / "plans" / "plugin" / "search"
            plan_dir.mkdir(parents=True)
            (plan_dir / "implementation.md").write_text("# Plan", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Spec | Technical | Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_evidence_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            evidence_dir = docs / "evidence" / "plugin" / "search"
            evidence_dir.mkdir(parents=True)
            (evidence_dir / "tdd-evidence.md").write_text("# Evidence", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Spec | Technical | Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_skill_agent_metadata_check_rejects_missing_agent_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill_dir = root / "skills" / "example-skill"
            skill_dir.mkdir(parents=True)
            (skill_dir / "SKILL.md").write_text("---\nname: example-skill\n---\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Skill is missing agents/openai.yaml"):
                preflight.check_skill_agent_metadata(root)

    def test_manifest_asset_check_rejects_missing_asset(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({"interface": {"logo": "./assets/missing.svg"}}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Manifest asset path does not exist"):
                preflight.check_manifest_asset_paths(root)

    def test_document_path_metadata_check_rejects_mismatched_spec_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "specs" / "plugin" / "routing"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "---\narea: plugin\ncapability: other\n---\n# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Spec metadata does not match path"):
                preflight.check_document_path_metadata(root)

    def test_evidence_spec_id_check_rejects_unknown_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "specs" / "plugin" / "routing"
            evidence_dir = root / "docs" / "coding-plugins" / "evidence" / "plugin" / "routing"
            spec_dir.mkdir(parents=True)
            evidence_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已知需求 | 单测 |\n",
                encoding="utf-8",
            )
            (evidence_dir / "tdd-evidence.md").write_text(
                "- **Spec/Bug/AC:** REQ-999\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "TDD evidence references unknown Spec IDs"):
                preflight.check_tdd_evidence_spec_ids(root)

    def test_technical_index_requires_design_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            technical_root = root / "docs" / "coding-plugins" / "technical"
            design_dir = technical_root / "plugin" / "routing"
            design_dir.mkdir(parents=True)
            (design_dir / "technical-design.md").write_text("# Technical", encoding="utf-8")
            (technical_root / "INDEX.md").write_text(
                "| Area | Capability | Technical | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| plugin | routing | - | routing | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical index is missing document paths"):
                preflight.check_technical_index_covers_designs(root)

    def test_spec_technical_reference_check_rejects_missing_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "specs" / "plugin" / "routing"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "---\narea: plugin\ncapability: routing\nrelated_technical:\n"
                "  - docs/coding-plugins/technical/plugin/routing/technical-design.md\n---\n"
                "# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Spec references missing technical design"):
                preflight.check_spec_technical_design_references(root)

    def test_plan_technical_design_source_check_rejects_missing_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_dir = root / "docs" / "coding-plugins" / "plans" / "plugin" / "routing"
            plan_dir.mkdir(parents=True)
            (plan_dir / "implementation.md").write_text("# Plan\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Plan is missing Technical Design Source"):
                preflight.check_plan_technical_design_references(root)

    def test_technical_design_spec_id_check_rejects_unknown_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "specs" / "plugin" / "routing"
            technical_dir = root / "docs" / "coding-plugins" / "technical" / "plugin" / "routing"
            spec_dir.mkdir(parents=True)
            technical_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已知需求 | 单测 |\n",
                encoding="utf-8",
            )
            (technical_dir / "technical-design.md").write_text(
                "---\narea: plugin\ncapability: routing\n---\n# Technical\n\nCovers REQ-999\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design references unknown Spec IDs"):
                preflight.check_technical_design_spec_ids(root)

    def test_docs_sync_check_rejects_missing_key_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docs").mkdir()
            (root / "README.md").write_text("python3 scripts/preflight.py\n", encoding="utf-8")
            (root / "docs" / "installation.md").write_text("hooks/hooks-codex.json\n", encoding="utf-8")
            (root / "docs" / "workflow-chain.md").write_text("docs/coding-plugins/INDEX.md\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Documentation is missing required path references"):
                preflight.check_documentation_path_references(root)

    def test_docs_sync_check_rejects_missing_release_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "docs").mkdir()
            baseline = "\n".join(
                (
                    "docs/coding-plugins/INDEX.md",
                    "hooks/hooks-codex.json",
                    "python3 scripts/preflight.py",
                )
            )
            (root / "README.md").write_text(baseline, encoding="utf-8")
            (root / "docs" / "installation.md").write_text(baseline, encoding="utf-8")
            (root / "docs" / "workflow-chain.md").write_text(baseline, encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Documentation is missing required path references"):
                preflight.check_documentation_path_references(root)

    def test_release_management_check_rejects_missing_release_notes_version(self) -> None:
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
            (root / ".version-bump.json").write_text(json.dumps({"version": "1.2.3"}), encoding="utf-8")
            (root / "RELEASE-NOTES.md").write_text("# Release Notes\n\n## 1.2.2\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "RELEASE-NOTES.md must include current version"):
                preflight.check_release_management_files(root)

    def test_release_management_check_rejects_mismatched_config_version(self) -> None:
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
            (root / ".version-bump.json").write_text(json.dumps({"version": "1.2.2"}), encoding="utf-8")
            (root / "RELEASE-NOTES.md").write_text("# Release Notes\n\n## 1.2.3\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Version bump config version differs"):
                preflight.check_release_management_files(root)


if __name__ == "__main__":
    unittest.main()
