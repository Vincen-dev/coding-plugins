#!/usr/bin/env python3
"""Regression tests for feature workflow state inspection."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

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
    if source_hash is not None:
        lines.append(f"source_hash: {source_hash}")
    lines.extend(
        [
            "---",
            "",
            f"# {path.stem}",
            "",
            "## 文档信息",
            "",
            "| 字段 | 内容 |",
            "| --- | --- |",
            f"| 状态 | {status} |",
        ]
    )
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def artifact_path(root: Path, feature: str, doc_id: str, directory: str, suffix: str) -> Path:
    return root / "docs" / "coding-plugins" / "features" / feature / directory / f"{doc_id}-{suffix}.md"


class WorkflowStateTests(unittest.TestCase):
    def test_missing_feature_routes_to_sdd(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            result = workflow_state.inspect_document_chain(
                root,
                feature="workflow-runtime",
                doc_id="workflow-runtime-guard",
            )

        self.assertEqual(result["state"], "not-started")
        self.assertEqual(result["next_skill"], "spec-driven-development")
        self.assertEqual(
            result["missing_artifacts"],
            ["PRD", "TDD", "TID", "TCD", "IPD", "TED"],
        )
        self.assertFalse(result["stale"])

    def test_ready_for_plan_when_upstream_docs_exist_without_ipd(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_doc(artifact_path(root, feature, doc_id, "requirements", "PRD"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "technicals", "TDD"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "technicals", "TID"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "test-cases", "TCD"), status="approved")

            result = workflow_state.inspect_document_chain(root, feature=feature, doc_id=doc_id)

        self.assertEqual(result["state"], "ready-for-plan")
        self.assertEqual(result["next_skill"], "writing-plans")
        self.assertEqual(result["missing_artifacts"], ["IPD", "TED"])
        self.assertTrue(result["chain_hash"].startswith("sha256:"))
        self.assertFalse(result["stale"])

    def test_stale_plan_routes_back_to_writing_plans(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_doc(artifact_path(root, feature, doc_id, "requirements", "PRD"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "technicals", "TDD"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "technicals", "TID"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "test-cases", "TCD"), status="approved")
            write_doc(
                artifact_path(root, feature, doc_id, "plans", "IPD"),
                status="approved",
                source_hash="sha256:stale",
            )

            result = workflow_state.inspect_document_chain(root, feature=feature, doc_id=doc_id)

        self.assertEqual(result["state"], "plan-stale")
        self.assertEqual(result["next_skill"], "writing-plans")
        self.assertTrue(result["stale"])
        self.assertIn("source_hash does not match current upstream chain", result["reason"])

    def test_current_plan_routes_to_worktree_execution(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_doc(artifact_path(root, feature, doc_id, "requirements", "PRD"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "technicals", "TDD"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "technicals", "TID"), status="approved")
            write_doc(artifact_path(root, feature, doc_id, "test-cases", "TCD"), status="approved")
            source_hash = workflow_state.compute_upstream_hash(root, feature=feature, doc_id=doc_id)
            write_doc(
                artifact_path(root, feature, doc_id, "plans", "IPD"),
                status="approved",
                source_hash=source_hash,
            )

            result = workflow_state.inspect_document_chain(root, feature=feature, doc_id=doc_id)

        self.assertEqual(result["state"], "ready-for-execution")
        self.assertEqual(result["next_skill"], "using-git-worktrees")
        self.assertFalse(result["stale"])
        self.assertEqual(result["plan_source_hash"], source_hash)


if __name__ == "__main__":
    unittest.main()
