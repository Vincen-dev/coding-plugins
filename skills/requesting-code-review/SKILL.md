---
name: requesting-code-review
description: Use after completing a task, implementing important behavior, or before merging when the work needs validation against its Verifiable Contract and quality risks.
---

# Requesting Code Review

## Overview

Request focused review after implementation and local verification. A useful review checks behavior against the Verifiable Contract and checks code quality against maintainability risks.

## Review Types

Use two review angles:

- Contract review: verifies that every `VC-*` item is satisfied within its Outcome, Boundary, and Verification method.
- Code quality review: looks for bugs, regressions, maintainability issues, missing tests, and risky abstractions.

Calibrate the number of review passes to the selected risk profile:

- Quick Change may use a short combined review when the local evidence is proportionate to the risk.
- Standard uses one combined review covering both contract and quality by default.
- Governed or Critical work may split contract review and quality review into independent passes when independent challenge materially improves confidence. Critical work may also require a domain-specific reviewer or external gate.

Separate passes are a risk-control decision, not a ritual. Do not duplicate the same review prompt merely to increase reviewer count.

Do not ask for broad aesthetic review when the task needs concrete risk discovery.

## Review Target

Select the target that contains the actual work; do not assume it is committed:

- Commit range: review the verified base-to-head range.
- Staged diff: review `git diff --cached` when the intended delivery is staged.
- Unstaged diff: review `git diff` plus relevant untracked files for working-tree work.
- PR diff: review the platform-provided pull-request diff and its current head revision.

Record the target revision or working-tree state so findings are not applied to a stale diff.

## Process

1. Summarize the intended behavior and scope.
2. Provide the review target, changed files, Verifiable Contract items, tests, and known constraints.
3. Ask for findings first, ordered by severity; strengths and summary follow the findings.
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
