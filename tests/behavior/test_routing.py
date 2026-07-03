#!/usr/bin/env python3
"""Behavior-level tests for Coding Plugins routing and platform entrypoints."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import preflight


class RoutingBehaviorTests(unittest.TestCase):
    WORKFLOW_SCENARIOS = {
        "构思收敛": (
            "brainstorming",
            "spec-driven-development",
            "不创建 PRD/TDD/TID/TCD/IPD/TED",
        ),
        "新需求": (
            "spec-driven-development",
            "document-metadata",
            "writing-requirements",
            "writing-technicals",
            "writing-test-cases",
            "writing-plans",
            "using-git-worktrees",
            "test-driven-development",
            "verification-before-completion",
            "git-commit",
        ),
        "Bug 修复": (
            "systematic-debugging",
            "test-driven-development",
            "verification-before-completion",
        ),
        "直接提交": (
            "git-commit",
            "检查 diff",
            "Authored-by",
            "验证最新提交",
        ),
        "完成收尾": (
            "verification-before-completion",
            "git-commit",
            "finishing-a-development-branch",
        ),
        "插件维护": (
            "writing-skills",
            "test-driven-development",
            "quick_validate",
            "verification-before-completion",
        ),
        "并行任务": (
            "dispatching-parallel-agents",
            "为每个任务选择对应技能",
            "运行整体验证",
        ),
    }

    def read_text(self, relative_path: str) -> str:
        return (ROOT / relative_path).read_text(encoding="utf-8")

    def read_json(self, relative_path: str) -> dict:
        return json.loads(self.read_text(relative_path))

    def skill_names(self) -> list[str]:
        return sorted(path.parent.name for path in (ROOT / "skills").glob("*/SKILL.md"))

    def assert_ordered(self, text: str, expected_terms: tuple[str, ...]) -> None:
        cursor = -1
        for term in expected_terms:
            index = text.find(term, cursor + 1)
            self.assertGreater(index, cursor, f"{term!r} is missing or out of order")
            cursor = index

    def markdown_section(self, text: str, heading: str) -> str:
        marker = f"\n### {heading}\n"
        start = text.find(marker)
        self.assertNotEqual(start, -1, f"missing section heading: {heading}")
        start += len(marker)
        next_heading = text.find("\n### ", start)
        if next_heading == -1:
            return text[start:]
        return text[start:next_heading]

    def test_using_entry_routes_direct_intents_to_required_skills(self) -> None:
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")

        for skill_name in (
            "brainstorming",
            "document-metadata",
            "requesting-code-review",
            "receiving-code-review",
            "verification-before-completion",
            "finishing-a-development-branch",
            "git-commit",
            "writing-skills",
            "writing-requirements",
            "writing-test-cases",
            "using-git-worktrees",
            "dispatching-parallel-agents",
        ):
            self.assertIn(skill_name, entry)

    def test_using_entry_routes_development_intents_to_required_skills(self) -> None:
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")

        for skill_name in (
            "brainstorming",
            "spec-driven-development",
            "writing-requirements",
            "writing-technicals",
            "writing-test-cases",
            "writing-plans",
            "using-git-worktrees",
            "subagent-driven-development",
            "executing-plans",
            "test-driven-development",
            "systematic-debugging",
        ):
            self.assertIn(skill_name, entry)

    def test_claude_reference_documents_explicit_namespace_for_each_skill(self) -> None:
        reference = self.read_text("skills/using-coding-plugins/references/claude-tools.md")

        for skill_name in self.skill_names():
            self.assertIn(f"/coding-plugins:{skill_name}", reference)

    def test_session_start_hook_outputs_json_entry_context(self) -> None:
        output = subprocess.check_output(
            ["bash", str(ROOT / "hooks" / "session-start-codex")],
            cwd=ROOT,
            text=True,
        )
        payload = json.loads(output)
        hook_output = payload["hookSpecificOutput"]

        self.assertEqual(hook_output["hookEventName"], "SessionStart")
        self.assertIn("coding-plugins:using-coding-plugins", hook_output["additionalContext"])

    def test_preflight_runs_behavior_tests(self) -> None:
        commands = preflight.build_validation_commands(ROOT, [], [])
        command_text = "\n".join(" ".join(command) for command in commands)

        self.assertIn("tests.behavior.test_routing", command_text)

    def test_workflow_scenarios_document_ordered_skill_chains(self) -> None:
        workflow = self.read_text("docs/workflow-chain.md")
        self.assertIn("## 场景链路契约", workflow)
        scenario_section = workflow.split("## 场景链路契约", 1)[1]

        for scenario, expected_terms in self.WORKFLOW_SCENARIOS.items():
            scenario_text = self.markdown_section(scenario_section, scenario)
            self.assert_ordered(scenario_text, expected_terms)

    def test_scenario_routing_contract_matches_available_skills_and_workflow_docs(self) -> None:
        contract = self.read_json("docs/coding-plugins/scenario-routing.json")
        workflow = self.read_text("docs/workflow-chain.md")
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")
        skill_names = set(self.skill_names())

        self.assertEqual(contract["artifact_chain"], ["PRD", "TDD", "TID", "TCD", "IPD", "TED"])
        headings = [scenario["doc_heading"] for scenario in contract["scenarios"]]
        self.assertEqual(len(headings), len(set(headings)), "scenario doc_heading values must be unique")

        for scenario in contract["scenarios"]:
            self.assertRegex(scenario["id"], r"^[a-z0-9_]+$")
            scenario_text = self.markdown_section(workflow, scenario["doc_heading"])
            for skill_name in scenario["skills"]:
                self.assertIn(skill_name, skill_names)
                self.assertIn(skill_name, entry)
                self.assertIn(skill_name, scenario_text)

            if scenario["artifacts"]:
                artifact_positions = [contract["artifact_chain"].index(artifact) for artifact in scenario["artifacts"] if artifact != "README"]
                self.assertEqual(artifact_positions, sorted(artifact_positions))

    def test_scenario_routing_contract_uses_structured_gates_and_case_coverage(self) -> None:
        contract = self.read_json("docs/coding-plugins/scenario-routing.json")
        case_index = self.read_text("tests/fixtures/formal-feature-chain/CASE-INDEX.md")
        known_case_ids = set(re.findall(r"\bcase_id:[ \t]*([A-Za-z0-9_.-]+)", case_index))
        known_gate_ids = set(contract["gate_catalog"])

        self.assertEqual(contract["schema_version"], 2)
        self.assertTrue(known_case_ids)
        self.assertTrue(known_gate_ids)

        for scenario in contract["scenarios"]:
            with self.subTest(scenario=scenario["id"]):
                case_ids = scenario.get("case_ids", [])
                gate_ids = scenario.get("gate_ids", [])
                self.assertTrue(case_ids, "scenario must link to at least one quality case")
                self.assertTrue(gate_ids, "scenario must use structured gate ids")
                self.assertEqual(len(gate_ids), len(set(gate_ids)), "scenario gate ids must be unique")

                for case_id in case_ids:
                    self.assertIn(case_id, known_case_ids)

                for gate_id in gate_ids:
                    self.assertRegex(gate_id, r"^[a-z0-9_]+$")
                    self.assertIn(gate_id, known_gate_ids)

                self.assertNotIn("gates", scenario, "free-text gates must not duplicate structured gate_ids")

    def test_plan_scenario_does_not_claim_ted_as_direct_artifact(self) -> None:
        contract = self.read_json("docs/coding-plugins/scenario-routing.json")
        scenario = next(item for item in contract["scenarios"] if item["id"] == "test_cases_to_plan")

        self.assertEqual(scenario["skills"], ["document-metadata", "writing-plans"])
        self.assertEqual(scenario["artifacts"], ["IPD"])
        self.assertIn("ted_target_only", scenario["gate_ids"])

    def test_ipd_template_documents_all_non_executable_plan_states(self) -> None:
        template = self.read_text("skills/writing-plans/templates/implementation-plan.md")

        self.assertIn("plan-draft", template)
        self.assertIn("plan-unlocked", template)
        self.assertIn("plan-stale", template)

    def test_ipd_template_keeps_execution_brief_inside_ipd(self) -> None:
        template = self.read_text("skills/writing-plans/templates/implementation-plan.md")
        skill = self.read_text("skills/writing-plans/SKILL.md")
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")

        self.assertIn("## 执行简报", template)
        self.assertIn("每次新计划新建 IPD", template)
        self.assertIn("不得向旧 IPD 追加新计划任务", skill)
        self.assertIn("scripts/workflow_brief.py", entry)
        self.assertIn("不重复读取完整 PRD/TDD/TID/TCD", entry)
        self.assertNotIn("execution-contract.md", template)
        self.assertNotIn("execution-contract.md", skill)

    def test_formal_fixture_ipds_use_execution_brief_contract(self) -> None:
        fixture_root = ROOT / "tests" / "fixtures" / "formal-feature-chain"
        ipd_paths = sorted(fixture_root.glob("docs/coding-plugins/features/*/plans/*-IPD.md"))

        self.assertTrue(ipd_paths, "formal fixture must include IPD documents")
        for path in ipd_paths:
            relative = path.relative_to(ROOT)
            text = path.read_text(encoding="utf-8")
            with self.subTest(path=str(relative)):
                self.assertIn("source_hash: sha256:", text)
                self.assertIn("## 执行锁定区", text)
                self.assertIn("## 执行简报", text)
                self.assertIn("## 任务总览", text)
                self.assertIsNotNone(re.search(r"^## .+（TASK-\d{3,} / REQ-\d{3,}）$", text, re.MULTILINE))

    def test_claude_usage_documents_session_start_prompt(self) -> None:
        usage = self.read_text("docs/claude-code-usage.md")
        reference = self.read_text("skills/using-coding-plugins/references/claude-tools.md")

        self.assertIn("## 会话启动提示", usage)
        self.assertIn("把下面提示作为 Claude Code 会话开始消息", usage)
        self.assertIn("/coding-plugins:using-coding-plugins", usage)
        self.assertIn("/coding-plugins:brainstorming", usage)
        self.assertIn("默认入口", usage)
        self.assertIn("构思入口", usage)
        self.assertIn("方案讨论", usage)
        self.assertIn("## 会话启动提示", reference)
        self.assertIn("/coding-plugins:using-coding-plugins", reference)

    def test_claude_usage_treats_auto_selection_as_best_effort(self) -> None:
        usage = self.read_text("docs/claude-code-usage.md")

        self.assertIn("best-effort", usage)
        self.assertIn("手动调用", usage)
        self.assertNotIn("会根据技能 description 自动选择相关技能；也可以手动调用具体技能。", usage)

    def test_user_facing_docs_include_brainstorming_entrypoint(self) -> None:
        readme = self.read_text("README.md")
        installation = self.read_text("docs/installation.md")

        for document in (readme, installation):
            self.assertIn("brainstorming", document)
            self.assertIn("方案讨论", document)
            self.assertIn("/coding-plugins:brainstorming", document)

    def test_scenario_routing_contract_covers_all_major_entrypoints(self) -> None:
        contract = self.read_json("docs/coding-plugins/scenario-routing.json")
        scenario_ids = {scenario["id"] for scenario in contract["scenarios"]}

        for scenario_id in (
            "idea_brainstorming",
            "new_unclear_requirement",
            "approved_prd_to_technicals",
            "technicals_to_test_cases",
            "test_cases_to_plan",
            "existing_ipd_execution",
            "bug_or_ci_failure",
            "code_review_or_feedback",
            "plugin_workflow_maintenance",
            "direct_commit",
            "finish_branch",
            "parallel_tasks",
        ):
            self.assertIn(scenario_id, scenario_ids)

    def test_codex_default_prompts_include_brainstorming_entrypoint(self) -> None:
        manifest = self.read_json(".codex-plugin/plugin.json")
        prompts = manifest["interface"]["defaultPrompt"]
        manifest_text = json.dumps(manifest, ensure_ascii=False)
        claude_manifest = self.read_text(".claude-plugin/plugin.json")

        self.assertTrue(any("方案" in prompt or "值得做" in prompt for prompt in prompts))
        self.assertTrue(any("规格" in prompt for prompt in prompts))
        self.assertIn("构思", manifest_text)
        self.assertIn("方案讨论", manifest_text)
        self.assertIn("构思", claude_manifest)

    def test_brainstorming_is_pre_sdd_and_does_not_create_formal_artifacts(self) -> None:
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")
        brainstorming = self.read_text("skills/brainstorming/SKILL.md")
        workflow = self.read_text("docs/workflow-chain.md")
        contract = self.read_json("docs/coding-plugins/scenario-routing.json")

        self.assertIn("方案讨论、头脑风暴、产品方向不清、是否值得做", entry)
        self.assertIn("brainstorming", entry)
        self.assertIn("spec-driven-development", brainstorming)
        self.assertIn("不创建 README、PRD、TDD、TID、TCD、IPD 或 TED", brainstorming)
        self.assert_ordered(workflow, ("brainstorming", "spec-driven-development", "writing-requirements"))

        scenario = next(item for item in contract["scenarios"] if item["id"] == "idea_brainstorming")
        self.assertEqual(scenario["skills"], ["brainstorming"])
        self.assertEqual(scenario["artifacts"], [])


if __name__ == "__main__":
    unittest.main()
