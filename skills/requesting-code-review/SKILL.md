---
name: requesting-code-review
description: Use after completing a task, implementing important behavior, or before merging when the work needs validation against its Verifiable Contract and quality risks.
---

# Requesting Code Review

## Overview

Request focused review after implementation and local verification. A useful review checks behavior against the Verifiable Contract and checks code quality against maintainability risks.

## Review Types

Use two review angles when possible:

- Contract review: verifies that every `VC-*` item is satisfied within its Outcome, Boundary, and Verification method.
- Code quality review: looks for bugs, regressions, maintainability issues, missing tests, and risky abstractions.

Do not ask for broad aesthetic review when the task needs concrete risk discovery.

## Process

1. Summarize the intended behavior and scope.
2. Provide changed files, Verifiable Contract items, tests, and known constraints.
3. Ask for findings ordered by severity.
4. After review, independently inspect findings before applying them.
5. Fix valid issues with TDD when behavior changes.
6. Rerun verification.

## Review Prompt Shape

```text
Review this change for correctness and regression risk.

Scope:
- <feature or bug>
- <files changed>
- <VC IDs and verification methods>

Focus:
- Behavior bugs.
- Missing tests.
- Contract drift.
- Risky implementation choices.

Return findings first, ordered by severity, with file and line references.
```

## Completion

Do not claim the review is resolved until:

- Findings have been inspected.
- Valid findings are fixed or documented as intentionally deferred.
- Relevant tests and validators have been rerun.
