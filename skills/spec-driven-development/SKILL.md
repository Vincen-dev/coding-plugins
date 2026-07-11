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

Core principle: requirements are approved before technical work; technical design and test design are jointly approved before execution planning; execution is approved before implementation and evidence closure.

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

Read `workflow_schema` before interpreting decision IDs.

- Governed-v2: DP-1 approves PRD scope; DP-2 jointly approves review-ready TSD, review-ready TVD, Policies, Skills, waivers, and test coverage; DP-3 approves TED, rollback, verification gates, and commit boundaries.
- Governed-v1 compatibility: keep the existing DP-1 through DP-7 meanings and fine-grained `dp` commands.

Use `task approve` for governed-v2. Use `dp status`, `dp approve`, and `dp audit` only for governed-v1 compatibility or diagnostics.

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

For governed-v2, after DP-1 hand off to `writing-technicals`, then `writing-test-cases`; after joint DP-2 hand off to `writing-plans`; after DP-3 and guard success hand off to `using-git-worktrees` and execution.

For governed-v1, preserve the legacy PRD -> TSD -> TVD -> TED handoff sequence.
