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

1. **Test First:** establish the right pre-change evidence before production changes. Behavior changes must observe a focused failing test or reproducible failing check; refactors use a sufficient characterization baseline; static contracts use a failing contract check; external-only behavior records an explicit verification gate.
2. **Verifiable Contract:** state `Outcome`, `Boundary`, and `Verification` before implementation. Quick work may state it in the conversation; durable work records numbered `VC-*` items in `change.md`.
3. **Systematic Execution:** proceed through contract -> failing evidence -> implementation -> fresh verification. Stop and investigate instead of guessing when any link is missing.
4. **Simplicity:** choose the lowest honest risk profile, create only its artifact budget, and keep one whole-change state source.
5. **Evidence Before Claims:** run and read fresh verification before saying work is fixed, complete, clean, passing, or ready.

These are invariants, not optional recommendations. If a behavior change cannot establish a failing test or reproducible check first, improve its testability or stop before production implementation. Do not manufacture a string-only RED and present it as runtime evidence.

## Pre-Implementation Hard Gates

Apply these gates after selecting the risk profile and before the first production change:

1. **Shared checkout:** a shared checkout permits one active write task. Inspect ownership, overlap, and shared mutable resources before editing. Classify it as `clean`, `known-unrelated`, `overlapping-or-unknown`, or `active-writer`:
   - `clean`: continue in the current checkout.
   - `known-unrelated`: inactive, user-owned changes with disjoint files and resources may remain in the current checkout when the requested workspace and exact scope are clear; preserve them and use precise staging.
   - `overlapping-or-unknown`: stop before editing until ownership is resolved or the user approves isolation.
   - `active-writer`: stop; concurrent writes require a user-approved worktree or waiting for a single writer.
   File ownership alone is insufficient: codegen, localization generation, dependency resolution, native build directories, the Git index, devices, and other shared resources may conflict. The current checkout remains the default; do not invoke `using-git-worktrees` or create or switch to a linked worktree without explicit user approval. Partial staging is safe delivery hygiene for `known-unrelated` changes, but it is not a substitute for isolating overlap or an active writer.
2. **Required workflow capability:** if a required Skill, artifact, or approval is unavailable, stop before implementation. You must not downgrade Governed or Critical work to a Quick Change, an ephemeral conversation contract, or a smaller artifact set merely to keep moving.
3. **Resolved material decisions:** convert each conditional assumption that can change scope, behavior, schema, migration, compatibility, rollback, or verification into an explicit Assumption or Decision Point. If it affects schema, migration, or compatibility, an unresolved material Decision Point blocks implementation.

These gates do not reintroduce a workflow runtime. They use visible Git state, the selected Skills, user instructions, and `change.md` as the only durable decision record.

## Risk Profiles

| Profile | Fit | Required artifacts | Approval model | Next skill |
| --- | --- | --- | --- | --- |
| Inspect | Read, explain, analyze, review, or report status | no artifact | 0 approvals | answer directly or use the matching review skill |
| Quick Change | Clear one-step fix or small refactor with a stated Verifiable Contract | no artifact | 0 approvals; the implementation request is authorization | `test-driven-development` |
| Standard Change | Multi-turn or multi-file work with bounded risk | `change.md` | scope expansion only | `change-capsule`, then `test-driven-development` or `executing-plans` |
| Governed Change | External public API or compatibility, migration, release, security, schema, or material architectural work | `change.md`, `plan.md`, `evidence.md` | 2 approvals: Scope/Plan and Execution | `change-capsule`, then `executing-plans` |
| Critical Change | Payment, credentials or session authorization, destructive data migration, compliance, secrets, or irreversible external effects | Governed artifacts plus optional `design.md` and `tests.md` | 3 approvals: Scope, Technical, and Execution | `change-capsule`, then isolated execution |

## Selection Rules

Choose the lowest profile that honestly covers the risk.

