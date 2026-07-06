---
name: subagent-driven-development
description: Use when executing a TED task execution document that contains independent tasks suitable for implementation and review agents.
---

# Subagent Driven Development

## Overview

Execute TED tasks through focused implementation and review agents when the user and current platform authorize subagent work.

Do not spawn subagents unless the user explicitly asked for subagents, delegation, or parallel agent work. If not authorized, use `executing-plans` in the current session.

## Preconditions

- TED is approved.
- `workflow-guard check --target execute` passes.
- `workflow-brief` identifies the task and source hash.
- Work happens in a safe branch or isolated workspace.
- Each delegated task has a disjoint write set.

## Dispatch Flow

1. Generate or assemble an implementer prompt from the TED task. Include the full task text, source hash, scope fence, required tests, and VED requirements.
2. Assign file ownership and state that other agents or the main thread may be editing other files.
3. Require TDD for behavior, contract, config, architecture, or source-scan changes.
4. Require a final report with files changed, commands, results, and concerns.
5. Review returned changes in the main thread.
6. Run spec review and code quality review when appropriate.
7. Integrate only after verification.

## Prompt Builder

Prefer the CLI prompt builder when available:

```bash
coding-plugins subagent-prompt-builder --feature <feature> --doc-id <doc-id> --task TASK-001 --kind implementer --expected-source-hash <sha256>
```

Use repository fallback when `coding-plugins` is not on `PATH`.

## Review Flow

Use two review angles:

- Spec reviewer: confirms required Spec IDs and TED task instructions are satisfied.
- Code quality reviewer: finds bugs, regression risks, weak tests, and maintainability issues.

Do not trust review or implementation reports without reading the diff and running verification locally.

## Stop Conditions

Stop or route back to planning when:

- The TED is stale.
- The task scope overlaps another active task.
- The agent needs a major architecture decision not present in the TED.
- Verification cannot be run.
- Review finds blocking issues.
