#!/usr/bin/env python3
"""Regression tests for concise workflow execution briefs."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import workflow_brief
import workflow_state
from test_workflow_guard import VALID_EXECUTION_BODY, path_for, write_approved_upstream, write_doc


class WorkflowBriefTests(unittest.TestCase):
    def test_execute_brief_prefers_ipd_task_sections_over_upstream_docs(self) -> None:
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
                body=VALID_EXECUTION_BODY
                + """
""",
            )

            result = workflow_brief.build_brief(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertTrue(result["pass"])
        self.assertEqual(result["state"], "ready-for-execution")
        self.assertEqual(
            result["must_read"],
            ["docs/coding-plugins/features/workflow-runtime/plans/workflow-runtime-guard-IPD.md"],
        )
        self.assertIn(
            "docs/coding-plugins/features/workflow-runtime/requirements/workflow-runtime-guard-PRD.md",
            result["may_skip"],
        )
        self.assertEqual(result["task_headings"], ["校验 workflow guard（TASK-001 / REQ-001）"])
        self.assertEqual(result["execution_source"], "IPD task chapters")
        self.assertEqual(result["new_plan_policy"], "create-new-ipd")

    def test_execute_brief_can_focus_on_one_task(self) -> None:
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
                body=VALID_EXECUTION_BODY
                + """
## 扩展 brief 过滤（TASK-002 / REQ-001）
""",
            )

            result = workflow_brief.build_brief(root, feature=feature, doc_id=doc_id, target="execute", task="TASK-002")

        self.assertTrue(result["pass"])
        self.assertEqual(result["task_headings"], ["扩展 brief 过滤（TASK-002 / REQ-001）"])
        self.assertEqual(result["current_task"], "TASK-002")
        self.assertIn("## 扩展 brief 过滤（TASK-002 / REQ-001）", result["focus_sections"])

    def test_execute_brief_fails_when_requested_task_is_missing(self) -> None:
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
                body=VALID_EXECUTION_BODY,
            )

            result = workflow_brief.build_brief(root, feature=feature, doc_id=doc_id, target="execute", task="TASK-999")

        self.assertFalse(result["pass"])
        self.assertEqual(result["task_headings"], [])
        self.assertIn("requested task TASK-999 was not found", result["failures"])

    def test_plain_brief_is_short_and_actionable(self) -> None:
        payload = {
            "pass": True,
            "state": "ready-for-execution",
            "reason": "IPD exists and upstream chain is current",
            "next_skill": "using-git-worktrees",
            "must_read": ["docs/coding-plugins/features/x/plans/y-IPD.md"],
            "may_skip": ["docs/coding-plugins/features/x/requirements/y-PRD.md"],
            "task_headings": ["实现功能（TASK-001 / REQ-001）"],
            "execution_source": "IPD task chapters",
            "new_plan_policy": "create-new-ipd",
            "failures": [],
        }

        text = workflow_brief.format_plain(payload)

        self.assertIn("State: ready-for-execution", text)
        self.assertIn("Must read:", text)
        self.assertIn("May skip unless rewind triggers fire:", text)
        self.assertIn("实现功能（TASK-001 / REQ-001）", text)
        self.assertLessEqual(len(text.splitlines()), 18)


if __name__ == "__main__":
    unittest.main()
