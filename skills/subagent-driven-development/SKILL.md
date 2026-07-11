---
name: subagent-driven-development
description: Use when an approved Change Capsule plan contains independent tasks suitable for implementation and review agents.
---

# Subagent Driven Development

## Overview

Execute Capsule plan tasks through focused implementation and review agents when the user and current platform authorize subagent work.

Do not spawn subagents unless the user explicitly asked for subagents, delegation, or parallel agent work. If not authorized, use `executing-plans` in the current session.

## Preconditions

- The active Capsule plan is approved for execution.
- `change.md` identifies one current task and the relevant artifact references.
- Work happens in a safe branch or isolated workspace.
- Each delegated task has a disjoint write set.

## Dispatch Flow

1. Assemble an implementer prompt from the current Capsule task. Include the task text, scope fence, `VC-*` items, required tests, and evidence expectations.
2. Assign file ownership and state that other agents or the main thread may be editing other files.
3. Require TDD for behavior, contract, config, architecture, or source-scan changes.
4. Require a final report with files changed, commands, results, and concerns.
5. Review returned changes in the main thread.
6. Run contract review and code quality review when appropriate.
7. Integrate only after verification.

## Review Flow

Use two review angles:

- Contract reviewer: confirms required `VC-*` items and plan task instructions are satisfied.
- Code quality reviewer: finds bugs, regression risks, weak tests, and maintainability issues.

Do not trust review or implementation reports without reading the diff and running verification locally.

## Stop Conditions

Stop or route back to planning when:

- The approved Capsule scope or plan changed materially.
- The task scope overlaps another active task.
- The agent needs a major architecture decision not present in the Capsule plan.
- Verification cannot be run.
- Review finds blocking issues.
