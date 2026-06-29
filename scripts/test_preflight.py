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
            specs = root / "docs" / "coding-plugins" / "features" / "plugin" / "preflight" / "specs"
            specs.mkdir(parents=True)
            (specs / "INDEX.md").write_text("# Specs Index", encoding="utf-8")
            (specs / "feature.md").write_text("# Feature", encoding="utf-8")

            self.assertEqual(
                preflight.collect_spec_files(root),
                [specs / "feature.md"],
            )

    def test_collect_tdd_evidence_files_uses_feature_first_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "preflight" / "evidence"
            evidence_dir.mkdir(parents=True)
            report = evidence_dir / "tdd-evidence.md"
            report.write_text("# TDD Evidence", encoding="utf-8")

            self.assertEqual(
                preflight.collect_tdd_evidence_files(root),
                [report],
            )

    def test_collect_plan_files_uses_feature_first_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "preflight"
            feature_dir.mkdir(parents=True)
            plan = feature_dir / "implementation.md"
            plan.write_text("# Implementation", encoding="utf-8")

            self.assertEqual(
                preflight.collect_plan_files(root),
                [plan],
            )

    def test_collect_technical_design_files_uses_feature_first_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "preflight"
            feature_dir.mkdir(parents=True)
            design = feature_dir / "technical-design.md"
            design.write_text("# Technical Design", encoding="utf-8")

            self.assertEqual(
                preflight.collect_technical_design_files(root),
                [design],
            )

    def test_feature_roots_require_readme(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "preflight"
            (feature_dir / "specs").mkdir(parents=True)
            (feature_dir / "specs" / "feature.md").write_text("# Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Feature root is missing README"):
                preflight.check_feature_readmes(root)

    def test_legacy_docs_roots_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            legacy_dir = root / "docs" / "coding-plugins" / "specs" / "plugin" / "preflight"
            legacy_dir.mkdir(parents=True)
            (legacy_dir / "feature.md").write_text("# Legacy Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Legacy docs path is no longer active"):
                preflight.check_legacy_docs_roots(root)

    def test_build_commands_include_core_validation_steps(self) -> None:
        commands = preflight.build_validation_commands(
            Path("/repo"),
            [Path("/repo/spec.md")],
            [Path("/repo/docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md")],
        )
        command_text = "\n".join(" ".join(command) for command in commands)

        self.assertIn("test_validate_spec.py", command_text)
        self.assertIn("test_validate_tdd_evidence.py", command_text)
        self.assertIn("test_bump_version.py", command_text)
        self.assertIn("tests.behavior.test_routing", command_text)
        self.assertIn("tests/hooks/test-session-start.sh", command_text)
        self.assertIn("validate_spec.py", command_text)
        self.assertIn("--strict docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md", command_text)

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
            spec_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "search" / "specs"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text("# Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Missing artifact index"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_expected_headers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            spec_dir = docs / "features" / "plugin" / "search" / "specs"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text("# Feature", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Spec |\n| --- | --- | --- |\n| plugin | search | `docs/coding-plugins/features/plugin/search/specs/feature.md` |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing required columns"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_feature_root_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "plugin" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text("# Search", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_technical_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "plugin" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "technical-design.md").write_text("# Technical", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | `docs/coding-plugins/features/plugin/search` | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_spec_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            spec_dir = docs / "features" / "plugin" / "search" / "specs"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text("# Feature", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | `docs/coding-plugins/features/plugin/search` | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_plan_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "plugin" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "implementation.md").write_text("# Plan", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | `docs/coding-plugins/features/plugin/search` | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_evidence_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            evidence_dir = docs / "features" / "plugin" / "search" / "evidence"
            evidence_dir.mkdir(parents=True)
            (evidence_dir / "tdd-evidence.md").write_text("# Evidence", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | `docs/coding-plugins/features/plugin/search` | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_render_artifact_index_includes_feature_metadata_and_documents(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "search"
            (feature_dir / "specs").mkdir(parents=True)
            (feature_dir / "evidence").mkdir()
            (feature_dir / "README.md").write_text(
                "# Search\n\n"
                "## 文档信息\n\n"
                "| 字段 | 内容 |\n"
                "| --- | --- |\n"
                "| 状态 | 已批准 |\n"
                "| 领域 | plugin |\n"
                "| 能力 | search |\n"
                "| 标签 | search, index |\n",
                encoding="utf-8",
            )
            (feature_dir / "specs" / "feature.md").write_text(
                "---\nupdated: 2026-06-29\n---\n# Feature\n",
                encoding="utf-8",
            )
            (feature_dir / "technical-design.md").write_text(
                "---\nupdated: 2026-06-28\n---\n# Technical\n",
                encoding="utf-8",
            )
            (feature_dir / "implementation.md").write_text(
                "---\nupdated: 2026-06-27\n---\n# Plan\n",
                encoding="utf-8",
            )
            (feature_dir / "evidence" / "tdd-evidence.md").write_text("# Evidence\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertIn("| plugin | search |", rendered)
            self.assertIn("`docs/coding-plugins/features/plugin/search`", rendered)
            self.assertIn("`docs/coding-plugins/features/plugin/search/specs/feature.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/plugin/search/technical-design.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/plugin/search/implementation.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/plugin/search/evidence/tdd-evidence.md`", rendered)
            self.assertIn("| search, index | 2026-06-29 |", rendered)

    def test_render_artifact_index_sorts_rows_and_joins_multiple_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            features_root = root / "docs" / "coding-plugins" / "features"
            alpha = features_root / "plugin" / "alpha"
            beta = features_root / "plugin" / "beta"
            (alpha / "specs").mkdir(parents=True)
            (beta / "specs").mkdir(parents=True)
            (alpha / "README.md").write_text("| 字段 | 内容 |\n| --- | --- |\n| 标签 | alpha |\n", encoding="utf-8")
            (beta / "README.md").write_text("| 字段 | 内容 |\n| --- | --- |\n| 标签 | beta |\n", encoding="utf-8")
            (alpha / "specs" / "schema.md").write_text("---\nupdated: 2026-06-28\n---\n# Schema\n", encoding="utf-8")
            (alpha / "specs" / "feature.md").write_text("---\nupdated: 2026-06-29\n---\n# Feature\n", encoding="utf-8")
            (beta / "specs" / "feature.md").write_text("---\nupdated: 2026-06-27\n---\n# Feature\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertLess(rendered.index("| plugin | alpha |"), rendered.index("| plugin | beta |"))
            self.assertIn(
                "`docs/coding-plugins/features/plugin/alpha/specs/feature.md`<br>"
                "`docs/coding-plugins/features/plugin/alpha/specs/schema.md`",
                rendered,
            )

    def test_render_artifact_index_handles_missing_tags(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text("# Search\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertIn("| plugin | search | `docs/coding-plugins/features/plugin/search` | - | - | - | - | - | - |", rendered)

    def test_render_artifact_index_handles_missing_updated_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "search"
            (feature_dir / "specs").mkdir(parents=True)
            (feature_dir / "README.md").write_text("| 字段 | 内容 |\n| --- | --- |\n| 标签 | search |\n", encoding="utf-8")
            (feature_dir / "specs" / "feature.md").write_text("# Feature\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertIn("| search | - |", rendered)

    def test_artifact_index_requires_generated_content_match(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "plugin" / "search"
            (feature_dir / "specs").mkdir(parents=True)
            (feature_dir / "README.md").write_text("| 字段 | 内容 |\n| --- | --- |\n| 标签 | search |\n", encoding="utf-8")
            (feature_dir / "specs" / "feature.md").write_text("---\nupdated: 2026-06-29\n---\n# Feature\n", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "# Coding Plugins Feature 索引\n\n"
                "本索引用于按 `Area` 和 `Capability` 检索 feature-first 文档链路。新增、移动、批准、废弃或拆分相关产物时同步更新本文件。\n\n"
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | search | `docs/coding-plugins/features/plugin/search` | `docs/coding-plugins/features/plugin/search/specs/feature.md` | - | - | - | wrong-tag | 2026-06-29 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index does not match generated content"):
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
            spec_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing" / "specs"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "---\narea: plugin\ncapability: other\n---\n# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Spec metadata does not match path"):
                preflight.check_document_path_metadata(root)

    def test_plan_metadata_check_rejects_missing_frontmatter(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "implementation.md").write_text("# Plan\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Plan metadata is incomplete"):
                preflight.check_plan_metadata(root)

    def test_plan_metadata_check_rejects_mismatched_path_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "implementation.md").write_text(
                "---\n"
                "title: 路由计划\n"
                "status: approved\n"
                "area: plugin\n"
                "capability: other\n"
                "created: 2026-06-26\n"
                "updated: 2026-06-26\n"
                "---\n"
                "# Plan\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Plan metadata does not match path"):
                preflight.check_plan_metadata(root)

    def test_document_info_check_rejects_missing_chinese_summary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "implementation.md").write_text(
                "---\n"
                "title: 路由计划\n"
                "status: approved\n"
                "area: plugin\n"
                "capability: routing\n"
                "created: 2026-06-26\n"
                "updated: 2026-06-26\n"
                "---\n"
                "# Plan\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Document is missing Chinese metadata summary"):
                preflight.check_chinese_document_info_sections(root)

    def test_evidence_spec_id_check_rejects_unknown_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
            spec_dir = feature_dir / "specs"
            evidence_dir = feature_dir / "evidence"
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
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "plugin" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "technical-design.md").write_text("# Technical", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | routing | `docs/coding-plugins/features/plugin/routing` | - | - | - | - | routing | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_spec_technical_reference_check_rejects_missing_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing" / "specs"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "---\narea: plugin\ncapability: routing\nrelated_technical:\n"
                "  - docs/coding-plugins/features/plugin/routing/technical-design.md\n---\n"
                "# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Spec references missing technical design"):
                preflight.check_spec_technical_design_references(root)

    def test_plan_technical_design_source_check_rejects_missing_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "implementation.md").write_text("# Plan\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Plan is missing Technical Design Source"):
                preflight.check_plan_technical_design_references(root)

    def test_technical_design_spec_id_check_rejects_unknown_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "plugin" / "routing"
            spec_dir = feature_dir / "specs"
            spec_dir.mkdir(parents=True)
            (spec_dir / "feature.md").write_text(
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已知需求 | 单测 |\n",
                encoding="utf-8",
            )
            (feature_dir / "technical-design.md").write_text(
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