- Inspect never creates implementation artifacts.
- Quick Change requires a clear Verifiable Contract and test-first evidence.
- Standard Change is the default when useful state must survive multiple turns.
- Governed Change is required for external public API or compatibility, schema, migration, release, security, or broad maintenance changes. Ordinary user-visible behavior does not by itself require Governed Change.
- Critical Change is required for irreversible or regulated effects.
- Identity-adjacent UI or routing does not by itself require Critical Change; credentials, authorization state, destructive identity data, or equivalent consequences do.
- When scope or risk is uncertain, start with Inspect to gather facts and evidence. Escalate only when unresolved uncertainty carries material, hard-to-recover consequences.
- Worktree isolation is opt-in regardless of profile. A plan, risk classification, dirty checkout, or isolation recommendation is not user approval.

Do not upgrade merely because a task uses several tools. Upgrade when the product, compatibility, recovery, review, or coordination risk increases.

## Documentation Impact Check

Before implementing any change, classify its durable module-documentation impact:

- `none`: no maintained module documentation needs to change.
- `update-existing`: update an existing product, feature, module, or architecture document because its current contract would become stale.
- `create-module-doc`: create a maintained module document for a new module or when the change materially changes a module boundary, lifecycle, data ownership, public contract, or external integration that is not documented elsewhere.
- `external-doc`: update an approved external system of record such as a team Wiki or product documentation space; record its target or reference without creating a competing local copy.

Inspect does not create or update module documentation; a request whose deliverable is documentation is a change, not Inspect. Quick Change updates module documentation only when it changes an existing documented contract or a material module boundary; otherwise classify it as `none`. Standard, Governed, and Critical work record the classification, target, reason, and verification in `change.md`.

Module documentation is a conditional delivery item, not a reason by itself to upgrade the risk Profile and not an addition to the fixed Change Capsule artifact budget.

## Direct Skill Routing

- Product direction or option comparison: `brainstorming`.
- Standard, Governed, or Critical artifact work: `change-capsule`.
- Clear implementation or refactor: `test-driven-development`.
- Bug, failing test, build failure, or unclear root cause with an authorized fix: `systematic-debugging`, then `test-driven-development`.
- Diagnosis-only requests: use `systematic-debugging`, report the root cause and evidence, and do not start a fix or implementation until the user authorizes it.
- Existing approved plan: continue in the current checkout by default, then use `executing-plans`; if isolation is needed, obtain explicit user approval before `using-git-worktrees`.
- Shared checkout with another write task or unrelated overlapping changes: stop and ask whether the user approves `using-git-worktrees` or wants to wait for a single-writer checkout.
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

A Quick Change completion report must include the following evidence, but may express it compactly for a genuinely small change:

- **可验证契约：** 实现前使用的结果、边界和验证方式。
- **测试先行证据：** 实际观察到的行为 RED、重构特征基线、静态契约检查或仍需完成的外部验证门禁。
- **最终验证：** 最新命令或可复现检查及其实际结果。
- **剩余风险：** 未验证、延后或运行风险；只有验证范围确实支持时才能写“未发现”。
- **文档影响：** 仅在非 `none` 时说明已更新或仍待更新的模块文档目标。

### Standard Change

Use `change-capsule` to create one `change.md`. It is the sole source for intent, scope, numbered Verifiable Contract items, current task, decisions, evidence summary, and completion.

### Governed Change

Use `change-capsule` to create `change.md`, `plan.md`, and `evidence.md`. Obtain Scope/Plan approval before execution and Execution approval immediately before implementation.

One unambiguous post-plan instruction that accepts the presented plan and directs immediate implementation may satisfy both the Scope/Plan and Execution records. Record the actual instruction and do not manufacture two approvals from a vague acknowledgement, an earlier implementation request, or document status alone.

All three artifacts, both approvals, and every blocking Decision Point must be present and resolved before implementation. A missing required capability is a blocker, not permission to use a lower profile.

### Critical Change

Start with the Governed artifacts. Add `design.md`, `tests.md`, or external compliance references only when the risk requires them. Critical Change keeps separate Scope, Technical, and Execution approvals because the consequences justify distinct decisions.

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
