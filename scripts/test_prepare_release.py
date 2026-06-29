#!/usr/bin/env python3
"""Regression tests for release preparation automation."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import prepare_release


class PrepareReleaseTests(unittest.TestCase):
    def write_release_files(self, root: Path, version: str = "1.2.3") -> None:
        (root / ".codex-plugin").mkdir()
        (root / ".claude-plugin").mkdir()
        (root / ".codex-plugin" / "plugin.json").write_text(
            json.dumps({"version": version}),
            encoding="utf-8",
        )
        (root / ".claude-plugin" / "plugin.json").write_text(
            json.dumps({"version": version}),
            encoding="utf-8",
        )
        (root / ".version-bump.json").write_text(
            json.dumps({"version": version}),
            encoding="utf-8",
        )
        (root / "RELEASE-NOTES.md").write_text(
            "# Release Notes\n\n"
            f"## {version} - 2026-06-29\n\n"
            "- 增加 release 自动化。\n\n"
            "## 1.2.2 - 2026-06-28\n\n"
            "- 历史记录。\n",
            encoding="utf-8",
        )

    def test_tag_name_for_version_uses_v_prefix_and_semver(self) -> None:
        self.assertEqual(prepare_release.tag_name_for_version("1.2.3"), "v1.2.3")

        with self.assertRaisesRegex(ValueError, "strict semver"):
            prepare_release.tag_name_for_version("1.2")

    def test_extract_release_notes_section_for_version(self) -> None:
        notes = (
            "# Release Notes\n\n"
            "## 1.2.3 - 2026-06-29\n\n"
            "- 增加 release 自动化。\n\n"
            "## 1.2.2 - 2026-06-28\n\n"
            "- 历史记录。\n"
        )

        self.assertEqual(
            prepare_release.extract_release_notes_section(notes, "1.2.3"),
            "- 增加 release 自动化。",
        )

    def test_extract_release_notes_rejects_missing_version(self) -> None:
        with self.assertRaisesRegex(ValueError, "Release notes section not found"):
            prepare_release.extract_release_notes_section("# Release Notes\n\n## 1.2.2\n", "1.2.3")

    def test_validate_release_metadata_returns_version_tag_and_notes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_release_files(root)

            metadata = prepare_release.validate_release_metadata(root)

            self.assertEqual(metadata.version, "1.2.3")
            self.assertEqual(metadata.tag_name, "v1.2.3")
            self.assertEqual(metadata.notes, "- 增加 release 自动化。")


if __name__ == "__main__":
    unittest.main()
