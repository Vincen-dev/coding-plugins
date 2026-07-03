#!/usr/bin/env python3
"""Regression tests for plugin manifest preflight checks."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import manifest_checks
import preflight


class ManifestChecksTests(unittest.TestCase):
    def test_manifest_checks_module_exposes_manifest_contract(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".claude-plugin").mkdir()
            (root / ".agents").mkdir()
            (root / "skills").mkdir()
            (root / "assets").mkdir()
            (root / "README.md").write_text("# Plugin\n", encoding="utf-8")
            (root / "INSTALL.md").write_text("# Install\n", encoding="utf-8")
            (root / "SECURITY.md").write_text("# Security\n", encoding="utf-8")
            (root / "GEMINI.md").write_text("# Plugin\n", encoding="utf-8")
            (root / ".agents" / "skills").mkdir()
            (root / "assets" / "logo.svg").write_text("<svg></svg>\n", encoding="utf-8")
            (root / "plugin.json").write_text(
                json.dumps({"version": "1.2.3", "skills": "skills/"}),
                encoding="utf-8",
            )
            (root / "gemini-extension.json").write_text(
                json.dumps({"version": "1.2.3", "contextFileName": "GEMINI.md"}),
                encoding="utf-8",
            )
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps(
                    {
                        "version": "1.2.3",
                        "hooks": "./hooks/hooks-codex.json",
                        "interface": {"logo": "./assets/logo.svg"},
                    }
                ),
                encoding="utf-8",
            )
            (root / ".claude-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )

            manifest_checks.check_required_plugin_files(root)
            manifest_checks.check_manifest_versions(root)
            manifest_checks.check_platform_entrypoints(root)
            manifest_checks.check_codex_hook_config_declared(root)
            manifest_checks.check_manifest_asset_paths(root)
            self.assertEqual(manifest_checks.current_manifest_version(root), "1.2.3")
            self.assertEqual(manifest_checks.normalize_manifest_asset_path("./assets/logo.svg"), "assets/logo.svg")

    def test_manifest_checks_module_rejects_invalid_manifest_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".claude-plugin").mkdir()
            (root / "skills").mkdir()
            (root / "GEMINI.md").write_text("# Plugin\n", encoding="utf-8")
            (root / "plugin.json").write_text(
                json.dumps({"version": "1.2.5", "skills": "missing/"}),
                encoding="utf-8",
            )
            (root / "gemini-extension.json").write_text(
                json.dumps({"version": "1.2.6", "contextFileName": "MISSING.md"}),
                encoding="utf-8",
            )
            (root / ".codex-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.3", "interface": {"logo": "./assets/missing.svg"}}),
                encoding="utf-8",
            )
            (root / ".claude-plugin" / "plugin.json").write_text(
                json.dumps({"version": "1.2.4"}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(manifest_checks.ManifestCheckError, "Manifest versions differ"):
                manifest_checks.check_manifest_versions(root)
            with self.assertRaisesRegex(manifest_checks.ManifestCheckError, "Root plugin manifest must declare skills"):
                manifest_checks.check_platform_entrypoints(root)
            with self.assertRaisesRegex(manifest_checks.ManifestCheckError, "Codex manifest must declare hooks"):
                manifest_checks.check_codex_hook_config_declared(root)
            with self.assertRaisesRegex(manifest_checks.ManifestCheckError, "Manifest asset path does not exist"):
                manifest_checks.check_manifest_asset_paths(root)

    def test_platform_entrypoints_accept_agents_skills_symlink_text_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".agents").mkdir()
            (root / "skills").mkdir()
            (root / "GEMINI.md").write_text("# Plugin\n", encoding="utf-8")
            (root / ".agents" / "skills").write_text("../skills\n", encoding="utf-8")
            (root / "plugin.json").write_text(
                json.dumps({"version": "1.2.3", "skills": "skills/"}),
                encoding="utf-8",
            )
            (root / "gemini-extension.json").write_text(
                json.dumps({"version": "1.2.3", "contextFileName": "GEMINI.md"}),
                encoding="utf-8",
            )

            manifest_checks.check_platform_entrypoints(root)

    def test_platform_entrypoints_rejects_invalid_agents_skills_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".agents").mkdir()
            (root / "skills").mkdir()
            (root / "GEMINI.md").write_text("# Plugin\n", encoding="utf-8")
            (root / ".agents" / "skills").write_text("missing\n", encoding="utf-8")
            (root / "plugin.json").write_text(
                json.dumps({"version": "1.2.3", "skills": "skills/"}),
                encoding="utf-8",
            )
            (root / "gemini-extension.json").write_text(
                json.dumps({"version": "1.2.3", "contextFileName": "GEMINI.md"}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(manifest_checks.ManifestCheckError, "must resolve to a directory"):
                manifest_checks.check_platform_entrypoints(root)

    def test_preflight_converts_manifest_check_errors(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / ".codex-plugin").mkdir()
            (root / ".claude-plugin").mkdir()
            (root / "plugin.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )
            (root / "gemini-extension.json").write_text(
                json.dumps({"version": "1.2.3"}),
                encoding="utf-8",
            )
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


if __name__ == "__main__":
    unittest.main()
