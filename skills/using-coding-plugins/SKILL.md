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
${CP_CLI} task status --root . --intent "<user intent>" --json
```

If unavailable, use the repository entrypoint:

```bash
node ./bin/coding-plugins.js task status --root . --intent "<user intent>" --json
```

If commands are unavailable, first use the SessionStart `${CP_CLI} <command> ...` fallback. Do not assume the CLI is missing just because `coding-plugins` is not on `PATH`. Do not hard-code stale cache versions.

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
- Approved PRD: `writing-technicals`.
- Approved PRD and TSD: `writing-test-cases`.
- Approved PRD, TSD, and TVD: `writing-plans`.
- Approved TED to execute: `using-git-worktrees`, then `subagent-driven-development` if authorized or `executing-plans`.
- Small implementation: `test-driven-development`.
- Bug or failing test: `systematic-debugging`, then `test-driven-development`.
- Code review requested: `requesting-code-review`.
- Review feedback received: `receiving-code-review`.
- Completion claim: `verification-before-completion`.
- Commit requested: `git-commit`.
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

Use the CLI as the authoritative DP catalog and approval record. Skills may name the next required DP, but the DP list and current approval state come from `decision-points`, `dp status`, `dp approve`, and `dp audit`.

Use:

```bash
${CP_CLI} dp status --feature <feature> --doc-id <doc-id> --id DP-4 --json
${CP_CLI} dp approve --feature <feature> --doc-id <doc-id> --id DP-4 --reason "<summary>" --json
${CP_CLI} dp audit --feature <feature> --doc-id <doc-id> --target execute --json
```

Do not cross a decision point without user confirmation.

## Output Principles

Prefer Chinese replies when the user is working in Chinese, while preserving English technical names and API terms. Keep conclusions concrete, evidence-backed, and actionable.
