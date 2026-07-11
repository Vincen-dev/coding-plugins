---
name: test-driven-development
description: Use before implementing any feature, bugfix, refactor, or behavior change; requires writing and observing a failing test before production changes.
---

# Test Driven Development

## Overview

Start from a Verifiable Contract or bug reproduction. Establish the test first, watch the behavior change fail for the right reason, then write the smallest code that makes it pass.

Core rule:

```text
No test-first evidence, no production implementation.
```

If production code was written first, remove it and restart from the test.

## When to Use

Use this skill for:

- Features.
- Bug fixes.
- Refactors.
- Behavior changes.
- Config, architecture, or source-scan contracts that can be tested.

For a behavior change, write and observe a failing test or reproducible failing check before any production change. For a refactor, run the relevant characterization tests before editing; if the baseline is insufficient, write characterization tests first. Work that cannot establish test-first evidence stops until its testability is improved.

## RED / GREEN / REFACTOR

### RED

Write a minimal test from a numbered Verifiable Contract item or bug reproduction. The test name or body should trace to IDs such as `VC-001`.

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

Choose the test layer from the Verifiable Contract:

| Contract signal | Preferred Test |
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

For Governed or Critical work, record evidence in:

```text
docs/coding-plugins/changes/<change-id>/evidence.md
```

For Standard work, keep the concise evidence summary in `change.md`. Quick work may report evidence in the final response when no durable artifact is needed.

## TDD Evidence Block

Each behavior-changing task needs an evidence block:

```markdown
## 任务 N：<标题>

### 测试驱动证据

- **契约/缺陷：** VC-001 或 bug reproduction
- **测试类型：** `behavior`、`contract`、`architecture`、`source-scan` 或 `config`
- **RED 测试：** `tests/path/example.test.ts`
- **RED 命令：** `node --test tests/path/example.test.ts`
- **RED 失败：** 能够证明缺失行为的具体失败信号
- **GREEN 变更：** 最小行为变更
- **GREEN 命令：** focused passing command
- **REFACTOR 命令：** 清理后重新运行的命令
- **最终验证：** 最终相关命令和实际结果
```

`RED 失败` must be specific. `GREEN 变更` must explain behavior, not just list files. `最终验证` must name commands actually run.

## Common Mistakes

- Writing tests after implementation.
- Keeping production code written before RED.
- Testing mocks instead of behavior.
- Combining many behaviors into one test.
- Weakening assertions to pass.
- Starting production work when no reproducible test or check exists.
