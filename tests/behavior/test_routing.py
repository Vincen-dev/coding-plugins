#!/usr/bin/env python3
"""Behavior-level tests for Coding Plugins routing and platform entrypoints."""

from __future__ import annotations

import json
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
            self.assertIn(f"### {scenario}", scenario_section)
            scenario_text = scenario_section.split(f"### {scenario}", 1)[1]
            next_heading = scenario_text.find("\n### ")
            if next_heading != -1:
                scenario_text = scenario_text[:next_heading]
            self.assert_ordered(scenario_text, expected_terms)

    def test_scenario_routing_contract_matches_available_skills_and_workflow_docs(self) -> None:
        contract = self.read_json("docs/coding-plugins/scenario-routing.json")
        workflow = self.read_text("docs/workflow-chain.md")
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")
        skill_names = set(self.skill_names())

        self.assertEqual(contract["artifact_chain"], ["PRD", "TDD", "TID", "TCD", "IPD", "TED"])

        for scenario in contract["scenarios"]:
            self.assertRegex(scenario["id"], r"^[a-z0-9_]+$")
            heading = f"### {scenario['doc_heading']}"
            self.assertIn(heading, workflow)
            scenario_text = workflow.split(heading, 1)[1]
            next_heading = scenario_text.find("\n### ")
            if next_heading != -1:
                scenario_text = scenario_text[:next_heading]
            for skill_name in scenario["skills"]:
                self.assertIn(skill_name, skill_names)
                self.assertIn(skill_name, entry)
                self.assertIn(skill_name, scenario_text)

            if scenario["artifacts"]:
                artifact_positions = [contract["artifact_chain"].index(artifact) for artifact in scenario["artifacts"] if artifact != "README"]
                self.assertEqual(artifact_positions, sorted(artifact_positions))

    def test_claude_usage_documents_session_start_prompt(self) -> None:
        usage = self.read_text("docs/claude-code-usage.md")
        reference = self.read_text("skills/using-coding-plugins/references/claude-tools.md")

        self.assertIn("## 会话启动提示", usage)
        self.assertIn("把下面提示作为 Claude Code 会话开始消息", usage)
        self.assertIn("/coding-plugins:using-coding-plugins", usage)
        self.assertIn("## 会话启动提示", reference)
        self.assertIn("/coding-plugins:using-coding-plugins", reference)

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
