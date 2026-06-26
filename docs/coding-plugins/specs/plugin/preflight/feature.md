---
spec_id: plugin-preflight-feature
title: Plugin Preflight Checks
type: feature
status: approved
area: plugin
capability: preflight
created: 2026-06-26
updated: 2026-06-26
tags:
  - ci
  - validation
  - release-gate
related_code:
  - scripts/preflight.py
  - .github/workflows/ci.yml
related_specs: []
---

# Plugin Preflight Checks Specification

## Goal

Provide one command that verifies the plugin repository before push, release, or marketplace packaging.

## Non-goals

| ID | Non-goal |
| --- | --- |
| NON-001 | This command does not publish the plugin or register marketplace metadata. |
| NON-002 | This command does not replace manual review for skill wording, product fit, or user-facing workflow judgment. |

## Context

- Current behavior: SDD and TDD validators exist, but maintainers must remember the full verification set.
- Target users or callers: plugin maintainers, local Codex sessions, and GitHub Actions.
- Constraints: the command must run with the Python standard library and repository-local files.

## Functional Requirements

| ID | Priority | Requirement | Verification |
| --- | --- | --- | --- |
| REQ-001 | MUST | The preflight command runs repository unit tests for the SDD validator, TDD evidence validator, and preflight logic. | Unit test command in Traceability. |
| REQ-002 | MUST | The preflight command validates all real specification documents under `docs/coding-plugins/specs`, excluding `INDEX.md`. | Strict spec validator command in Traceability. |
| REQ-003 | MUST | The preflight command rejects mismatched Codex and Claude plugin manifest versions. | Unit test `test_manifest_version_check_rejects_mismatched_versions`. |
| REQ-004 | MUST | The preflight command rejects active references to the removed legacy entry outside Git internals. | Unit test `test_removed_entry_scan_ignores_git_and_detects_active_references`. |
| REQ-005 | MUST | GitHub Actions runs the same preflight command on pushes and pull requests targeting `main`. | Workflow file review plus command execution in Traceability. |

## Error and Edge Cases

| ID | Condition | Expected behavior | Verification |
| --- | --- | --- | --- |
| ERR-001 | No real spec files exist under `docs/coding-plugins/specs`. | Preflight skips spec file validation and still runs unit tests and static checks. | Unit test `test_build_commands_include_core_validation_steps`. |
| ERR-002 | A removed entry reference appears only inside `.git`. | Preflight ignores the `.git` directory. | Unit test `test_removed_entry_scan_ignores_git_and_detects_active_references`. |
| ERR-003 | A required manifest file is missing. | Preflight exits non-zero with a missing file message. | Unit test coverage for `check_required_plugin_files` or manual command failure evidence. |

## Acceptance Criteria

| ID | Scenario | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC-001 | Local preflight succeeds | A clean checkout with matching manifests and valid specs | Maintainer runs `python3 scripts/preflight.py` | The command exits 0 and prints `Preflight passed.` |
| AC-002 | CI preflight runs | A push or pull request targets `main` | GitHub Actions starts the `ci` workflow | The workflow runs `python3 scripts/preflight.py`. |

## Traceability

| Spec ID | Verification type | Test file / command | Plan task | Status |
| --- | --- | --- | --- | --- |
| REQ-001 | unit test | `python3 -m unittest scripts/test_preflight.py skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | Task 1 | covered |
| REQ-002 | spec validation | `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/specs/plugin/preflight/feature.md` | Task 1 | covered |
| REQ-003 | unit test | `python3 -m unittest scripts/test_preflight.py` | Task 1 | covered |
| REQ-004 | unit test | `python3 -m unittest scripts/test_preflight.py` | Task 1 | covered |
| REQ-005 | workflow check | `.github/workflows/ci.yml` contains `python3 scripts/preflight.py` | Task 2 | covered |
| ERR-001 | unit test | `python3 -m unittest scripts/test_preflight.py` | Task 1 | covered |
| ERR-002 | unit test | `python3 -m unittest scripts/test_preflight.py` | Task 1 | covered |
| ERR-003 | manual validation | Delete a manifest in a temporary checkout and run `python3 scripts/preflight.py` | Task 1 | planned |
| AC-001 | command validation | `python3 scripts/preflight.py` | Task 3 | covered |
| AC-002 | workflow review | `.github/workflows/ci.yml` | Task 2 | covered |
