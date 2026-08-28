---
name: systematic-debugging
description: Use for bugs, failing tests, build failures, unexpected behavior, or unclear root causes before proposing a fix.
---

# Systematic Debugging

## Overview

Debug by reproducing the symptom, isolating the root cause, and then applying the smallest verified fix. Do not patch symptoms first.

Core principle: evidence before theory, root cause before fix.

## When to Use

Use this skill for:

- Test failures.
- Build or CI failures.
- Runtime errors.
- Unexpected behavior.
- Flaky behavior.
- Regressions with unclear cause.

## Process

1. Capture the exact symptom, command, input, output, and environment.
2. Reproduce the issue with the smallest reliable command.
3. Confirm whether the failure is deterministic or flaky.
4. Trace from symptom to cause using logs, assertions, code reading, and focused probes.
5. Form a concrete root-cause hypothesis.
6. Validate the hypothesis with a minimal experiment.
7. Write or identify the failing test that captures the behavior.
8. If the user authorized a fix, move to `test-driven-development`. For diagnosis-only work, stop after reporting the root cause, evidence, confidence, and missing runtime validation.

## Root Cause Standard

A root cause is not:

- "Race condition" without the racing events.
- "Bad state" without the state transition.
- "Environment issue" without the missing or wrong environment fact.
- "Mock issue" without explaining what behavior the mock hides.

A root cause should state:

- What failed.
- Where it failed.
- Why it failed.
- Why the failure was not caught earlier.
- What evidence proves it.

## Debugging Discipline

- Change one variable at a time.
- Prefer deterministic waits over sleeps.
- Avoid broad refactors while investigating.
- Do not delete tests to make the suite pass.
- Do not weaken assertions without proving the expected behavior changed.
- Keep notes of commands and observations when the investigation is long.

## Escalation

Escalate when:

- You cannot reproduce the issue.
- Multiple plausible root causes remain after focused experiments.
- The fix would require changing the approved Verifiable Contract.
- The investigation reveals a larger architecture problem.

Report what was tried, what was observed, and what information is still missing.

## Authorization Boundary

A request to diagnose, analyze, or explain a failure does not authorize production changes. Do not start a fix until the user authorizes implementation. Environment permissions, the actual checkout, entrypoint, generated state, build artifact, device, and backend are possible root-cause dimensions rather than generic reasons to blame the environment.
