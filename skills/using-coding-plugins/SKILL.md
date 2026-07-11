---
name: using-coding-plugins
description: Use at the start of any task to select the correct Coding Plugins workflow, skill, and gate.
---

<SUBAGENT-STOP>
If you are a delegated subagent and the parent task already specifies the working method, you may skip this skill.
</SUBAGENT-STOP>

# Using Coding Plugins

## Core Rule

If the task may match a Coding Plugins skill, read and use that skill first. The skill defines how to work; the user defines what to do. Explicit user instructions override skill defaults unless they would violate safety or required gates.

## CLI First for Formal Chains

Formal PRD/TSD/TVD/TED/VED work must run the Coding Plugins CLI before selecting the next skill or crossing an execution boundary.

`using-coding-plugins` cannot replace `task status`; it only interprets and follows the state returned by the CLI.

Prefer the session-provided fallback:

```bash
${CP_CLI} task status --root . --intent "<user intent>" --contract-version 2 --json
```

If commands are unavailable, first use the SessionStart `${CP_CLI} <command> ...` fallback. Do not construct a business-repository-local `node ./bin/coding-plugins.js` fallback, and do not assume the CLI is missing merely because `coding-plugins` is not on `PATH`.

## Workflow Modes

| Mode | Meaning | Default Handling |
| --- | --- | --- |
| `analysis-only` | Read, explain, review, or query status | No formal docs |
| `docs-only` | Lightweight docs, index, or config edits | Edit and validate docs/config |
| `tdd-only` | Small clear behavior change in limited files | Use `test-driven-development` |
| `full-chain` | New feature or unclear contract | PRD -> TSD -> TVD -> TED -> VED |
| `maintenance-chain` | Migration, upgrade, release, security, performance, or compatibility work | Maintenance PRD then full chain |

When scope expands, run `scope-check` and reroute if required.

## Skill Routing

- Brainstorming or unclear product direction: `brainstorming`.
- Feature document metadata, frontmatter, README/INDEX, or `related_docs` work: `document-metadata`.
- Two or more independent tasks that the user authorized for parallel delegation: `dispatching-parallel-agents`.
- New formal requirement: `spec-driven-development`, then `writing-requirements`.
- Governed-v2 DP-1 approved: write TSD with `writing-technicals`, then TVD with `writing-test-cases`; both remain `review-ready` until the joint DP-2 technical approval.
- Governed-v2 DP-2 approved: create TED with `writing-plans`.
- Governed-v2 DP-3 approved: execute the current TED after guard success.
- Governed-v1 documents without `workflow_schema`: preserve the legacy PRD -> approved TSD -> approved TVD -> TED sequence.
- Approved TED to execute: `using-git-worktrees`, then `subagent-driven-development` if authorized or `executing-plans`.
- Small implementation: `test-driven-development`.
- Bug or failing test: `systematic-debugging`, then `test-driven-development`.
- Code review requested: `requesting-code-review`.
- Review feedback received: `receiving-code-review`.
- Completion claim: `verification-before-completion`.
- Commit requested: `using-git-commit`.
- Creating or editing skills: `writing-skills`.
- Branch finishing: `finishing-a-development-branch`.

## Resume or Continue Rule

When the user says continue, resume, start implementation, or execute TED:

1. Run `task status` with `--feature` and `--doc-id` when known.
2. Report mode, feature, doc id, state, allowed actions, blocked actions, next skill, and decision point.
3. If feature/doc id is unknown, use the index or README frontmatter to locate it.
4. Follow the CLI's `next_skill` and blocked actions.

## Execution Gate

Before executing a TED:

```bash
${CP_CLI} workflow-guard check --feature <feature> --doc-id <doc-id> --target execute --json
```

If it does not pass, do not implement. Route to the returned next skill.

After guard passes, generate a brief:

```bash
${CP_CLI} workflow-brief --feature <feature> --doc-id <doc-id> --target execute --task TASK-001 --json
```

Read only the documents and sections listed by the brief unless a rewind trigger occurs.

## Decision Points

Use the CLI as the authoritative DP catalog and approval record. Read `workflow_schema` before interpreting a DP ID. New governed-v2 chains use the `task` facade; legacy governed-v1 chains may continue to use the fine-grained `dp` commands.

Use:

```bash
${CP_CLI} task approve --feature <feature> --doc-id <doc-id> --id DP-1 --reason "<scope approval>" --contract-version 2 --json
${CP_CLI} task approve --feature <feature> --doc-id <doc-id> --id DP-2 --reason "<technical approval>" --contract-version 2 --json
${CP_CLI} task approve --feature <feature> --doc-id <doc-id> --id DP-3 --reason "<execution approval>" --contract-version 2 --json
${CP_CLI} task complete --feature <feature> --doc-id <doc-id> --contract-version 2 --json
```

For governed-v1 compatibility diagnostics, use `dp status`, `dp approve`, and `dp audit`; never reuse a v1 approval record as a v2 approval.

Do not cross a decision point without user confirmation.

## Output Principles

Prefer Chinese replies when the user is working in Chinese, while preserving English technical names and API terms. Keep conclusions concrete, evidence-backed, and actionable.
