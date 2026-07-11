# Coding Plugins 2.0.0 Migration Guide

## Breaking boundary

CLI removed in 2.0.0. The plugin is now a workflow-only Skills package. State files are no longer read or written. Retired document designs remain available in Git history and this migration record, but they are not active repository contracts.

There is no compatibility shim. Automation that invoked the old executable must move to Agent/Skill invocation.

## Old entry to new workflow

| 1.x behavior | 2.0.0 replacement |
| --- | --- |
| `coding-plugins task start/status` | Invoke `using-coding-plugins`; it selects Inspect, Quick, Standard, Governed, or Critical |
| `coding-plugins task approve` / `dp` | Record the profile-specific user approval in `change.md` through `change-capsule` |
| `workflow-state`, `workflow-guard`, `workflow-brief` | Resume from `change.md`, listed artifacts, current task, scope, and approvals |
| fixed requirement/design/test/plan/evidence chain | Standard uses one file; Governed uses `change.md`, `plan.md`, and `evidence.md` |
| completion audit command | Use `verification-before-completion`, update Capsule evidence, and report residual risks |
| commit guard command | Use `using-git-commit` to inspect diff, sensitive files, author identity, repository rules, and authorization |

## State cleanup

After confirming no team automation depends on them, old projects may remove:

- `.coding-plugins.yaml`
- `.coding-plugins/runtime-state.json`
- `.coding-plugins/session-lock.json`
- `.coding-plugins-decisions.json`

2.0.0 does not read these files.

## Historical artifacts

Retired workflow documents were removed from the active repository surface to prevent search and routing ambiguity. Use Git history only when migration archaeology is required. New work uses Change Capsules under `docs/coding-plugins/changes/<change-id>/` or an explicitly selected external artifact location.

Every new implementation starts from a Verifiable Contract containing Outcome, Boundary, and Verification. Do not translate retired document structures into a second active hierarchy.

## Installation changes

Remove any user shim or shell alias for the old executable. Refresh the Git/marketplace plugin installation so the platform loads the 2.0.0 manifests and Skills.
