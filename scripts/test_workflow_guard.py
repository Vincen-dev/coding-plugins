#!/usr/bin/env python3
"""Regression tests for workflow guard checks."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import workflow_guard
import workflow_state


def write_doc(path: Path, *, status: str = "draft", source_hash: str | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "---",
        f"title: {path.stem}",
        f"status: {status}",
        f"feature: {path.parents[1].name}",
        f"doc_id: {path.stem.rsplit('-', 1)[0]}",
        "created: 2026-07-03",
        "updated: 2026-07-03",
    ]
    if source_hash:
        lines.append(f"source_hash: {source_hash}")
    lines.extend(["---", "", f"# {path.stem}", ""])
    path.write_text("\n".join(lines), encoding="utf-8")


def path_for(root: Path, feature: str, doc_id: str, directory: str, suffix: str) -> Path:
    return root / "docs" / "coding-plugins" / "features" / feature / directory / f"{doc_id}-{suffix}.md"


def write_approved_upstream(root: Path, feature: str, doc_id: str) -> None:
    write_doc(path_for(root, feature, doc_id, "requirements", "PRD"), status="approved")
    write_doc(path_for(root, feature, doc_id, "technicals", "TDD"), status="approved")
    write_doc(path_for(root, feature, doc_id, "technicals", "TID"), status="approved")
    write_doc(path_for(root, feature, doc_id, "test-cases", "TCD"), status="approved")


class WorkflowGuardTests(unittest.TestCase):
    def test_plan_target_passes_when_upstream_is_ready(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_approved_upstream(root, feature, doc_id)

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="plan")

        self.assertTrue(result["pass"])
        self.assertEqual(result["state"], "ready-for-plan")

    def test_execute_target_blocks_missing_or_incomplete_chain(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = workflow_guard.check(
                Path(tmp),
                feature="workflow-runtime",
                doc_id="workflow-runtime-guard",
                target="execute",
            )

        self.assertFalse(result["pass"])
        self.assertEqual(result["next_skill"], "spec-driven-development")
        self.assertIn("PRD", result["missing_artifacts"])

    def test_execute_target_blocks_stale_plan(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_approved_upstream(root, feature, doc_id)
            write_doc(path_for(root, feature, doc_id, "plans", "IPD"), status="approved", source_hash="sha256:old")

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertEqual(result["state"], "plan-stale")
        self.assertEqual(result["next_skill"], "writing-plans")

    def test_execute_target_blocks_plan_without_source_hash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_approved_upstream(root, feature, doc_id)
            write_doc(path_for(root, feature, doc_id, "plans", "IPD"), status="approved")

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertEqual(result["state"], "plan-unlocked")
        self.assertIn("IPD source_hash is missing", result["failures"])

    def test_execute_target_blocks_unapproved_plan(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_approved_upstream(root, feature, doc_id)
            source_hash = workflow_state.compute_upstream_hash(root, feature=feature, doc_id=doc_id)
            write_doc(path_for(root, feature, doc_id, "plans", "IPD"), status="draft", source_hash=source_hash)

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertEqual(result["state"], "plan-draft")
        self.assertIn("state 'plan-draft' cannot enter target 'execute'", result["failures"])

    def test_execute_target_passes_current_plan(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_approved_upstream(root, feature, doc_id)
            source_hash = workflow_state.compute_upstream_hash(root, feature=feature, doc_id=doc_id)
            write_doc(
                path_for(root, feature, doc_id, "plans", "IPD"),
                status="approved",
                source_hash=source_hash,
            )

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertTrue(result["pass"])
        self.assertEqual(result["state"], "ready-for-execution")


if __name__ == "__main__":
    unittest.main()
