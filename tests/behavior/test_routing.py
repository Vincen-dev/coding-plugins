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
    def read_text(self, relative_path: str) -> str:
        return (ROOT / relative_path).read_text(encoding="utf-8")

    def skill_names(self) -> list[str]:
        return sorted(path.parent.name for path in (ROOT / "skills").glob("*/SKILL.md"))

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


if __name__ == "__main__":
    unittest.main()
