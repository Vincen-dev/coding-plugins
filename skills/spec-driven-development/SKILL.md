---
name: spec-driven-development
description: Use when a new requirement, behavior change, interface contract, schema, state machine, or acceptance standard is unclear and should enter the formal Coding Plugins PRD -> TSD -> TVD -> TED -> VED chain.
---

# Spec Driven Development

## Overview

Spec Driven Development routes unclear or significant work into a formal document chain before implementation.

Chain:

```text
PRD -> TSD -> TVD -> TED -> VED
```

Core principle: requirements are approved before design, design before test cases, test cases before execution tasks, and execution before evidence closure.

## When to Use

Use this skill when:

- A new feature or behavior change is not fully specified.
- API, schema, state-machine, or acceptance contracts need to be written.
- Maintenance work affects compatibility, validation, release flow, or user-visible behavior.
- The user has moved from brainstorming to formal landing.

Do not use it when:

- The user only asks for analysis or options and has not approved formal landing.
- The change is small, clear, and testable in at most a couple of files; use `test-driven-development`.
- A formal chain already exists at a downstream approved stage; use the next writing or execution skill.

## Entry Flow

1. Run the Coding Plugins CLI task entrypoint before selecting a downstream skill.
2. Identify feature and doc id.
3. Use `document-metadata` to read any existing README and chain frontmatter.
4. Decide whether this is a new chain, an update to an existing chain, or a maintenance chain.
5. Create or update the PRD with `writing-requirements`.
6. Stop at DP-1 for user approval.

## Decision Points

- DP-0: User confirms formal SDD entry.
- DP-1: PRD approval before TSD.
- DP-2: TSD approval before TVD.
- DP-3: TVD approval before TED.
- DP-4: TED approval before execution.
- DP-5: TDD exception or debug escalation.
- DP-6: Completion verification approval.
- DP-7: Commit and branch finishing approval.

Do not cross a decision point without user confirmation.

## Artifact Responsibilities

- PRD defines problem, goals, non-goals, requirements, acceptance, compatibility, and risks.
- TSD defines the implementation design and tradeoffs for approved requirements.
- TVD defines test cases, test types, data, assertions, and evidence targets.
- TED defines executable tasks, scope fence, source hash, required tests, and VED requirements.
- VED records RED/GREEN/REFACTOR evidence, exceptions, and final verification.

## Guard Rules

- Run `workflow-state` and `workflow-guard` before execution.
- Do not execute a draft, stale, or unlocked TED.
- Do not treat chat-only conclusions as formal approval.
- Use repository-relative paths in metadata.
- Update `docs/coding-plugins/INDEX.md` after artifact changes.
- Run validators for the artifact type before claiming readiness.

## Handoff

After PRD is approved, hand off to `writing-technicals`.
After TSD is approved, hand off to `writing-test-cases`.
After TVD is approved, hand off to `writing-plans`.
After TED is approved and guard passes, hand off to `using-git-worktrees` and execution.
