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
        "新需求": (
            "spec-driven-development",
            "writing-technical-design",
            "writing-plans",
            "using-git-worktrees",
            "test-driven-development",
            "verification-before-completion",
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
            "finishing-a-development-branch",
            "git-commit",
        ),
        "插件维护": (
            "writing-skills",
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
            "requesting-code-review",
            "receiving-code-review",
            "verification-before-completion",
            "finishing-a-development-branch",
            "git-commit",
            "writing-skills",
            "using-git-worktrees",
            "dispatching-parallel-agents",
        ):
            self.assertIn(skill_name, entry)

    def test_using_entry_routes_development_intents_to_required_skills(self) -> None:
        entry = self.read_text("skills/using-coding-plugins/SKILL.md")

        for skill_name in (
            "spec-driven-development",
            "writing-technical-design",
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

    def test_claude_usage_documents_session_start_prompt(self) -> None:
        usage = self.read_text("docs/claude-code-usage.md")
        reference = self.read_text("skills/using-coding-plugins/references/claude-tools.md")

        self.assertIn("## 会话启动提示", usage)
        self.assertIn("把下面提示作为 Claude Code 会话开始消息", usage)
        self.assertIn("/coding-plugins:using-coding-plugins", usage)
        self.assertIn("## 会话启动提示", reference)
        self.assertIn("/coding-plugins:using-coding-plugins", reference)


if __name__ == "__main__":
    unittest.main()
