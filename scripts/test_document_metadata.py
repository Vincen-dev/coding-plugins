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
