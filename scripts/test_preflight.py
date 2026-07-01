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

            with self.assertRaisesRegex(preflight.PreflightError, "Removed residue reference"):
                preflight.check_removed_entry_references(root)

    def test_legacy_tdd_evidence_path_references_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            hooks = root / "hooks"
            hooks.mkdir()
            (hooks / "session-start-codex").write_text(
                "write evidence to docs/coding-plugins/evidence/<feature-name>/tdd-evidence.md\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Removed residue reference"):
                preflight.check_removed_entry_references(root)

    def test_superpowers_references_are_rejected_in_active_guidance(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill = root / "skills" / "using-git-worktrees"
            skill.mkdir(parents=True)
            (skill / "SKILL.md").write_text(
                "fallback to ~/.config/superpowers/worktrees/project\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Removed residue reference"):
                preflight.check_removed_entry_references(root)

    def test_removed_residue_scan_allows_release_history(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "RELEASE-NOTES.md").write_text(
                "old docs/coding-plugins/evidence/<feature-name>/tdd-evidence.md and superpowers history\n",
                encoding="utf-8",
            )

            preflight.check_removed_entry_references(root)

    def test_collect_spec_files_excludes_index(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            requirements = root / "docs" / "coding-plugins" / "features" / "preflight" / "requirements"
            requirements.mkdir(parents=True)
            (requirements / "INDEX.md").write_text("# Specs Index", encoding="utf-8")
            (requirements / f"{requirements.parent.name}-PRD.md").write_text("# Feature", encoding="utf-8")

            self.assertEqual(
                preflight.collect_spec_files(root),
                [requirements / f"{requirements.parent.name}-PRD.md"],
            )

    def test_collect_tdd_evidence_files_uses_feature_first_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "features" / "preflight" / "evidences"
            evidence_dir.mkdir(parents=True)
            report = evidence_dir / f"{evidence_dir.parent.name}-TDD-Evidence.md"
            report.write_text("# TDD Evidence", encoding="utf-8")

            self.assertEqual(
                preflight.collect_tdd_evidence_files(root),
                [report],
            )

    def test_collect_tdd_evidence_files_excludes_archived_history(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "features" / "preflight" / "evidences"
            archive_dir = evidence_dir / "archive"
            archive_dir.mkdir(parents=True)
            report = evidence_dir / f"{evidence_dir.parent.name}-TDD-Evidence.md"
            archived = archive_dir / "2026-06-29-history.md"
            report.write_text("# TDD Evidence", encoding="utf-8")
            archived.write_text("# Historical Evidence", encoding="utf-8")

            self.assertEqual(
                preflight.collect_tdd_evidence_files(root),
                [report],
            )
            self.assertEqual(
                preflight.collect_archived_evidence_files(root),
                [archived],
            )

    def test_collect_plan_files_uses_feature_first_plans_subdir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_dir = root / "docs" / "coding-plugins" / "features" / "preflight" / "plans"
            plan_dir.mkdir(parents=True)
            plan = plan_dir / f"{plan_dir.parent.name}-Implementation-Plan.md"
            plan.write_text("# Implementation", encoding="utf-8")

            self.assertEqual(
                preflight.collect_plan_files(root),
                [plan],
            )

    def test_collect_technical_design_files_uses_feature_first_technicals_subdir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            technicals_dir = root / "docs" / "coding-plugins" / "features" / "preflight" / "technicals"
            technicals_dir.mkdir(parents=True)
            design = technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md"
            design.write_text("# 技术设计", encoding="utf-8")

            self.assertEqual(
                preflight.collect_technical_design_files(root),
                [design],
            )

    def test_flat_feature_root_technical_and_plan_files_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "preflight"
            feature_dir.mkdir(parents=True)
            (feature_dir / f"{feature_dir.name}-Technical-Design.md").write_text("# Flat Technical", encoding="utf-8")
            (feature_dir / f"{feature_dir.name}-Implementation-Plan.md").write_text("# Flat Plan", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Feature documents must use"):
                preflight.check_feature_first_document_layout(root)

    def test_feature_roots_require_readme(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "preflight"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text("# Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Feature root is missing README"):
                preflight.check_feature_readmes(root)

    def test_feature_readme_metadata_contract_rejects_missing_frontmatter(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text("# Routing\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Feature README metadata is invalid"):
                preflight.check_feature_readme_metadata_contract(root)

    def test_feature_readme_metadata_contract_rejects_handwritten_link_sections(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text(
                "---\n"
                "title: 路由\n"
                "status: approved\n"
                "feature: routing\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - routing\n"
                "---\n"
                "# Routing\n\n"
                "## 产物链路\n\n"
                "| 文档类型 | 路径 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Feature README must not contain handwritten document link sections"):
                preflight.check_feature_readme_metadata_contract(root)

    def test_feature_document_chain_requires_plan_or_lightweight_exception(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "evidences").mkdir()
            (feature_dir / "README.md").write_text(
                "# Routing\n\n"
                "## 文档信息\n\n"
                "| 字段 | 内容 |\n"
                "| --- | --- |\n"
                "| 状态 | 已批准 |\n"
                "| Feature | routing |\n",
                encoding="utf-8",
            )
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text(
                "---\nstatus: approved\nfeature: routing\n---\n"
                "# Feature\n\n"
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 轻量功能仍需追踪证据 | TDD Evidence |\n",
                encoding="utf-8",
            )
            (feature_dir / "evidences" / f"{feature_dir.name}-TDD-Evidence.md").write_text("# Evidence\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Feature document chain is incomplete"):
                preflight.check_feature_document_chain_closure(root)

            (feature_dir / "README.md").write_text(
                "# Routing\n\n"
                "## 文档信息\n\n"
                "| 字段 | 内容 |\n"
                "| --- | --- |\n"
                "| 状态 | 已批准 |\n"
                "| Feature | routing |\n\n"
                "## 轻量例外\n\n"
                "- **原因:** 已由规格和 TDD Evidence 完成，技术设计和计划只会重复既有证据。\n"
                "- **验证方式:** python3 scripts/preflight.py\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Lightweight exception traceability is incomplete"):
                preflight.check_feature_document_chain_closure(root)

            (feature_dir / "README.md").write_text(
                "# Routing\n\n"
                "## 文档信息\n\n"
                "| 字段 | 内容 |\n"
                "| --- | --- |\n"
                "| 状态 | 已批准 |\n"
                "| Feature | routing |\n\n"
                "## 轻量例外\n\n"
                "- **原因:** 已由规格和 TDD Evidence 完成，技术设计和计划只会重复既有证据。\n"
                "- **验证方式:** python3 scripts/preflight.py\n\n"
                "| 规格 ID | 证据 |\n"
                "| --- | --- |\n"
                "| REQ-001 | `docs/coding-plugins/features/routing/technicals/routing-Technical-Design.md` |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Lightweight exception traceability is incomplete"):
                preflight.check_feature_document_chain_closure(root)

            (feature_dir / "README.md").write_text(
                "# Routing\n\n"
                "## 文档信息\n\n"
                "| 字段 | 内容 |\n"
                "| --- | --- |\n"
                "| 状态 | 已批准 |\n"
                "| Feature | routing |\n\n"
                "## 轻量例外\n\n"
                "- **原因:** 已由规格和 TDD Evidence 完成，技术设计和计划只会重复既有证据。\n"
                "- **验证方式:** python3 scripts/preflight.py\n\n"
                "| 规格 ID | 证据 |\n"
                "| --- | --- |\n"
                "| REQ-001 | `docs/coding-plugins/features/routing/evidences/routing-TDD-Evidence.md` |\n",
                encoding="utf-8",
            )

            preflight.check_feature_document_chain_closure(root)

    def test_legacy_docs_roots_are_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            legacy_dir = root / "docs" / "coding-plugins" / "requirements" / "plugin" / "preflight"
            legacy_dir.mkdir(parents=True)
            (legacy_dir / "feature.md").write_text("# Legacy Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Legacy docs path is no longer active"):
                preflight.check_legacy_docs_roots(root)

    def test_build_commands_include_core_validation_steps(self) -> None:
        commands = preflight.build_validation_commands(
            Path("/repo"),
            [Path("/repo/spec.md")],
            [Path("/repo/docs/coding-plugins/features/preflight/evidences/preflight-TDD-Evidence.md")],
        )
        command_text = "\n".join(" ".join(command) for command in commands)

        self.assertIn("test_validate_spec.py", command_text)
        self.assertIn("test_validate_tdd_evidence.py", command_text)
        self.assertIn("test_bump_version.py", command_text)
        self.assertIn("test_prepare_release.py", command_text)
        self.assertIn("scripts/test_docs_index.py", command_text)
        self.assertIn("scripts/test_manifest_checks.py", command_text)
        self.assertIn("scripts/test_remote_audit.py", command_text)
        self.assertIn("test_validate_technical_design.py", command_text)
        self.assertIn("tests.behavior.test_routing", command_text)
        self.assertIn("tests/hooks/test-session-start.sh", command_text)
        self.assertIn("validate_spec.py", command_text)
        self.assertIn("--strict docs/coding-plugins/features/preflight/evidences/preflight-TDD-Evidence.md", command_text)

    def test_preflight_uses_technical_design_validator_errors(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "technicals").mkdir()
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text(
                "---\nstatus: approved\nfeature: routing\nupdated: 2026-06-29\n---\n"
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 需要映射 | 单测 |\n",
                encoding="utf-8",
            )
            (feature_dir / "technicals" / f"{feature_dir.name}-Technical-Design.md").write_text(
                "---\nstatus: approved\nfeature: routing\nupdated: 2026-06-29\n---\n"
                "# 技术设计\n\n"
                "## 设计摘要\n\n"
                "缺少规格到设计映射。\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design validation failed"):
                preflight.check_technical_design_validator(root)

    def test_preflight_runs_technical_design_validator_in_strict_mode(self) -> None:
        calls: list[bool] = []

        class FakeValidator:
            @staticmethod
            def validate_repository(root: Path, *, strict: bool):
                calls.append(strict)
                return type("Result", (), {"ok": True, "errors": []})()

        original_loader = preflight.load_technical_design_validator
        preflight.load_technical_design_validator = lambda root: FakeValidator
        try:
            preflight.check_technical_design_validator(Path("/repo"))
        finally:
            preflight.load_technical_design_validator = original_loader

        self.assertEqual(calls, [True])

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

    def test_technical_template_check_rejects_english_headings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            template_dir = root / "skills" / "writing-technical-design" / "templates"
            template_dir.mkdir(parents=True)
            (template_dir / "technical-design.md").write_text(
                "# 技术设计\n\n## Design Summary\n\n## Key Decisions\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical template still contains English structure"):
                preflight.check_technical_templates_are_chinese(root)

    def test_plan_template_check_rejects_english_headings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skill_dir = root / "skills" / "writing-plans"
            skill_dir.mkdir(parents=True)
            (skill_dir / "SKILL.md").write_text(
                "# 编写实现计划\n\n"
                "# [Feature Name] Implementation Plan\n\n"
                "**Goal:** build it\n\n"
                "| Spec ID | Test file / command |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Plan template still contains English structure"):
                preflight.check_plan_templates_are_chinese(root)

    def test_tdd_evidence_template_check_rejects_english_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            template_dir = root / "skills" / "test-driven-development" / "templates"
            template_dir.mkdir(parents=True)
            (template_dir / "tdd-evidence.md").write_text(
                "# <Feature> TDD Evidence\n\n"
                "### TDD Evidence\n\n"
                "- **Spec/Bug/AC:** REQ-001\n"
                "- **Final verification:** PASS\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "TDD evidence template still contains English structure"):
                preflight.check_tdd_evidence_templates_are_chinese(root)

    def test_technical_template_requires_spec_design_mapping_sections(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            template_dir = root / "skills" / "writing-technical-design" / "templates"
            template_dir.mkdir(parents=True)
            (template_dir / "technical-design.md").write_text(
                "# 技术设计\n\n## 设计摘要\n\n## 规格缺口审查\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical template is missing required section"):
                preflight.check_technical_template_required_sections(root)

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
            spec_dir = root / "docs" / "coding-plugins" / "features" / "search" / "requirements"
            spec_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text("# Feature", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Missing artifact index"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_expected_headers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            spec_dir = docs / "features" / "search" / "requirements"
            spec_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text("# Feature", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 需求文档 |\n| --- | --- |\n| search | `docs/coding-plugins/features/search/requirements/search-PRD.md` |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing required columns"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_feature_root_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text("# Search", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | - | - | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_technical_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "search"
            feature_dir.mkdir(parents=True)
            technicals_dir = feature_dir / "technicals"
            technicals_dir.mkdir()
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text("# Technical", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | `docs/coding-plugins/features/search` | - | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_spec_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            spec_dir = docs / "features" / "search" / "requirements"
            spec_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text("# Feature", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | `docs/coding-plugins/features/search` | - | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_test_case_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "search"
            feature_dir.mkdir(parents=True)
            test_cases_dir = feature_dir / "test-cases"
            test_cases_dir.mkdir()
            (test_cases_dir / f"{test_cases_dir.parent.name}-Test-Cases.md").write_text("# Test cases", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | `docs/coding-plugins/features/search` | - | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_plan_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "search"
            feature_dir.mkdir(parents=True)
            plan_dir = feature_dir / "plans"
            plan_dir.mkdir()
            (plan_dir / f"{plan_dir.parent.name}-Implementation-Plan.md").write_text("# Plan", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | `docs/coding-plugins/features/search` | - | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_artifact_index_requires_evidence_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            evidence_dir = docs / "features" / "search" / "evidences"
            evidence_dir.mkdir(parents=True)
            (evidence_dir / f"{evidence_dir.parent.name}-TDD-Evidence.md").write_text("# Evidence", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | `docs/coding-plugins/features/search` | - | - | - | - | - | search | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_render_artifact_index_includes_feature_metadata_and_documents(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "search"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "evidences").mkdir()
            (feature_dir / "README.md").write_text(
                "---\n"
                "title: 搜索\n"
                "status: approved\n"
                "feature: search\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - search\n"
                "  - index\n"
                "---\n"
                "# Search\n",
                encoding="utf-8",
            )
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text(
                "---\nupdated: 2026-06-29\n---\n# Feature\n",
                encoding="utf-8",
            )
            (feature_dir / "technicals").mkdir()
            (feature_dir / "technicals" / f"{feature_dir.name}-Technical-Design.md").write_text(
                "---\nupdated: 2026-06-28\n---\n# Technical\n",
                encoding="utf-8",
            )
            (feature_dir / "test-cases").mkdir()
            (feature_dir / "test-cases" / f"{feature_dir.name}-Test-Cases.md").write_text(
                "---\nupdated: 2026-06-29\n---\n# Test cases\n",
                encoding="utf-8",
            )
            (feature_dir / "plans").mkdir()
            (feature_dir / "plans" / f"{feature_dir.name}-Implementation-Plan.md").write_text(
                "---\nupdated: 2026-06-27\n---\n# Plan\n",
                encoding="utf-8",
            )
            (feature_dir / "evidences" / f"{feature_dir.name}-TDD-Evidence.md").write_text("# Evidence\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertIn("| search |", rendered)
            self.assertIn("`docs/coding-plugins/features/search`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/requirements/search-PRD.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/technicals/search-Technical-Design.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/test-cases/search-Test-Cases.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/plans/search-Implementation-Plan.md`", rendered)
            self.assertIn("`docs/coding-plugins/features/search/evidences/search-TDD-Evidence.md`", rendered)
            self.assertIn("| search, index | 2026-06-29 |", rendered)

    def test_render_artifact_index_sorts_rows_and_joins_multiple_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            features_root = root / "docs" / "coding-plugins" / "features"
            alpha = features_root / "alpha"
            beta = features_root / "beta"
            (alpha / "requirements").mkdir(parents=True)
            (beta / "requirements").mkdir(parents=True)
            (alpha / "README.md").write_text(
                "---\n"
                "title: Alpha\n"
                "status: approved\n"
                "feature: alpha\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - alpha\n"
                "---\n"
                "# Alpha\n",
                encoding="utf-8",
            )
            (beta / "README.md").write_text(
                "---\n"
                "title: Beta\n"
                "status: approved\n"
                "feature: beta\n"
                "updated: 2026-06-29\n"
                "tags:\n"
                "  - beta\n"
                "---\n"
                "# Beta\n",
                encoding="utf-8",
            )
            (alpha / "requirements" / "alpha-PRD.md").write_text("---\nupdated: 2026-06-29\n---\n# Feature\n", encoding="utf-8")
            (beta / "requirements" / "beta-PRD.md").write_text("---\nupdated: 2026-06-27\n---\n# Feature\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertLess(rendered.index("| alpha |"), rendered.index("| beta |"))
            self.assertIn("`docs/coding-plugins/features/alpha/requirements/alpha-PRD.md`", rendered)

    def test_render_artifact_index_handles_missing_tags(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "search"
            feature_dir.mkdir(parents=True)
            (feature_dir / "README.md").write_text("# Search\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertIn("| search | `docs/coding-plugins/features/search` | - | - | - | - | - | - | - |", rendered)

    def test_render_artifact_index_handles_missing_updated_metadata(self) -> None:
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
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text("# Feature\n", encoding="utf-8")

            rendered = preflight.render_artifact_index(root)

            self.assertIn("| search | - |", rendered)

    def test_artifact_index_requires_generated_content_match(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            feature_dir = docs / "features" / "search"
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
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text("---\nupdated: 2026-06-29\n---\n# Feature\n", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "# Coding Plugins Feature 索引\n\n"
                "本索引用于按 `Feature` 检索 feature-first 文档链路。新增、移动、批准、废弃或拆分相关产物时同步更新本文件。\n\n"
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| search | `docs/coding-plugins/features/search` | `docs/coding-plugins/features/search/requirements/search-PRD.md` | - | - | - | - | wrong-tag | 2026-06-29 |\n",
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
            spec_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "requirements"
            spec_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "---\nfeature: other\n---\n# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Spec metadata does not match path"):
                preflight.check_document_path_metadata(root)

    def test_document_path_metadata_check_rejects_missing_evidence_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            evidence_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "evidences"
            evidence_dir.mkdir(parents=True)
            (evidence_dir / f"{evidence_dir.parent.name}-TDD-Evidence.md").write_text("# TDD 证据\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Evidence metadata is incomplete"):
                preflight.check_evidence_metadata(root)

    def test_archived_evidence_metadata_uses_historical_contract(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "evidences" / "archive"
            archive_dir.mkdir(parents=True)
            archived = archive_dir / "2026-06-29-history.md"
            archived.write_text(
                "---\n"
                "title: historical evidence\n"
                "status: archived\n"
                "feature: routing\n"
                "created: 2026-06-29\n"
                "updated: 2026-06-29\n"
                "validation_mode: historical\n"
                "archive_of: docs/coding-plugins/features/routing/evidences/routing-TDD-Evidence.md\n"
                "archived_at: 2026-07-01\n"
                "---\n"
                "# Historical\n",
                encoding="utf-8",
            )

            preflight.check_archived_evidence_metadata(root)

            archived.write_text("# Historical\n", encoding="utf-8")
            with self.assertRaisesRegex(preflight.PreflightError, "Archived evidence metadata is incomplete"):
                preflight.check_archived_evidence_metadata(root)

    def test_plan_metadata_check_rejects_missing_frontmatter(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "plans"
            plan_dir.mkdir(parents=True)
            (plan_dir / f"{plan_dir.parent.name}-Implementation-Plan.md").write_text("# Plan\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Plan metadata is incomplete"):
                preflight.check_plan_metadata(root)

    def test_plan_metadata_check_rejects_mismatched_path_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "plans"
            plan_dir.mkdir(parents=True)
            (plan_dir / f"{plan_dir.parent.name}-Implementation-Plan.md").write_text(
                "---\n"
                "title: 路由计划\n"
                "status: approved\n"
                "feature: other\n"
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
            plan_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "plans"
            plan_dir.mkdir(parents=True)
            (plan_dir / f"{plan_dir.parent.name}-Implementation-Plan.md").write_text(
                "---\n"
                "title: 路由计划\n"
                "status: approved\n"
                "feature: routing\n"
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
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            spec_dir = feature_dir / "requirements"
            evidence_dir = feature_dir / "evidences"
            spec_dir.mkdir(parents=True)
            evidence_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已知需求 | 单测 |\n",
                encoding="utf-8",
            )
            (evidence_dir / f"{evidence_dir.parent.name}-TDD-Evidence.md").write_text(
                "- **Spec/Bug/AC:** REQ-999\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "TDD evidence references unknown Spec IDs"):
                preflight.check_tdd_evidence_spec_ids(root)

    def test_lifecycle_state_consistency_rejects_completed_evidence_with_planned_status(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            spec_dir = feature_dir / "requirements"
            evidence_dir = feature_dir / "evidences"
            spec_dir.mkdir(parents=True)
            evidence_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已知需求 | 单测 |\n\n"
                "## 追踪矩阵\n\n"
                "| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |\n"
                "| --- | --- | --- | --- | --- |\n"
                "| REQ-001 | 单元测试 | `python3 -m unittest` | Task 1 | 计划中 |\n",
                encoding="utf-8",
            )
            (evidence_dir / f"{evidence_dir.parent.name}-TDD-Evidence.md").write_text(
                "## TDD 证据\n\n"
                "- **规格/缺陷/验收:** REQ-001\n"
                "- **最终验证:** `python3 -m unittest` PASS\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Lifecycle state is inconsistent"):
                preflight.check_lifecycle_state_consistency(root)

    def test_external_reference_check_is_explicit_and_rejects_missing_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "requirements"
            spec_dir.mkdir(parents=True)
            existing = root / "external.md"
            existing.write_text("# External", encoding="utf-8")
            spec = spec_dir / f"{spec_dir.parent.name}-PRD.md"
            spec.write_text(
                "---\n"
                "external_references:\n"
                f"  - {existing}\n"
                "  - /definitely/missing/coding-plugin-reference.md\n"
                "---\n"
                "# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "External references are missing"):
                preflight.check_external_references(root)

    def test_technical_index_requires_design_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs" / "coding-plugins"
            technicals_dir = docs / "features" / "routing" / "technicals"
            technicals_dir.mkdir(parents=True)
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text("# Technical", encoding="utf-8")
            (docs / "INDEX.md").write_text(
                "| Feature | 功能根目录 | 需求文档 | 技术设计 | 测试用例 | 实现计划 | 证据 | 标签 | 更新日期 |\n"
                "| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n"
                "| plugin | routing | `docs/coding-plugins/features/routing` | - | - | - | - | routing | 2026-06-26 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Artifact index is missing document paths"):
                preflight.check_artifact_index_covers_documents(root)

    def test_spec_technical_reference_check_rejects_missing_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            spec_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "requirements"
            spec_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "---\nfeature: routing\nrelated_technical:\n"
                "  - docs/coding-plugins/features/routing/technicals/routing-Technical-Design.md\n---\n"
                "# Feature\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Spec references missing technical design"):
                preflight.check_spec_technical_design_references(root)

    def test_plan_technical_design_source_check_rejects_missing_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            plan_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "plans"
            plan_dir.mkdir(parents=True)
            (plan_dir / f"{plan_dir.parent.name}-Implementation-Plan.md").write_text("# Plan\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Plan is missing 技术设计来源"):
                preflight.check_plan_technical_design_references(root)

    def test_technical_design_spec_id_check_rejects_unknown_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            spec_dir = feature_dir / "requirements"
            spec_dir.mkdir(parents=True)
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已知需求 | 单测 |\n",
                encoding="utf-8",
            )
            technicals_dir = feature_dir / "technicals"
            technicals_dir.mkdir()
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text(
                "---\nfeature: routing\n---\n# Technical\n\nCovers REQ-999\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design references unknown Spec IDs"):
                preflight.check_technical_design_spec_ids(root)

    def test_technical_design_gap_review_requires_section(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            technicals_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "technicals"
            technicals_dir.mkdir(parents=True)
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text(
                "---\nfeature: routing\n---\n# 技术设计\n\n## 设计摘要\n\n无。\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design is missing spec gap review"):
                preflight.check_technical_design_gap_review(root)

    def test_technical_design_gap_review_rejects_unresolved_gap(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            technicals_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "technicals"
            technicals_dir.mkdir(parents=True)
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text(
                "---\nfeature: routing\n---\n"
                "# 技术设计\n\n"
                "## 规格缺口审查\n\n"
                "| 检查项 | 结论 |\n"
                "| --- | --- |\n"
                "| 未覆盖需求 | 存在：需要新增导出行为。 |\n"
                "| 验收标准不清 | 无。 |\n"
                "| 新增外部行为 | 无。 |\n"
                "| 处理状态 | 未处理 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design has unresolved spec gaps"):
                preflight.check_technical_design_gap_review(root)

    def test_technical_design_requires_spec_design_mapping_sections(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            technicals_dir = root / "docs" / "coding-plugins" / "features" / "routing" / "technicals"
            technicals_dir.mkdir(parents=True)
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text(
                "---\nfeature: routing\n---\n"
                "# 技术设计\n\n"
                "## 设计摘要\n\n"
                "## 规格缺口审查\n\n"
                "| 检查项 | 结论 |\n"
                "| --- | --- |\n"
                "| 未覆盖需求 | 无。 |\n"
                "| 验收标准不清 | 无。 |\n"
                "| 新增外部行为 | 无。 |\n"
                "| 处理状态 | 通过，未发现需要回写 spec 的缺口。 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design is missing required section"):
                preflight.check_technical_design_required_sections(root)

    def test_technical_design_must_cover_required_spec_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            spec_dir = feature_dir / "requirements"
            technicals_dir = feature_dir / "technicals"
            spec_dir.mkdir(parents=True)
            technicals_dir.mkdir()
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "---\nstatus: approved\nfeature: routing\n---\n"
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 已覆盖需求 | 单测 |\n"
                "| REQ-002 | 必须 | 未覆盖需求 | 单测 |\n",
                encoding="utf-8",
            )
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text(
                "---\nfeature: routing\n---\n"
                "# 技术设计\n\n"
                "## 规格到设计映射\n\n"
                "| 规格 ID | 技术落点 | 设计决策 | 测试策略 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | `scripts/preflight.py` | 已覆盖 | 单测 |\n\n"
                "## 无需技术设计的规格\n\n"
                "| 规格 ID | 原因 |\n"
                "| --- | --- |\n"
                "| 无 | 无。 |\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design does not cover required Spec IDs"):
                preflight.check_technical_design_must_spec_coverage(root)

    def test_technical_design_must_coverage_allows_explicit_exemptions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            spec_dir = feature_dir / "requirements"
            technicals_dir = feature_dir / "technicals"
            spec_dir.mkdir(parents=True)
            technicals_dir.mkdir()
            (spec_dir / f"{spec_dir.parent.name}-PRD.md").write_text(
                "---\nstatus: approved\nfeature: routing\n---\n"
                "| 编号 | 优先级 | 需求 | 验证方式 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | 必须 | 有设计落点 | 单测 |\n"
                "| REQ-002 | 必须 | 无需设计落点 | 单测 |\n",
                encoding="utf-8",
            )
            (technicals_dir / f"{technicals_dir.parent.name}-Technical-Design.md").write_text(
                "---\nfeature: routing\n---\n"
                "# 技术设计\n\n"
                "## 规格到设计映射\n\n"
                "| 规格 ID | 技术落点 | 设计决策 | 测试策略 |\n"
                "| --- | --- | --- | --- |\n"
                "| REQ-001 | `scripts/preflight.py` | 已覆盖 | 单测 |\n\n"
                "## 无需技术设计的规格\n\n"
                "| 规格 ID | 原因 |\n"
                "| --- | --- |\n"
                "| REQ-002 | 该规格只约束人工文档说明。 |\n",
                encoding="utf-8",
            )

            preflight.check_technical_design_must_spec_coverage(root)

    def test_technical_design_coverage_uses_heading_lines_not_inline_mentions(self) -> None:
        text = (
            "# 技术设计\n\n"
            "## 设计摘要\n\n"
            "正文引用 `## 规格到设计映射` 和 `## 无需技术设计的规格`，但这不是章节标题。\n\n"
            "## 规格到设计映射\n\n"
            "| 规格 ID | 技术落点 | 设计决策 | 测试策略 |\n"
            "| --- | --- | --- | --- |\n"
            "| REQ-001 | `scripts/preflight.py` | 已覆盖 | 单测 |\n\n"
            "## 无需技术设计的规格\n\n"
            "| 规格 ID | 原因 |\n"
            "| --- | --- |\n"
            "| REQ-002 | 文档说明，无需技术设计。 |\n"
        )

        self.assertEqual(preflight.technical_design_coverage_ids(text), {"REQ-001", "REQ-002"})

    def test_technical_metadata_requires_related_chain_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_dir = root / "docs" / "coding-plugins" / "features" / "routing"
            (feature_dir / "requirements").mkdir(parents=True)
            (feature_dir / "technicals").mkdir()
            (feature_dir / "plans").mkdir()
            (feature_dir / "evidences").mkdir()
            (feature_dir / "requirements" / f"{feature_dir.name}-PRD.md").write_text("---\nstatus: approved\n---\n# Feature\n", encoding="utf-8")
            (feature_dir / "plans" / f"{feature_dir.name}-Implementation-Plan.md").write_text("# Plan\n", encoding="utf-8")
            (feature_dir / "evidences" / f"{feature_dir.name}-TDD-Evidence.md").write_text("# Evidence\n", encoding="utf-8")
            (feature_dir / "technicals" / f"{feature_dir.name}-Technical-Design.md").write_text(
                "---\n"
                "feature: routing\n"
                "related_specs:\n"
                "  - docs/coding-plugins/features/routing/requirements/routing-PRD.md\n"
                "related_plans:\n"
                "  - docs/coding-plugins/features/routing/plans/missing.md\n"
                "---\n"
                "# 技术设计\n",
                encoding="utf-8",
            )

            with self.assertRaisesRegex(preflight.PreflightError, "Technical design related metadata is invalid"):
                preflight.check_technical_design_related_metadata(root)

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

    def test_release_management_check_rejects_missing_release_automation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".claude-plugin").mkdir()
            (root / ".github" / "workflows").mkdir(parents=True)
            (root / "scripts").mkdir()
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )
            (root / ".claude-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )
            (root / ".version-bump.json").write_text(json.dumps({"version": "1.2.3"}), encoding="utf-8")
            (root / "RELEASE-NOTES.md").write_text("# Release Notes\n\n## 1.2.3\n", encoding="utf-8")

            with self.assertRaisesRegex(preflight.PreflightError, "Missing release automation"):
                preflight.check_release_management_files(root)


if __name__ == "__main__":
    unittest.main()
