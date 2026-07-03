#!/usr/bin/env python3
"""Regression tests for subagent prompt construction."""

from __future__ import annotations

import sys
import tempfile
import unittest
import json
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import subagent_prompt_builder
import workflow_state
from test_workflow_guard import VALID_EXECUTION_BODY, path_for, write_approved_upstream, write_doc


class SubagentPromptBuilderTests(unittest.TestCase):
    def write_ready_ipd(self, root: Path, *, extra_task_body: str = "") -> tuple[str, str]:
        feature = "workflow-runtime"
        doc_id = "workflow-runtime-guard"
        write_approved_upstream(root, feature, doc_id)
        source_hash = workflow_state.compute_upstream_hash(root, feature=feature, doc_id=doc_id)
        task_body = """
### 任务目标

确认子代理 prompt builder 能从 IPD 当前任务章节生成稳定提示词。

### 执行前提

- 已确认需求：REQ-001 要求执行阶段只读 IPD 任务章节。
- 已确认设计：主代理负责粘贴任务全文，子代理不得自行读取完整计划。
- 已确认测试：`python3 -m unittest scripts/test_subagent_prompt_builder.py`

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 创建 | `scripts/subagent_prompt_builder.py` | 生成子代理提示词。 |
| 测试 | `scripts/test_subagent_prompt_builder.py` | 覆盖 prompt 内容和 hash。 |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`scripts/test_subagent_prompt_builder.py`
  - 预期失败：缺少 prompt builder。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`python3 -m unittest scripts/test_subagent_prompt_builder.py`
  - 预期：FAIL。

### 验证方式

| 覆盖规格 | 测试类型 | 命令或人工验收 | 预期结果 |
| --- | --- | --- | --- |
| REQ-001 | contract | `python3 -m unittest scripts/test_subagent_prompt_builder.py` | PASS |
"""
        write_doc(
            path_for(root, feature, doc_id, "plans", "IPD"),
            status="approved",
            source_hash=source_hash,
            body=VALID_EXECUTION_BODY + task_body + extra_task_body,
        )
        return feature, doc_id

    def test_build_implementer_prompt_uses_task_focused_ipd_context(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)

            result = subagent_prompt_builder.build_prompts(
                root,
                feature=feature,
                doc_id=doc_id,
                task="TASK-001",
                workdir="/repo/worktree",
            )

        implementer = result["prompts"]["implementer"]
        self.assertTrue(result["brief"]["pass"])
        self.assertEqual(result["task_id"], "TASK-001")
        self.assertIn("sha256:", result["source_hash"])
        self.assertRegex(result["prompt_hashes"]["implementer"], r"^sha256:[0-9a-f]{64}$")
        self.assertIn("Implement 任务 TASK-001", implementer)
        self.assertIn("确认子代理 prompt builder 能从 IPD 当前任务章节生成稳定提示词", implementer)
        self.assertIn("工作目录：/repo/worktree", implementer)
        self.assertIn("IPD source_hash:", implementer)
        self.assertIn("workflow_brief.py --task TASK-001", implementer)
        self.assertIn("May skip unless rewind triggers fire", implementer)
        self.assertIn("不得自行读取完整 IPD 或上游 PRD/TDD/TID/TCD", implementer)
        self.assertNotIn("# workflow-runtime-guard-PRD", implementer)
        self.assertNotIn("# workflow-runtime-guard-TDD", implementer)

    def test_task_section_stops_before_completion_check(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(
                root,
                extra_task_body="""
## 完成检查

- [ ] 每个 MUST Spec ID 都映射到任务或明确豁免。
- [ ] 已运行相关 validator、测试或 preflight。
""",
            )

            result = subagent_prompt_builder.build_prompts(root, feature=feature, doc_id=doc_id, task="TASK-001")

        implementer = result["prompts"]["implementer"]
        self.assertIn("确认子代理 prompt builder 能从 IPD 当前任务章节生成稳定提示词", implementer)
        self.assertNotIn("## 完成检查", implementer)
        self.assertNotIn("每个 MUST Spec ID 都映射到任务或明确豁免", implementer)

    def test_build_review_prompts_include_reports_and_git_range(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)

            result = subagent_prompt_builder.build_prompts(
                root,
                feature=feature,
                doc_id=doc_id,
                task="TASK-001",
                implementer_report="Status: DONE\n修改文件: scripts/subagent_prompt_builder.py",
                base_sha="abc1234",
                head_sha="def5678",
            )

        spec_review = result["prompts"]["spec-reviewer"]
        quality_review = result["prompts"]["code-quality-reviewer"]
        self.assertIn("Review spec compliance for 任务 TASK-001", spec_review)
        self.assertIn("Status: DONE", spec_review)
        self.assertIn("必须独立验证", spec_review)
        self.assertIn("REQ-001", spec_review)
        self.assertIn("你是一名资深代码评审者", quality_review)
        self.assertIn("abc1234", quality_review)
        self.assertIn("def5678", quality_review)
        self.assertIn("git diff abc1234..def5678", quality_review)

    def test_review_prompt_cli_requires_real_review_inputs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)
            stdout = StringIO()

            with redirect_stdout(stdout):
                exit_code = subagent_prompt_builder.main(
                    [
                        "--root",
                        str(root),
                        "--feature",
                        feature,
                        "--doc-id",
                        doc_id,
                        "--task",
                        "TASK-001",
                        "--kind",
                        "code-quality-reviewer",
                    ]
                )

        self.assertEqual(exit_code, 1)
        self.assertIn("--implementer-report", stdout.getvalue())
        self.assertIn("--base-sha", stdout.getvalue())
        self.assertIn("--head-sha", stdout.getvalue())

    def test_all_json_cli_requires_review_inputs_before_emitting_prompts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)
            stdout = StringIO()

            with redirect_stdout(stdout):
                exit_code = subagent_prompt_builder.main(
                    [
                        "--root",
                        str(root),
                        "--feature",
                        feature,
                        "--doc-id",
                        doc_id,
                        "--task",
                        "TASK-001",
                        "--json",
                    ]
                )

        self.assertEqual(exit_code, 1)
        self.assertIn("--implementer-report", stdout.getvalue())
        self.assertIn("--base-sha", stdout.getvalue())
        self.assertIn("--head-sha", stdout.getvalue())

    def test_all_summary_cli_does_not_require_review_inputs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)
            stdout = StringIO()

            with redirect_stdout(stdout):
                exit_code = subagent_prompt_builder.main(
                    [
                        "--root",
                        str(root),
                        "--feature",
                        feature,
                        "--doc-id",
                        doc_id,
                        "--task",
                        "TASK-001",
                    ]
                )

        self.assertEqual(exit_code, 0)
        self.assertIn("prompt_hashes", stdout.getvalue())
        self.assertNotIn("[待实现子代理回报后填入]", stdout.getvalue())

    def test_implementer_json_cli_only_emits_implementer_prompt(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)
            stdout = StringIO()

            with redirect_stdout(stdout):
                exit_code = subagent_prompt_builder.main(
                    [
                        "--root",
                        str(root),
                        "--feature",
                        feature,
                        "--doc-id",
                        doc_id,
                        "--task",
                        "TASK-001",
                        "--kind",
                        "implementer",
                        "--json",
                    ]
                )

        payload = json.loads(stdout.getvalue())
        self.assertEqual(exit_code, 0)
        self.assertEqual(set(payload["prompts"]), {"implementer"})
        self.assertEqual(set(payload["prompt_hashes"]), {"implementer"})
        self.assertNotIn("[待实现子代理回报后填入]", stdout.getvalue())

    def test_spec_reviewer_json_cli_only_emits_spec_prompt_without_git_range(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)
            stdout = StringIO()

            with redirect_stdout(stdout):
                exit_code = subagent_prompt_builder.main(
                    [
                        "--root",
                        str(root),
                        "--feature",
                        feature,
                        "--doc-id",
                        doc_id,
                        "--task",
                        "TASK-001",
                        "--kind",
                        "spec-reviewer",
                        "--implementer-report",
                        "Status: DONE",
                        "--json",
                    ]
                )

        payload = json.loads(stdout.getvalue())
        self.assertEqual(exit_code, 0)
        self.assertEqual(set(payload["prompts"]), {"spec-reviewer"})
        self.assertEqual(set(payload["prompt_hashes"]), {"spec-reviewer"})
        self.assertNotIn("[commit before task]", stdout.getvalue())
        self.assertNotIn("[current commit]", stdout.getvalue())

    def test_review_prompt_cli_accepts_real_review_inputs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)
            stdout = StringIO()

            with redirect_stdout(stdout):
                exit_code = subagent_prompt_builder.main(
                    [
                        "--root",
                        str(root),
                        "--feature",
                        feature,
                        "--doc-id",
                        doc_id,
                        "--task",
                        "TASK-001",
                        "--kind",
                        "code-quality-reviewer",
                        "--implementer-report",
                        "Status: DONE",
                        "--base-sha",
                        "abc1234",
                        "--head-sha",
                        "def5678",
                    ]
                )

        self.assertEqual(exit_code, 0)
        self.assertIn("git diff abc1234..def5678", stdout.getvalue())

    def test_missing_task_fails_before_prompt_generation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            feature, doc_id = self.write_ready_ipd(root)

            with self.assertRaises(subagent_prompt_builder.PromptBuildError):
                subagent_prompt_builder.build_prompts(root, feature=feature, doc_id=doc_id, task="TASK-999")


if __name__ == "__main__":
    unittest.main()
