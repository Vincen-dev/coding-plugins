#!/usr/bin/env python3
"""Regression tests for plugin version bump automation."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bump_version


class BumpVersionTests(unittest.TestCase):
    def write_plugin_files(self, root: Path, version: str = "1.2.3") -> None:
        (root / ".codex-plugin").mkdir()
        (root / ".claude-plugin").mkdir()
        (root / ".codex-plugin" / "plugin.json").write_text(
            json.dumps({"version": version}, indent=2),
            encoding="utf-8",
        )
        (root / ".claude-plugin" / "plugin.json").write_text(
            json.dumps({"version": version}, indent=2),
            encoding="utf-8",
        )
        (root / ".version-bump.json").write_text(
            json.dumps(
                {
                    "version": version,
                    "files": [
                        {"path": ".codex-plugin/plugin.json", "field": "version"},
                        {"path": ".claude-plugin/plugin.json", "field": "version"},
                        {"path": ".version-bump.json", "field": "version"},
                    ],
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    def test_validate_version_accepts_semver(self) -> None:
        bump_version.validate_version("1.2.3")
        bump_version.validate_version("1.2.3-beta.1")

    def test_validate_version_rejects_invalid_semver(self) -> None:
        with self.assertRaisesRegex(ValueError, "strict semver"):
            bump_version.validate_version("1.2")

    def test_update_versions_updates_manifests_and_config(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_plugin_files(root)

            bump_version.update_versions(root, "1.2.4")

            codex = json.loads((root / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
            claude = json.loads((root / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
            config = json.loads((root / ".version-bump.json").read_text(encoding="utf-8"))
            self.assertEqual(codex["version"], "1.2.4")
            self.assertEqual(claude["version"], "1.2.4")
            self.assertEqual(config["version"], "1.2.4")


if __name__ == "__main__":
    unittest.main()
