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


VALID_EXECUTION_LOCK = """## 执行锁定区

- **Intent Lock:** 只执行 workflow guard 的锁定校验。
- **Scope Fence:** 包含 IPD 执行入口；不包含 release。
- **Required Spec IDs:** REQ-001
- **Required Tests:** `python3 -m unittest scripts/test_workflow_guard.py`
- **Review Gates:** 检查执行门禁输出。
- **Rewind Triggers:** 上游文档变更、source_hash 不匹配或验证失败。
"""

VALID_EXECUTION_BRIEF = """## 执行简报

- **执行来源:** 只按本 IPD 的任务章节执行。
- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TDD/TID/TCD 已由 source_hash 锁定。
- **新计划策略:** 每次新计划新建 IPD，不向旧 IPD 追加任务。
"""

VALID_TASKS = """## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 校验 workflow guard | REQ-001 | `python3 -m unittest scripts/test_workflow_guard.py` | `docs/coding-plugins/features/workflow-runtime/evidences/workflow-runtime-guard-TED.md` |

## 校验 workflow guard（TASK-001 / REQ-001）
"""

VALID_EXECUTION_BODY = VALID_EXECUTION_LOCK + "\n" + VALID_EXECUTION_BRIEF + "\n" + VALID_TASKS


def write_doc(
    path: Path,
    *,
    status: str = "draft",
    source_hash: str | None = None,
    body: str = "",
) -> None:
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
    if body:
        lines.extend(["", body.rstrip(), ""])
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

    def test_execute_target_blocks_plan_without_execution_lock_section(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature = "workflow-runtime"
            doc_id = "workflow-runtime-guard"
            write_approved_upstream(root, feature, doc_id)
            source_hash = workflow_state.compute_upstream_hash(root, feature=feature, doc_id=doc_id)
            write_doc(path_for(root, feature, doc_id, "plans", "IPD"), status="approved", source_hash=source_hash)

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertIn("IPD execution lock section is missing", result["failures"])

    def test_execute_target_blocks_incomplete_execution_lock_section(self) -> None:
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
                body="""## 执行锁定区

- **Intent Lock:** 只执行 workflow guard 的锁定校验。
- **Scope Fence:** 包含 IPD 执行入口；不包含 release。
""",
            )

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertIn("IPD execution lock is missing fields: Required Spec IDs, Required Tests, Review Gates, Rewind Triggers", result["failures"])

    def test_execute_target_blocks_plan_without_execution_brief(self) -> None:
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
                body=VALID_EXECUTION_LOCK + "\n" + VALID_TASKS,
            )

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertIn("IPD execution brief section is missing", result["failures"])

    def test_execute_target_blocks_plan_without_task_chapter(self) -> None:
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
                + "\n"
                + VALID_EXECUTION_BRIEF
                + """
## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 校验 workflow guard | REQ-001 | `python3 -m unittest scripts/test_workflow_guard.py` | `docs/coding-plugins/features/workflow-runtime/evidences/workflow-runtime-guard-TED.md` |
""",
            )

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

        self.assertFalse(result["pass"])
        self.assertIn("IPD task chapter is missing", result["failures"])

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
                body=VALID_EXECUTION_BODY,
            )

            result = workflow_guard.check(root, feature=feature, doc_id=doc_id, target="execute")

            self.assertTrue(result["pass"])
            self.assertEqual(result["state"], "ready-for-execution")
            self.assertEqual(
                result["next_context"]["must_read"],
                ["docs/coding-plugins/features/workflow-runtime/plans/workflow-runtime-guard-IPD.md"],
            )
            self.assertIn(
                "docs/coding-plugins/features/workflow-runtime/requirements/workflow-runtime-guard-PRD.md",
                result["next_context"]["may_skip"],
            )
            self.assertIn("## 执行锁定区", result["next_context"]["focus_sections"])
            self.assertIn("## 任务总览", result["next_context"]["focus_sections"])
            self.assertEqual(
                result["next_context"]["new_plan_policy"],
                "create a new IPD for each new plan; do not append new plan tasks to an existing IPD",
            )


if __name__ == "__main__":
    unittest.main()
