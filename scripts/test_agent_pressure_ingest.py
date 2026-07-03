#!/usr/bin/env python3
"""Regression tests for live agent pressure result ingestion."""

from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import agent_pressure_ingest


class AgentPressureIngestTests(unittest.TestCase):
    def raw_case(self) -> dict:
        return {
            "id": "LIVE-PARALLEL-001",
            "scenario_id": "parallel_tasks",
            "agent_id": "019f28ce-591b-7403-8083-1051089d999b",
            "phase": "historical_red",
            "agent_discipline_passed": True,
            "command_passed": False,
            "expected_failure": True,
            "scenario_passed": True,
            "summary": "Agent preserved mixed command outcomes.",
            "observed_behaviors": [
                "split_only_independent_domains",
                "required_main_agent_review_after_subagents",
                "required_overall_verification_before_completion",
            ],
            "execution_evidence": [
                {
                    "evidence_type": "tool_command_output",
                    "source": "codex_multi_agent:019f28ce-591b-7403-8083-1051089d999b:json.tool",
                    "actual_observation": "JSON fixture parsed successfully.",
                    "verification_method": "Sub-agent ran json.tool.",
                    "proves": "split_only_independent_domains",
                },
                {
                    "evidence_type": "tool_command_output",
                    "source": "codex_multi_agent:019f28ce-591b-7403-8083-1051089d999b:intentional failure",
                    "actual_observation": "Intentional command exited 7.",
                    "verification_method": "Sub-agent preserved the failed command.",
                    "proves": "required_main_agent_review_after_subagents",
                },
                {
                    "evidence_type": "agent_transcript_observation",
                    "source": "codex_multi_agent:019f28ce-591b-7403-8083-1051089d999b:final_response",
                    "actual_observation": "The agent required main-agent review and overall verification.",
                    "verification_method": "Parent reviewed the final response.",
                    "proves": "required_overall_verification_before_completion",
                },
            ],
            "command_log": [
                {
                    "command": "python3 -m json.tool tests/fixtures/formal-feature-chain/agent-pressure-results.json",
                    "cwd": "/repo",
                    "exit_code": 0,
                    "stdout_excerpt": "JSON fixture parsed successfully",
                    "stderr_excerpt": "",
                },
                {
                    "command": "python3 -c \"import sys; print('intentional parallel failure'); sys.exit(7)\"",
                    "cwd": "/repo",
                    "exit_code": 7,
                    "stdout_excerpt": "intentional parallel failure",
                    "stderr_excerpt": "",
                },
            ],
            "residual_risks": ["Main agent still needs to review the result."],
        }

    def test_normalizes_command_hashes_and_transcript_hash(self) -> None:
        normalized = agent_pressure_ingest.normalize_case(self.raw_case())

        self.assertEqual(normalized["phase"], "historical_red")
        self.assertFalse(normalized["command_passed"])
        self.assertTrue(normalized["expected_failure"])
        for command in normalized["command_log"]:
            self.assertRegex(command["stdout_sha256"], r"^sha256:[0-9a-f]{64}$")
            self.assertRegex(command["stderr_sha256"], r"^sha256:[0-9a-f]{64}$")
        self.assertEqual(normalized["transcript"]["source"], "command_log")
        self.assertEqual(normalized["transcript"]["format"], "command-log-v1")
        self.assertEqual(normalized["transcript"]["command_count"], 2)
        self.assertRegex(normalized["transcript"]["sha256"], r"^sha256:[0-9a-f]{64}$")

    def test_rejects_expected_failure_that_is_not_boolean(self) -> None:
        raw = self.raw_case()
        raw["expected_failure"] = [{"command": "guard", "exit_code": 42}]

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "expected_failure must be boolean"):
            agent_pressure_ingest.normalize_case(raw)

    def test_rejects_command_success_when_expected_failure_is_true(self) -> None:
        raw = self.raw_case()
        raw["command_passed"] = True

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "expected-failure cases must not claim command success"):
            agent_pressure_ingest.normalize_case(raw)

    def test_rejects_unstable_phase_values(self) -> None:
        raw = self.raw_case()
        raw["phase"] = "mixed_command_outcome_requires_main_review"

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "invalid phase"):
            agent_pressure_ingest.normalize_case(raw)

    def test_rejects_observed_behaviors_that_are_not_lists(self) -> None:
        raw = self.raw_case()
        raw["observed_behaviors"] = {"split_only_independent_domains": True}

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "observed_behaviors must be a non-empty list"):
            agent_pressure_ingest.normalize_case(raw)

    def test_rejects_execution_evidence_that_is_not_a_list(self) -> None:
        raw = self.raw_case()
        raw["execution_evidence"] = {"validation_result": "OK"}

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "execution_evidence must be a non-empty list"):
            agent_pressure_ingest.normalize_case(raw)

    def test_rejects_execution_evidence_with_unknown_type(self) -> None:
        raw = self.raw_case()
        raw["execution_evidence"][0]["evidence_type"] = "routing_contract"

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "invalid execution_evidence type"):
            agent_pressure_ingest.normalize_case(raw)

    def test_rejects_execution_evidence_that_does_not_prove_exact_behaviors(self) -> None:
        raw = self.raw_case()
        raw["execution_evidence"][0]["proves"] = "split_only_independent_domains, required_main_agent_review_after_subagents"

        with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "execution_evidence proves must match observed_behaviors"):
            agent_pressure_ingest.normalize_case(raw)

    def test_cli_ingests_json_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            input_path = Path(tmp) / "raw.json"
            output_path = Path(tmp) / "normalized.json"
            input_path.write_text(json.dumps({"cases": [self.raw_case()]}, ensure_ascii=False), encoding="utf-8")

            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = agent_pressure_ingest.main(["--input", str(input_path), "--output", str(output_path)])

            self.assertEqual(exit_code, 0)
            self.assertIn("ingested 1 cases", stdout.getvalue())
            payload = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(payload["schema_version"], 1)
            self.assertEqual(payload["artifact"]["kind"], "agent-pressure-ingest")
            self.assertEqual(payload["cases"][0]["transcript"]["source"], "command_log")

    def test_cli_can_write_split_case_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            input_path = Path(tmp) / "raw.json"
            output_path = Path(tmp) / "agent-pressure-results.json"
            input_path.write_text(json.dumps({"cases": [self.raw_case()]}, ensure_ascii=False), encoding="utf-8")

            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = agent_pressure_ingest.main(
                    [
                        "--input",
                        str(input_path),
                        "--output",
                        str(output_path),
                        "--split-cases",
                        "--cases-dir",
                        "agent-pressure-cases",
                    ]
                )

            self.assertEqual(exit_code, 0)
            manifest = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertNotIn("cases", manifest)
            self.assertEqual(manifest["cases_dir"], "agent-pressure-cases")
            self.assertEqual(manifest["case_count"], 1)
            self.assertEqual(manifest["case_files"], ["live-parallel-001.json"])
            case_path = output_path.parent / manifest["cases_dir"] / manifest["case_files"][0]
            self.assertTrue(case_path.exists())
            case = json.loads(case_path.read_text(encoding="utf-8"))
            self.assertEqual(case["id"], "LIVE-PARALLEL-001")
            self.assertEqual(case["transcript"]["source"], "command_log")

    def test_cli_can_write_formal_fixture_manifest(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            input_path = Path(tmp) / "raw.json"
            output_path = Path(tmp) / "agent-pressure-results.json"
            input_path.write_text(json.dumps({"cases": [self.raw_case()]}, ensure_ascii=False), encoding="utf-8")

            stdout = io.StringIO()
            with contextlib.redirect_stdout(stdout):
                exit_code = agent_pressure_ingest.main(
                    [
                        "--input",
                        str(input_path),
                        "--output",
                        str(output_path),
                        "--split-cases",
                        "--fixture-manifest",
                        "--run-id",
                        "2026-07-04-agent-pressure-001",
                        "--source-contract",
                        "docs/coding-plugins/scenario-routing.json",
                    ]
                )

            self.assertEqual(exit_code, 0)
            self.assertIn("ingested 1 cases", stdout.getvalue())
            manifest = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["schema_version"], 2)
            self.assertEqual(manifest["run_id"], "2026-07-04-agent-pressure-001")
            self.assertEqual(manifest["source_contract"], "docs/coding-plugins/scenario-routing.json")
            self.assertIn("execution_evidence_policy", manifest)
            self.assertIn("transcript_archive_policy", manifest)
            self.assertNotIn("artifact", manifest)
            self.assertNotIn("cases", manifest)

    def test_split_manifest_rejects_case_filename_collisions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_path = Path(tmp) / "agent-pressure-results.json"
            first = self.raw_case()
            first["id"] = "LIVE PARALLEL 001"
            second = self.raw_case()
            second["id"] = "LIVE-PARALLEL-001"
            payload = agent_pressure_ingest.normalize_payload({"cases": [first, second]})

            with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "duplicate case filename"):
                agent_pressure_ingest.write_payload(
                    payload,
                    output_path,
                    split_cases=True,
                    cases_dir="agent-pressure-cases",
                    fixture_manifest=False,
                    run_id=None,
                    source_contract=None,
                    prune_stale=False,
                )

    def test_split_manifest_rejects_stale_case_files_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_path = Path(tmp) / "agent-pressure-results.json"
            case_dir = Path(tmp) / "agent-pressure-cases"
            case_dir.mkdir()
            (case_dir / "stale.json").write_text("{}", encoding="utf-8")
            payload = agent_pressure_ingest.normalize_payload({"cases": [self.raw_case()]})

            with self.assertRaisesRegex(agent_pressure_ingest.IngestError, "stale split case files"):
                agent_pressure_ingest.write_payload(
                    payload,
                    output_path,
                    split_cases=True,
                    cases_dir="agent-pressure-cases",
                    fixture_manifest=False,
                    run_id=None,
                    source_contract=None,
                    prune_stale=False,
                )

    def test_split_manifest_can_prune_stale_case_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_path = Path(tmp) / "agent-pressure-results.json"
            case_dir = Path(tmp) / "agent-pressure-cases"
            case_dir.mkdir()
            stale_path = case_dir / "stale.json"
            stale_path.write_text("{}", encoding="utf-8")
            payload = agent_pressure_ingest.normalize_payload({"cases": [self.raw_case()]})

            agent_pressure_ingest.write_payload(
                payload,
                output_path,
                split_cases=True,
                cases_dir="agent-pressure-cases",
                fixture_manifest=False,
                run_id=None,
                source_contract=None,
                prune_stale=True,
            )

            self.assertFalse(stale_path.exists())
            manifest = json.loads(output_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["case_files"], ["live-parallel-001.json"])


if __name__ == "__main__":
    unittest.main()
