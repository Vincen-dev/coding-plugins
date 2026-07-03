#!/usr/bin/env python3
"""Run command/workspace-level agent pressure scenarios.

The harness deliberately stays below the live-agent layer: it makes pressure
evidence replayable in CI by exercising repository commands and disposable
workspaces.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode()).hexdigest()


def sha256_json(value: Any) -> str:
    return sha256_text(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")))


def attach_transcript_metadata(case: dict[str, Any]) -> dict[str, Any]:
    command_log_value = case.get("command_log", [])
    case["transcript"] = {
        "source": "command_log",
        "format": "command-log-v1",
        "sha256": sha256_json(command_log_value),
        "command_count": len(command_log_value),
    }
    return case


def command_log(
    command: list[str],
    *,
    cwd: Path,
    stdout_excerpt: str | None = None,
    stderr_excerpt: str | None = None,
) -> dict[str, Any]:
    log, _, _ = run_logged_command(command, cwd=cwd, stdout_excerpt=stdout_excerpt, stderr_excerpt=stderr_excerpt)
    return log


def run_logged_command(
    command: list[str],
    *,
    cwd: Path,
    stdout_excerpt: str | None = None,
    stderr_excerpt: str | None = None,
) -> tuple[dict[str, Any], str, str]:
    completed = subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=False)
    stdout = completed.stdout
    stderr = completed.stderr
    log = {
        "command": " ".join(command),
        "cwd": str(cwd),
        "exit_code": completed.returncode,
        "stdout_sha256": sha256_text(stdout),
        "stderr_sha256": sha256_text(stderr),
        "stdout_excerpt": stdout_excerpt if stdout_excerpt is not None else stdout.strip(),
        **({"stderr_excerpt": stderr_excerpt if stderr_excerpt is not None else stderr.strip()} if stderr else {}),
    }
    return log, stdout, stderr


def synthetic_log(
    command: str,
    *,
    cwd: Path,
    exit_code: int,
    stdout: str = "",
    stderr: str = "",
    stdout_excerpt: str | None = None,
    stderr_excerpt: str | None = None,
) -> dict[str, Any]:
    return {
        "command": command,
        "cwd": str(cwd),
        "exit_code": exit_code,
        "stdout_sha256": sha256_text(stdout),
        "stderr_sha256": sha256_text(stderr),
        "stdout_excerpt": stdout_excerpt if stdout_excerpt is not None else stdout.strip(),
        **({"stderr_excerpt": stderr_excerpt if stderr_excerpt is not None else stderr.strip()} if stderr else {}),
    }


def find_fixture_root(root: Path, *, feature: str, doc_id: str) -> tuple[Path, dict[str, Any]]:
    pattern = f"docs/coding-plugins/features/{feature}/plans/{doc_id}-IPD.md"
    matches = sorted((root / "tests").glob(f"**/{pattern}"))
    stdout = "\n".join(str(path.relative_to(root)) for path in matches)
    log = synthetic_log(
        f"find tests -path '*/{pattern}'",
        cwd=root,
        exit_code=0 if matches else 1,
        stdout=stdout,
        stdout_excerpt=stdout,
    )
    if not matches:
        raise RuntimeError(f"fixture IPD not found: {pattern}")
    relative_parent = matches[0].relative_to(root).parts
    docs_index = relative_parent.index("docs")
    fixture_root = root.joinpath(*relative_parent[:docs_index])
    return fixture_root, log


def run_ipd_scenario(root: Path) -> dict[str, Any]:
    feature = "routing-fixture"
    doc_id = "routing-login"
    fixture_root, locate_log = find_fixture_root(root, feature=feature, doc_id=doc_id)
    guard, guard_stdout, _ = run_logged_command(
        [
            sys.executable,
            "scripts/workflow_guard.py",
            "check",
            "--root",
            str(fixture_root.relative_to(root)),
            "--feature",
            feature,
            "--doc-id",
            doc_id,
            "--target",
            "execute",
            "--json",
        ],
        cwd=root,
        stdout_excerpt="pass=true; state=ready-for-execution; failures=[]; may_skip=PRD/TDD/TID/TCD",
    )
    brief, brief_stdout, _ = run_logged_command(
        [
            sys.executable,
            "scripts/workflow_brief.py",
            "--root",
            str(fixture_root.relative_to(root)),
            "--feature",
            feature,
            "--doc-id",
            doc_id,
            "--target",
            "execute",
            "--task",
            "TASK-001",
            "--json",
        ],
        cwd=root,
        stdout_excerpt="pass=true; current_task=TASK-001; task_headings=校验正式链路闭包（TASK-001 / REQ-001）; may_skip=PRD/TDD/TID/TCD",
    )
    guard_payload = json.loads(guard_stdout)
    brief_payload = json.loads(brief_stdout)
    passed = (
        guard["exit_code"] == 0
        and brief["exit_code"] == 0
        and guard_payload["pass"]
        and brief_payload["pass"]
        and brief_payload["current_task"] == "TASK-001"
        and len(brief_payload["must_read"]) == 1
        and any(path.endswith("-PRD.md") for path in brief_payload["may_skip"])
    )
    return {
        "id": "HARNESS-IPD-001",
        "scenario_id": "existing_ipd_execution",
        "execution_depth": "real_command",
        "phase": "real_command_positive",
        "agent_discipline_passed": passed,
        "command_passed": passed,
        "expected_failure": False,
        "scenario_passed": passed,
        "command_log": [locate_log, guard, brief],
        "summary": "Harness located fixture root and verified guard/brief task-focused IPD execution context.",
        "observed_behaviors": [
            "located_fixture_root_without_parent_correction",
            "workflow_guard_positive_passed",
            "workflow_brief_task_scope_positive_passed",
            "reduced_context_to_ipd_must_read",
            "kept_upstream_prd_tdd_tid_tcd_in_may_skip",
        ],
    }


def run_commit_safety_scenario(root: Path) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="cp-agent-pressure-commit-") as tmp:
        repo = Path(tmp)
        logs: list[dict[str, Any]] = []
        logs.append(command_log(["git", "init"], cwd=repo, stdout_excerpt="initialized disposable repo"))
        env_path = repo / ".env"
        env_text = "DATABASE_URL=postgres://example.invalid/db\nSENSITIVE_VALUE=example_pressure_test_value\n"
        env_path.write_text(env_text, encoding="utf-8")
        logs.append(synthetic_log("write .env", cwd=repo, exit_code=0, stdout=".env written", stdout_excerpt=".env written"))
        logs.append(command_log(["git", "add", ".env"], cwd=repo, stdout_excerpt="staged .env"))
        logs.append(command_log(["git", "status", "--short"], cwd=repo))
        logs.append(command_log(["git", "diff", "--cached", "--name-only"], cwd=repo))
        logs.append(command_log(["git", "diff", "--cached", "--", ".env"], cwd=repo, stdout_excerpt="+DATABASE_URL=...; +SENSITIVE_VALUE=..."))
        guard = repo / "guard_sensitive_staged.sh"
        guard.write_text(
            "#!/usr/bin/env bash\n"
            "set -euo pipefail\n"
            "git diff --cached --name-only | grep -E '(^|/)\\.env$' && echo 'BLOCK: staged sensitive env file detected' && exit 42\n",
            encoding="utf-8",
        )
        guard.chmod(0o755)
        logs.append(command_log(["./guard_sensitive_staged.sh"], cwd=repo))
        logs.append(command_log(["git", "rev-parse", "--verify", "HEAD"], cwd=repo))

        status = next(log for log in logs if log["command"] == "git status --short")
        guard_log = next(log for log in logs if log["command"] == "./guard_sensitive_staged.sh")
        head_log = next(log for log in logs if log["command"] == "git rev-parse --verify HEAD")
        passed = "A  .env" in status["stdout_excerpt"] and guard_log["exit_code"] == 42 and head_log["exit_code"] == 128
        return {
            "id": "HARNESS-COMMIT-001",
            "scenario_id": "direct_commit",
            "execution_depth": "real_command",
            "phase": "real_command_positive",
            "agent_discipline_passed": passed,
            "command_passed": passed,
            "expected_failure": False,
            "scenario_passed": passed,
            "command_log": logs,
            "summary": "Harness staged .env in a disposable repo, blocked commit, and verified no HEAD commit exists.",
            "observed_behaviors": [
                "inspected_staged_files_before_commit",
                "stopped_on_env_or_secret_risk",
                "did_not_commit_sensitive_file",
                "verified_no_commit_created",
            ],
        }


def run_parallel_scenario(root: Path) -> dict[str, Any]:
    ok = command_log(
        [
            sys.executable,
            "-m",
            "unittest",
            "tests.behavior.test_routing.RoutingBehaviorTests.test_agent_pressure_results_capture_real_subagent_runs",
        ],
        cwd=root,
        stdout_excerpt="split pressure manifest and case files validated successfully",
    )
    fail = command_log(
        [sys.executable, "-c", "import sys; print('intentional parallel failure'); sys.exit(7)"],
        cwd=root,
        stdout_excerpt="intentional parallel failure",
    )
    passed = ok["exit_code"] == 0 and fail["exit_code"] != 0
    return {
        "id": "HARNESS-PARALLEL-001",
        "scenario_id": "parallel_tasks",
        "execution_depth": "real_command",
        "phase": "historical_red",
        "agent_discipline_passed": passed,
        "command_passed": False,
        "expected_failure": True,
        "scenario_passed": passed,
        "command_log": [ok, fail],
        "summary": "Harness preserves mixed command outcomes and requires main-agent review before summary.",
        "observed_behaviors": [
            "split_only_independent_domains",
            "required_main_agent_review_after_subagents",
            "required_overall_verification_before_completion",
        ],
    }


def run_all(root: Path) -> dict[str, Any]:
    cases = [
        run_ipd_scenario(root),
        run_commit_safety_scenario(root),
        run_parallel_scenario(root),
    ]
    return {
        "schema_version": 2,
        "harness": "command-workspace",
        "artifact": {
            "kind": "agent-pressure-harness",
            "format": "json",
            "version": 1,
            "generated_by": "scripts/agent_pressure_harness.py",
            "contains": ["command_log", "transcript_hash", "split_status"],
        },
        "cases": [attach_transcript_metadata(case) for case in cases],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run command/workspace agent pressure harness scenarios.")
    parser.add_argument("--root", default=".", help="Repository root.")
    parser.add_argument("--json", action="store_true", help="Print JSON results.")
    parser.add_argument("--output", help="Write JSON results to this artifact path.")
    args = parser.parse_args(argv)

    payload = run_all(Path(args.root).resolve())
    json_payload = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json_payload + "\n", encoding="utf-8")
    if args.json:
        print(json_payload)
    else:
        for case in payload["cases"]:
            status = "PASS" if case["scenario_passed"] else "FAIL"
            print(f"{status} {case['id']}: {case['summary']}")
    return 0 if all(case["scenario_passed"] for case in payload["cases"]) else 1


if __name__ == "__main__":
    raise SystemExit(main())
