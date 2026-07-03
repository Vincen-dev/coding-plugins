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
from test_workflow_guard import VALID_EXECUTION_LOCK, path_for, write_approved_upstream, write_doc


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
                body=VALID_EXECUTION_LOCK
                + """
## 执行简报

- **执行来源:** 只按本 IPD 的任务章节执行。
- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **新计划策略:** 每次新计划新建 IPD，不向旧 IPD 追加任务。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 校验 brief | REQ-001 | `python3 -m unittest scripts/test_workflow_brief.py` | `docs/coding-plugins/features/workflow-runtime/evidences/workflow-runtime-guard-TED.md` |

## 校验 brief（TASK-001 / REQ-001）
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
        self.assertEqual(result["task_headings"], ["校验 brief（TASK-001 / REQ-001）"])
        self.assertEqual(result["execution_source"], "IPD task chapters")
        self.assertEqual(result["new_plan_policy"], "create-new-ipd")

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
