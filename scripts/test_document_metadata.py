#!/usr/bin/env python3
"""Regression tests for centralized document metadata rules."""

from __future__ import annotations

import tempfile
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import document_metadata


class DocumentMetadataTests(unittest.TestCase):
    def test_frontmatter_block_round_trips_scalars_and_lists(self) -> None:
        text = (
            "---\n"
            "title: Demo PRD\n"
            "status: active\n"
            "related_specs:\n"
            "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n"
            "related_technical: []\n"
            "---\n"
            "# Body\n"
        )

        lines, body = document_metadata.split_frontmatter(text)
        frontmatter = document_metadata.parse_frontmatter_block(lines)
        rendered = document_metadata.render_frontmatter_block(frontmatter)

        self.assertEqual("# Body\n", body)
        self.assertEqual("Demo PRD", frontmatter.scalars["title"])
        self.assertEqual("active", frontmatter.scalars["status"])
        self.assertEqual(
            ["docs/coding-plugins/features/demo/requirements/demo-PRD.md"],
            frontmatter.lists["related_specs"],
        )
        self.assertEqual([], frontmatter.lists["related_technical"])
        self.assertEqual(["title", "status", "related_specs", "related_technical"], frontmatter.order)
        self.assertEqual(
            "---\n"
            "title: Demo PRD\n"
            "status: active\n"
            "related_specs:\n"
            "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n"
            "related_technical: []\n"
            "---\n",
            rendered,
        )

    def test_frontmatter_compat_helpers_use_central_parser(self) -> None:
        text = (
            "---\n"
            "title: Demo PRD\n"
            "related_specs:\n"
            "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n"
            "related_technical: []\n"
            "---\n"
            "# Body\n"
        )

        self.assertEqual({"title": "Demo PRD"}, document_metadata.parse_frontmatter(text))
        self.assertEqual(
            ["docs/coding-plugins/features/demo/requirements/demo-PRD.md"],
            document_metadata.frontmatter_list_values(text, "related_specs"),
        )
        self.assertEqual([], document_metadata.frontmatter_list_values(text, "related_technical"))

    def test_registry_defines_active_document_artifacts(self) -> None:
        self.assertEqual(("PRD", "TDD", "TID", "TCD", "IPD", "TED"), document_metadata.ARTIFACT_SUFFIXES)
        for suffix in document_metadata.ARTIFACT_SUFFIXES:
            with self.subTest(suffix=suffix):
                self.assertTrue(document_metadata.artifact_for_suffix(suffix).doc_id_required)
        self.assertEqual(
            ("PRD", "TDD", "TID", "TCD", "IPD"),
            document_metadata.DOCUMENT_SYNC_DEPENDENCIES["TED"],
        )

    def test_filename_patterns_are_derived_from_registry(self) -> None:
        patterns = document_metadata.filename_patterns_by_directory()

        self.assertTrue(patterns["requirements"].fullmatch("routing-login-PRD.md"))
        self.assertTrue(patterns["technicals"].fullmatch("routing-login-TDD.md"))
        self.assertTrue(patterns["technicals"].fullmatch("routing-login-TID.md"))
        self.assertTrue(patterns["test-cases"].fullmatch("routing-login-TCD.md"))
        self.assertTrue(patterns["plans"].fullmatch("routing-login-IPD.md"))
        self.assertTrue(patterns["evidences"].fullmatch("routing-login-TED.md"))
        self.assertFalse(patterns["plans"].fullmatch("routing-login-TED.md"))

    def test_doc_id_is_derived_from_registered_suffix(self) -> None:
        self.assertEqual("routing-login", document_metadata.document_doc_id(Path("routing-login-PRD.md")))
        self.assertEqual("routing-login", document_metadata.document_doc_id(Path("routing-login-TED.md")))

    def test_related_paths_are_grouped_by_relation_key_and_exclude_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature_root = root / "docs" / "coding-plugins" / "features" / "routing"
            for directory in ("requirements", "technicals", "test-cases", "plans", "evidences"):
                (feature_root / directory).mkdir(parents=True, exist_ok=True)
            for suffix in document_metadata.ARTIFACT_SUFFIXES:
                document_metadata.artifact_file(feature_root, suffix, "routing-login").write_text(
                    f"# {suffix}\n",
                    encoding="utf-8",
                )

            source = feature_root / "technicals" / "routing-login-TDD.md"
            related = document_metadata.expected_related_paths_for_doc_id(feature_root, "routing-login", source)

            self.assertEqual(
                [feature_root / "requirements" / "routing-login-PRD.md"],
                related["related_specs"],
            )
            self.assertEqual(
                [feature_root / "technicals" / "routing-login-TID.md"],
                related["related_technical"],
            )
            self.assertEqual(
                [feature_root / "evidences" / "routing-login-TED.md"],
                related["related_evidence"],
            )


if __name__ == "__main__":
    unittest.main()
