---
name: requesting-code-review
description: Use after completing a task, implementing important behavior, or before merging when the work needs validation against requirements and quality risks.
---

# Requesting Code Review

## Overview

Request focused review after implementation and local verification. A useful review checks behavior against the spec and checks code quality against maintainability risks.

## Review Types

Use two review angles when possible:

- Spec review: verifies that the implementation satisfies PRD/TSD/TVD/TED requirements and does not miss acceptance criteria.
- Code quality review: looks for bugs, regressions, maintainability issues, missing tests, and risky abstractions.

Do not ask for broad aesthetic review when the task needs concrete risk discovery.

## Process

1. Summarize the intended behavior and scope.
2. Provide changed files, relevant specs, tests, and known constraints.
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
- <spec IDs or acceptance criteria>

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
