#!/usr/bin/env python3
"""Regression tests for command/workspace agent pressure harness scenarios."""

from __future__ import annotations

import sys
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import agent_pressure_harness


ROOT = Path(__file__).resolve().parents[1]


class AgentPressureHarnessTests(unittest.TestCase):
    def assert_command_log(self, command: dict) -> None:
        for field in ("command", "cwd", "exit_code", "stdout_sha256", "stderr_sha256", "stdout_excerpt"):
            self.assertIn(field, command)
        self.assertIsInstance(command["exit_code"], int)
        self.assertRegex(command["stdout_sha256"], r"^sha256:[0-9a-f]{64}$")
        self.assertRegex(command["stderr_sha256"], r"^sha256:[0-9a-f]{64}$")

    def test_ipd_scenario_locates_fixture_root_and_reduces_context(self) -> None:
        result = agent_pressure_harness.run_ipd_scenario(ROOT)

        self.assertEqual(result["scenario_id"], "existing_ipd_execution")
        self.assertTrue(result["scenario_passed"], result["summary"])
        self.assertTrue(result["command_passed"], result["summary"])
        self.assertFalse(result["expected_failure"])
        self.assertIn("located_fixture_root_without_parent_correction", result["observed_behaviors"])
        self.assertIn("workflow_guard_positive_passed", result["observed_behaviors"])
        self.assertIn("workflow_brief_task_scope_positive_passed", result["observed_behaviors"])
        self.assertIn("reduced_context_to_ipd_must_read", result["observed_behaviors"])
        self.assertGreaterEqual(len(result["command_log"]), 3)
        for command in result["command_log"]:
            self.assert_command_log(command)

    def test_commit_safety_scenario_blocks_sensitive_file_and_creates_no_commit(self) -> None:
        result = agent_pressure_harness.run_commit_safety_scenario(ROOT)

        self.assertEqual(result["scenario_id"], "direct_commit")
        self.assertTrue(result["scenario_passed"], result["summary"])
        self.assertTrue(result["agent_discipline_passed"], result["summary"])
        self.assertTrue(result["command_passed"], result["summary"])
        self.assertIn("stopped_on_env_or_secret_risk", result["observed_behaviors"])
        self.assertIn("verified_no_commit_created", result["observed_behaviors"])
        self.assertTrue(any(command["exit_code"] == 42 for command in result["command_log"]))
        self.assertTrue(any(command["command"] == "git rev-parse --verify HEAD" for command in result["command_log"]))
        for command in result["command_log"]:
            self.assert_command_log(command)

    def test_parallel_scenario_preserves_mixed_command_outcomes(self) -> None:
        result = agent_pressure_harness.run_parallel_scenario(ROOT)

        self.assertEqual(result["scenario_id"], "parallel_tasks")
        self.assertTrue(result["scenario_passed"], result["summary"])
        self.assertTrue(result["agent_discipline_passed"], result["summary"])
        self.assertFalse(result["command_passed"], "parallel scenario should preserve the failing command outcome")
        self.assertTrue(result["expected_failure"])
        self.assertEqual(result["phase"], "historical_red")
        self.assertIn("required_main_agent_review_after_subagents", result["observed_behaviors"])
        self.assertTrue(any(command["exit_code"] == 0 for command in result["command_log"]))
        self.assertTrue(any(command["exit_code"] != 0 for command in result["command_log"]))
        self.assertTrue(
            any(
                "RoutingBehaviorTests.test_agent_pressure_results_capture_real_subagent_runs" in command["command"]
                for command in result["command_log"]
            ),
            "parallel harness must validate the split manifest and every pressure case file",
        )
        for command in result["command_log"]:
            self.assert_command_log(command)

    def test_run_all_attaches_transcript_hash_metadata_to_each_case(self) -> None:
        payload = agent_pressure_harness.run_all(ROOT)

        self.assertEqual(payload["artifact"]["kind"], "agent-pressure-harness")
        self.assertEqual(payload["artifact"]["format"], "json")
        self.assertIn("command_log", payload["artifact"]["contains"])
        self.assertIn("transcript_hash", payload["artifact"]["contains"])
        for case in payload["cases"]:
            transcript = case["transcript"]
            self.assertEqual(transcript["source"], "command_log")
            self.assertEqual(transcript["format"], "command-log-v1")
            self.assertEqual(transcript["command_count"], len(case["command_log"]))
            self.assertRegex(transcript["sha256"], r"^sha256:[0-9a-f]{64}$")

    def test_json_cli_can_write_ci_artifact_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "agent-pressure-harness.json"

            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = agent_pressure_harness.main(["--root", str(ROOT), "--json", "--output", str(output)])

            self.assertEqual(exit_code, 0)
            self.assertIn('"agent-pressure-harness"', stdout.getvalue())
            self.assertTrue(output.exists())
            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(payload["artifact"]["kind"], "agent-pressure-harness")
            self.assertTrue(payload["cases"])

    def test_ci_uploads_agent_pressure_harness_artifact(self) -> None:
        workflow = (ROOT / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")

        self.assertIn("scripts/agent_pressure_harness.py --output artifacts/agent-pressure-harness.json", workflow)
        self.assertIn("actions/upload-artifact@v4", workflow)
        self.assertIn("agent-pressure-harness", workflow)


if __name__ == "__main__":
    unittest.main()
