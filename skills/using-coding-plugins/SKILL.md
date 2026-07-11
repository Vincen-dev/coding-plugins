---
name: using-coding-plugins
description: Use at the start of any task to choose the smallest safe Coding Plugins workflow and its next skill.
---

<SUBAGENT-STOP>
If a parent task already fixes the workflow and scope, follow that contract without rerouting it.
</SUBAGENT-STOP>

# Using Coding Plugins

## Purpose

Coding Plugins is a workflow-only skill set. Select one risk profile, state the current boundary and next skill, then continue without requiring a separate executable or project state service.

The user defines what to do. Skills define how to do it safely. Explicit user instructions control scope unless they conflict with safety or a previously approved boundary.

## Universal Invariants

Every active workflow obeys these rules before profile-specific guidance:

1. **Test First:** establish the test before production changes. Behavior changes must observe a focused failing test or reproducible failing check; refactors must run a sufficient characterization baseline before editing.
2. **Verifiable Contract:** state `Outcome`, `Boundary`, and `Verification` before implementation. Quick work may state it in the conversation; durable work records numbered `VC-*` items in `change.md`.
3. **Systematic Execution:** proceed through contract -> failing evidence -> implementation -> fresh verification. Stop and investigate instead of guessing when any link is missing.
4. **Simplicity:** choose the lowest honest risk profile, create only its artifact budget, and keep one whole-change state source.
5. **Evidence Before Claims:** run and read fresh verification before saying work is fixed, complete, clean, passing, or ready.

These are invariants, not optional recommendations. If a change cannot establish a test or reproducible check first, improve its testability or stop before production implementation.

## Pre-Implementation Hard Gates

Apply these gates after selecting the risk profile and before the first production change:

1. **Shared checkout:** a shared checkout permits one active write task. Inspect the current Git state before editing. If unrelated or overlapping changes belong to another task, use a separate worktree or stop until the checkout has a single writer. Do not rely on partial staging or later commit repair as the concurrency strategy.
2. **Required workflow capability:** if a required Skill, artifact, or approval is unavailable, stop before implementation. You must not downgrade Governed or Critical work to a Quick Change, an ephemeral conversation contract, or a smaller artifact set merely to keep moving.
3. **Resolved material decisions:** convert each conditional assumption that can change scope, behavior, schema, migration, compatibility, rollback, or verification into an explicit Assumption or Decision Point. If it affects schema, migration, or compatibility, an unresolved material Decision Point blocks implementation.

These gates do not reintroduce a workflow runtime. They use visible Git state, the selected Skills, user instructions, and `change.md` as the only durable decision record.

## Risk Profiles

| Profile | Fit | Required artifacts | Approval model | Next skill |
| --- | --- | --- | --- | --- |
| Inspect | Read, explain, analyze, review, or report status | no artifact | 0 approvals | answer directly or use the matching review skill |
| Quick Change | Clear one-step fix or small refactor with a stated Verifiable Contract | no artifact | 0 approvals; the implementation request is authorization | `test-driven-development` |
| Standard Change | Multi-turn or multi-file work with bounded risk | `change.md` | scope expansion only | `change-capsule`, then `test-driven-development` or `executing-plans` |
| Governed Change | Public contract, migration, release, security, compatibility, or material architectural work | `change.md`, `plan.md`, `evidence.md` | 2 approvals: Scope/Plan and Execution | `change-capsule`, then `executing-plans` |
| Critical Change | Payment, identity, destructive data migration, compliance, secrets, or irreversible external effects | Governed artifacts plus optional `design.md` and `tests.md` | 3 approvals: Scope, Technical, and Execution | `change-capsule`, then isolated execution |

## Selection Rules

Choose the lowest profile that honestly covers the risk.

- Inspect never creates implementation artifacts.
- Quick Change requires a clear Verifiable Contract and test-first evidence.
- Standard Change is the default when useful state must survive multiple turns.
- Governed Change is required for public behavior, schema, compatibility, release, security, or broad maintenance changes.
- Critical Change is required for irreversible or regulated effects.
- When scope or risk is uncertain, choose the higher-risk profile and narrow it later with evidence.

Do not upgrade merely because a task uses several tools. Upgrade when the product, compatibility, recovery, review, or coordination risk increases.

## Direct Skill Routing

- Product direction or option comparison: `brainstorming`.
- Standard, Governed, or Critical artifact work: `change-capsule`.
- Clear implementation or refactor: `test-driven-development`.
- Bug, failing test, build failure, or unclear root cause: `systematic-debugging`, then `test-driven-development`.
- Existing approved plan: `using-git-worktrees` when isolation is needed, then `executing-plans`.
- Shared checkout with another write task or unrelated overlapping changes: `using-git-worktrees` before implementation.
- Explicitly authorized independent tasks: `dispatching-parallel-agents` or `subagent-driven-development`.
- Code review: `requesting-code-review`; review feedback: `receiving-code-review`.
- Completion claim: `verification-before-completion`.
- Commit: `using-git-commit`; branch integration or cleanup: `finishing-a-development-branch`.
- Skill creation or maintenance: `writing-skills`.

## Workflow Handoffs

### Inspect

Read the real source, answer directly, and do not create a Change Capsule unless the user moves from analysis to implementation.

### Quick Change

State Outcome, Boundary, and Verification, then use `test-driven-development`. If the task becomes multi-turn, broader, or higher risk, upgrade to Standard or Governed before continuing.

A Quick Change completion report must include:

- **可验证契约：** 实现前使用的结果、边界和验证方式。
- **测试先行证据：** 实际观察到的 RED，或重构前运行的特征测试基线。
- **最终验证：** 最新命令或可复现检查及其实际结果。
- **剩余风险：** 未验证、延后或运行风险；只有验证范围确实支持时才能写“未发现”。

### Standard Change

Use `change-capsule` to create one `change.md`. It is the sole source for intent, scope, numbered Verifiable Contract items, current task, decisions, evidence summary, and completion.

### Governed Change

Use `change-capsule` to create `change.md`, `plan.md`, and `evidence.md`. Obtain Scope/Plan approval before execution and Execution approval immediately before implementation.

All three artifacts, both approvals, and every blocking Decision Point must be present and resolved before implementation. A missing required capability is a blocker, not permission to use a lower profile.

### Critical Change

Start with the Governed artifacts. Add `design.md`, `tests.md`, or external compliance references only when the risk requires them. Obtain Scope, Technical, and Execution approvals separately.

## Resume and Scope Drift

To resume, inspect incomplete `docs/coding-plugins/changes/*/change.md` files or the repository's documented external artifact location. If more than one change matches, list the candidates and ask which one to continue.

Reconfirm the relevant approval when:

- scope expands beyond the approved intent;
- risk rises to a higher profile;
- Verifiable Contract behavior changes;
- an approved plan changes materially;
- a material Assumption proves false or a Decision Point changes the approved behavior;
- rollback or verification becomes weaker.

Do not maintain a second active-change cache or duplicate phase and approval state in attachment files.

## Completion Boundary

Before claiming completion:

1. Confirm the implementation matches every current Verifiable Contract item.
2. Run fresh relevant verification and read the result.
3. Update Capsule evidence when a Capsule exists.
4. Report unverified or residual risks explicitly.
5. Use the commit and finishing skills only when the user requests those actions.

## Output Principles

Use the user's language for collaboration while preserving stable technical names. Lead with the current profile, material blocker, or outcome. Keep the next step singular and concrete.
