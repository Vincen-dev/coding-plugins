---
name: receiving-code-review
description: Use after receiving code review feedback and before implementing suggestions, especially when feedback is unclear or technically questionable.
---

# Receiving Code Review

## Overview

Treat review feedback as a hypothesis to validate, not an order to apply blindly. Understand the claim, reproduce or inspect it, decide whether it is valid, then implement or respond.

## Process

1. Read the review comment and the referenced code.
2. Classify the feedback as bug, regression risk, missing test, style, architecture, product question, or unclear.
3. Verify the claim with code reading, tests, or a minimal reproduction.
4. If valid, plan the smallest fix and use TDD for behavior changes.
5. If invalid or out of scope, prepare a concise technical response with evidence.
6. Run relevant verification before reporting.

## When to Push Back

Push back when:

- The feedback contradicts the existing contract or approved spec.
- The proposed fix widens scope or introduces a worse tradeoff.
- The comment is based on a misunderstanding of the code.
- The issue is real but belongs in a separate task.

When pushing back, be factual: cite files, behavior, tests, or specs. Avoid defensive language.

## Output

Report:

- Which comments were addressed.
- Which comments were not changed and why.
- Files changed.
- Verification commands and results.
- Any remaining risk or follow-up needed.
