---
name: test-driven-development
description: Use before implementing a feature, bugfix, refactor, or testable contract change; select the correct pre-change evidence and require a real RED for behavior changes.
---

# Test Driven Development

## Overview

Start from a Verifiable Contract or bug reproduction. Select the evidence mode that matches the change, establish it before production work, then make the smallest change that satisfies the contract.

Core rule:

```text
No appropriate pre-change evidence, no production implementation.
```

If the agent wrote production code before required evidence and the diff is isolated and agent-owned, restore only that agent-owned diff and restart from the evidence. Never remove, delete, or revert user-owned or unknown-origin code to manufacture a RED. Freeze the current state, establish characterization or regression coverage where possible, and disclose when a pure pre-change RED is unavailable.

## When to Use

Use this skill for:

- Features.
- Bug fixes.
- Refactors.
- Behavior changes.
- Config, architecture, or source-scan contracts that can be tested.

For a behavior change, write and observe a failing test or reproducible failing check before any production change. For a refactor, run the relevant characterization tests before editing; if the baseline is insufficient, write characterization tests first. Static instructions, manifests, and configuration use a failing static contract check. Hardware, signing, backend, and other externally observable behavior require local proxy coverage where possible plus an explicit external verification gate. Work that cannot establish the evidence required for its claim stops or narrows the claim until testability or external access improves.

## Evidence Modes

| Mode | Use | Required pre-change evidence |
| --- | --- | --- |
| Behavior RED | Feature, bugfix, state transition, or user-visible behavior | A focused failing test or reproducible failure that proves the missing behavior |
| Characterization baseline | Refactor with no intended behavior change | Existing or newly added characterization tests run before editing |
| Static contract check | Manifest, prompt, Skill, config, generated contract, or other static surface | A focused failing source/config/contract check; do not claim runtime behavior from it |
| External verification gate | Device, signing, backend, performance, or environment-owned outcome | Local proxy or integration coverage plus the named external check that remains required |

These modes are evidence categories, not exemptions from test discipline. A production behavior change still requires Behavior RED even when it also needs an external gate.

## RED / GREEN / REFACTOR

### RED or Baseline

Write or identify the minimal evidence from a numbered Verifiable Contract item or bug reproduction. The test name or body should trace to IDs such as `VC-001`.

Run the focused test and confirm:

- Behavior and static contract changes fail for the intended missing behavior or contract.
- Refactor characterization passes and records the pre-change behavior.
- External work names the remaining environment, artifact, or device gate.
- A failure is not an import, spelling, unrelated environment, or test-construction error.

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
| Static surface such as prompts or manifests | Static contract check |
| Device, signing, backend, or performance outcome | Proxy/integration coverage plus external verification gate |

Source-scan tests are acceptable for text surfaces, manifests, and agent-facing instructions, but they prove only the static contract and should not replace behavior tests or forward-testing for user-visible or agent behavior.

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
- **证据模式：** `behavior-red`、`characterization`、`static-contract` 或 `external-gate`
- **变更前证据：** 测试、特征基线、静态契约检查或外部门禁
- **证据命令：** `node --test tests/path/example.test.ts` 或对应检查
- **证据观察：** 能够证明缺失行为、既有特征、缺失静态契约或剩余外部验收的具体信号
- **GREEN 变更：** 最小行为变更
- **GREEN 命令：** focused passing command
- **REFACTOR 命令：** 清理后重新运行的命令
- **最终验证：** 最终相关命令和实际结果
```

`证据观察` must be specific and must not overstate what the selected mode proves. `GREEN 变更` must explain behavior, not just list files. `最终验证` must name commands actually run.

## Common Mistakes

- Writing behavior tests after implementation.
- Keeping agent-owned production behavior written before RED without disclosing or safely restarting.
- Removing user-owned or unknown-origin code to recreate a pre-change state.
- Presenting a static contract RED as runtime, device, backend, or agent-behavior proof.
- Testing mocks instead of behavior.
- Combining many behaviors into one test.
- Weakening assertions to pass.
- Starting production work when no reproducible test or check exists.
