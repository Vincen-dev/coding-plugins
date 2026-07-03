#!/usr/bin/env python3
"""Normalize live-agent pressure results into a strict JSON contract."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


ALLOWED_PHASES = {"agent_response", "real_command_positive", "historical_red"}
BOOLEAN_FIELDS = {
    "agent_discipline_passed",
    "command_passed",
    "expected_failure",
    "scenario_passed",
}
REQUIRED_CASE_FIELDS = {
    "id",
    "scenario_id",
    "phase",
    "summary",
    "observed_behaviors",
    "execution_evidence",
    "residual_risks",
    *BOOLEAN_FIELDS,
}
REQUIRED_COMMAND_FIELDS = {"command", "cwd", "exit_code", "stdout_excerpt"}
REQUIRED_EVIDENCE_FIELDS = {"evidence_type", "source", "actual_observation", "verification_method", "proves"}
ALLOWED_EVIDENCE_TYPES = {
    "agent_transcript_observation",
    "tool_command_output",
    "workspace_artifact_check",
    "vcs_state_check",
}
FIXTURE_DESCRIPTION = (
    "Real sub-agent pressure test results captured from Codex multi-agent runs. "
    "Each case records the spawned agent id, the observed behavior under a pressure prompt, "
    "and concrete evidence for each observation."
)
EXECUTION_EVIDENCE_POLICY = {
    "purpose": "Prevent agent pressure results from passing on summary claims or declared next actions only.",
    "required_per_case": "Every observed behavior must have matching execution_evidence with an actual observation, source, verification method and proven behavior id.",
    "allowed_evidence_types": [
        "agent_transcript_observation",
        "tool_command_output",
        "workspace_artifact_check",
        "vcs_state_check",
    ],
}
TRANSCRIPT_ARCHIVE_POLICY = {
    "purpose": "Keep every pressure case tied to a stable transcript hash instead of relying only on parent-agent summaries.",
    "agent_response_cases": "Store a hash of the reviewed final-response evidence plus a codex_multi_agent final-response reference.",
    "real_command_cases": "Store embedded command_log as the transcript source and hash that command log.",
}


class IngestError(ValueError):
    """Raised when a live pressure result cannot be safely normalized."""


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode()).hexdigest()


def sha256_json(value: Any) -> str:
    return sha256_text(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def case_filename(case_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", case_id).lower() + ".json"


def require_fields(value: dict[str, Any], required: set[str], *, label: str) -> None:
    missing = sorted(required - set(value))
    if missing:
        raise IngestError(f"{label} missing required fields: {', '.join(missing)}")


def validate_case_status(case: dict[str, Any]) -> None:
    for field in BOOLEAN_FIELDS:
        if not isinstance(case.get(field), bool):
            raise IngestError(f"{field} must be boolean")

    phase = case["phase"]
    if phase not in ALLOWED_PHASES:
        raise IngestError(f"invalid phase: {phase}")

    if case["expected_failure"] and case["command_passed"]:
        raise IngestError("expected-failure cases must not claim command success")


def validate_case_evidence(case: dict[str, Any]) -> None:
    observed_behaviors = case["observed_behaviors"]
    if not isinstance(observed_behaviors, list) or not observed_behaviors:
        raise IngestError("observed_behaviors must be a non-empty list")
    if not all(isinstance(behavior, str) and behavior for behavior in observed_behaviors):
        raise IngestError("observed_behaviors entries must be non-empty strings")

    execution_evidence = case["execution_evidence"]
    if not isinstance(execution_evidence, list) or not execution_evidence:
        raise IngestError("execution_evidence must be a non-empty list")
    for evidence in execution_evidence:
        if not isinstance(evidence, dict):
            raise IngestError("execution_evidence entries must be objects")
        require_fields(evidence, REQUIRED_EVIDENCE_FIELDS, label="execution_evidence entry")
        if evidence["evidence_type"] not in ALLOWED_EVIDENCE_TYPES:
            raise IngestError(f"invalid execution_evidence type: {evidence['evidence_type']}")
    if {evidence["proves"] for evidence in execution_evidence} != set(observed_behaviors):
        raise IngestError("execution_evidence proves must match observed_behaviors")


def normalize_command_log(command: dict[str, Any]) -> dict[str, Any]:
    require_fields(command, REQUIRED_COMMAND_FIELDS, label="command_log entry")
    if not isinstance(command["exit_code"], int):
        raise IngestError("command_log entry exit_code must be integer")

    stdout_text = str(command.get("stdout", command.get("stdout_excerpt", "")))
    stderr_text = str(command.get("stderr", command.get("stderr_excerpt", "")))
    normalized = dict(command)
    normalized.setdefault("stderr_excerpt", "")
    normalized["stdout_sha256"] = normalized.get("stdout_sha256") or sha256_text(stdout_text)
    normalized["stderr_sha256"] = normalized.get("stderr_sha256") or sha256_text(stderr_text)
    return normalized


def normalize_case(raw_case: dict[str, Any]) -> dict[str, Any]:
    case = dict(raw_case)
    require_fields(case, REQUIRED_CASE_FIELDS, label="case")
    validate_case_status(case)
    validate_case_evidence(case)

    command_log = case.get("command_log", [])
    if command_log:
        if not isinstance(command_log, list):
            raise IngestError("command_log must be a list")
        case["execution_depth"] = case.get("execution_depth", "real_command")
        case["command_log"] = [normalize_command_log(command) for command in command_log]
        case["transcript"] = {
            "source": "command_log",
            "format": "command-log-v1",
            "sha256": sha256_json(case["command_log"]),
            "command_count": len(case["command_log"]),
        }
    else:
        if case["phase"] != "agent_response":
            raise IngestError("non-agent-response cases must include command_log")
        ref = f"codex_multi_agent:{case.get('agent_id', 'unknown')}:final_response"
        case["transcript"] = {
            "source": "agent_final_response",
            "format": "agent-final-response-v1",
            "ref": ref,
            "sha256": sha256_json(
                {
                    "ref": ref,
                    "summary": case["summary"],
                    "observed_behaviors": case["observed_behaviors"],
                }
            ),
        }
    return case


def normalize_payload(raw_payload: dict[str, Any]) -> dict[str, Any]:
    raw_cases = raw_payload.get("cases")
    if not isinstance(raw_cases, list) or not raw_cases:
        raise IngestError("payload must contain a non-empty cases list")
    cases = [normalize_case(raw_case) for raw_case in raw_cases]
    return {
        "schema_version": 1,
        "artifact": {
            "kind": "agent-pressure-ingest",
            "format": "json",
            "version": 1,
            "generated_by": "scripts/agent_pressure_ingest.py",
            "contains": ["normalized_cases", "command_log_hashes", "transcript_hash"],
        },
        "cases": cases,
    }


def build_split_manifest(
    payload: dict[str, Any],
    *,
    cases_dir: str,
    case_files: list[str],
    fixture_manifest: bool,
    run_id: str | None,
    source_contract: str | None,
) -> dict[str, Any]:
    if fixture_manifest:
        if not run_id:
            raise IngestError("fixture manifest requires --run-id")
        if not source_contract:
            raise IngestError("fixture manifest requires --source-contract")
        return {
            "schema_version": 2,
            "run_id": run_id,
            "source_contract": source_contract,
            "description": FIXTURE_DESCRIPTION,
            "execution_evidence_policy": EXECUTION_EVIDENCE_POLICY,
            "transcript_archive_policy": TRANSCRIPT_ARCHIVE_POLICY,
            "cases_dir": cases_dir,
            "case_files": case_files,
            "case_count": len(case_files),
        }

    manifest = dict(payload)
    manifest.pop("cases")
    manifest["cases_dir"] = cases_dir
    manifest["case_files"] = case_files
    manifest["case_count"] = len(case_files)
    return manifest


def split_case_filenames(cases: list[dict[str, Any]]) -> list[str]:
    filenames = [case_filename(case["id"]) for case in cases]
    duplicate_filenames = sorted({filename for filename in filenames if filenames.count(filename) > 1})
    if duplicate_filenames:
        raise IngestError(f"duplicate case filename: {', '.join(duplicate_filenames)}")
    return sorted(filenames)


def write_payload(
    payload: dict[str, Any],
    output_path: Path,
    *,
    split_cases: bool,
    cases_dir: str,
    fixture_manifest: bool,
    run_id: str | None,
    source_contract: str | None,
    prune_stale: bool,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if fixture_manifest and not split_cases:
        raise IngestError("fixture manifest requires --split-cases")
    if not split_cases:
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return

    case_files = split_case_filenames(payload["cases"])
    case_root = output_path.parent / cases_dir
    case_root.mkdir(parents=True, exist_ok=True)
    stale_files = sorted(path for path in case_root.glob("*.json") if path.name not in set(case_files))
    if stale_files and not prune_stale:
        stale_names = ", ".join(path.name for path in stale_files)
        raise IngestError(f"stale split case files: {stale_names}")
    for stale_file in stale_files:
        stale_file.unlink()

    for case in payload["cases"]:
        filename = case_filename(case["id"])
        (case_root / filename).write_text(json.dumps(case, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    manifest = build_split_manifest(
        payload,
        cases_dir=cases_dir,
        case_files=case_files,
        fixture_manifest=fixture_manifest,
        run_id=run_id,
        source_contract=source_contract,
    )
    output_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Normalize live agent pressure results.")
    parser.add_argument("--input", required=True, help="Raw JSON pressure result payload.")
    parser.add_argument("--output", required=True, help="Normalized JSON artifact path.")
    parser.add_argument("--split-cases", action="store_true", help="Write a small manifest and one JSON file per case.")
    parser.add_argument("--cases-dir", default="agent-pressure-cases", help="Directory name for split case JSON files.")
    parser.add_argument("--fixture-manifest", action="store_true", help="Write the formal agent-pressure fixture manifest schema.")
    parser.add_argument("--run-id", help="Run id for --fixture-manifest, for example 2026-07-04-agent-pressure-001.")
    parser.add_argument("--source-contract", help="Source routing contract path for --fixture-manifest.")
    parser.add_argument("--prune-stale", action="store_true", help="Delete stale split case JSON files not present in this payload.")
    args = parser.parse_args(argv)

    try:
        raw_payload = json.loads(Path(args.input).read_text(encoding="utf-8"))
        normalized = normalize_payload(raw_payload)
        output_path = Path(args.output)
        write_payload(
            normalized,
            output_path,
            split_cases=args.split_cases,
            cases_dir=args.cases_dir,
            fixture_manifest=args.fixture_manifest,
            run_id=args.run_id,
            source_contract=args.source_contract,
            prune_stale=args.prune_stale,
        )
    except (IngestError, json.JSONDecodeError, OSError) as error:
        print(f"agent pressure ingest failed: {error}", file=sys.stderr)
        return 1

    print(f"ingested {len(normalized['cases'])} cases -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
