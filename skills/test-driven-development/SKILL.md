---
name: test-driven-development
description: Use before implementing any feature, bugfix, refactor, or behavior change; requires writing and observing a failing test before production changes.
---

# Test Driven Development

## Overview

Start from a spec, bug reproduction, or explicit acceptance criterion. Write the test first, watch it fail for the right reason, then write the smallest code that makes it pass.

Core rule:

```text
No failing test first, no production implementation.
```

If production code was written first, remove it and restart from the test.

## When to Use

Use this skill for:

- Features.
- Bug fixes.
- Refactors.
- Behavior changes.
- Config, architecture, or source-scan contracts that can be tested.

Exceptions require user approval and a VED exception record.

## RED / GREEN / REFACTOR

### RED

Write a minimal test from a Spec ID, bug reproduction, or acceptance criterion. The test name or body should trace to IDs such as `REQ-001`.

Run the focused test and confirm:

- It fails.
- The failure is due to missing behavior or broken contract.
- It is not an import, spelling, environment, or test-construction error.

### GREEN

Write the smallest implementation that makes the test pass. Do not add future features, broad refactors, speculative abstractions, or unrelated cleanup.

Run the focused test and relevant existing tests. Fix implementation when tests fail; do not weaken the test to fit the implementation.

### REFACTOR

Only refactor after green. Keep behavior unchanged and rerun tests.

## Test Level Selection

Choose the test layer from the requirement:

| Source | Preferred Test |
| --- | --- |
| Business rule or function logic | Unit test |
| API, SDK, schema, or protocol | Contract or integration test |
| State machine or async lifecycle | State transition test |
| UI behavior | Component or interaction test |
| Bug fix | Reproduction test |
| Pure refactor | Existing tests or characterization test |
| Static surface such as prompts or manifests | Source-scan or config test |

Source-scan tests are acceptable for text surfaces, manifests, and agent-facing instructions, but should not replace behavior tests for user-visible behavior.

## Evidence Location

For formal Coding Plugins work, record evidence in:

```text
docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
```

Read or create VED metadata with `document-metadata` before writing evidence.

When validating evidence, prefer the SessionStart CLI fallback if `coding-plugins` is not on `PATH`:

```bash
${CP_CLI} validate-tdd-evidence docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
```

## TDD Evidence Block

Each behavior-changing task needs an evidence block:

```markdown
## Task N: <title>

### TDD Evidence

- **Spec / Defect / Acceptance:** REQ-001 or bug reproduction
- **Test Type:** `behavior`, `contract`, `architecture`, `source-scan`, or `config`
- **RED Test:** `tests/path/example.test.ts`
- **RED Command:** `node --test tests/path/example.test.ts`
- **RED Failure:** specific failure signal proving the missing behavior
- **GREEN Change:** minimal behavior change
- **GREEN Command:** focused passing command
- **REFACTOR Command:** command rerun after cleanup
- **Final Verification:** final relevant command and result
```

`RED Failure` must be specific. `GREEN Change` must explain behavior, not just list files. `Final Verification` must name commands actually run.

## TDD Exception Record

Use only when TDD is truly impossible and the user approved it:

```markdown
## TDD Exception Record

- **Reason:** why failing test first is impossible
- **User Approval:** user approval text or summary
- **Replacement Verification:** commands, logs, screenshots, or manual steps
- **Risk:** remaining risk and follow-up test plan
```

## Common Mistakes

- Writing tests after implementation.
- Keeping production code written before RED.
- Testing mocks instead of behavior.
- Combining many behaviors into one test.
- Weakening assertions to pass.
- Claiming manual testing as a substitute for repeatable verification without an approved exception.
