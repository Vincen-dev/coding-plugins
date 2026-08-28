---
name: executing-plans
description: Use when an approved Change Capsule plan exists and should be executed in the current session by checkpoint.
---

# Executing Plans

## Overview

Load the written plan, review it critically, execute the tasks, and report only after verification.

Start by saying: "I am using the executing-plans skill to implement this plan."

If subagents are available and the user has explicitly authorized subagent work, prefer `subagent-driven-development`. Otherwise execute in the current session.

## Step 1: Load and Review the Plan

1. Read `change.md` and the listed `plan.md`.
2. Review the Verifiable Contract and plan for missing prerequisites, unclear instructions, unsafe scope, rollback gaps, or impossible verification.
3. Read the Documentation Impact classification. For every non-`none` impact, confirm that the plan has an explicit task to create or update the maintained module documentation and verify its target.
4. If there is a serious issue, stop and tell the user before implementation.
5. If the plan is sound, create a task checklist and continue.

## Step 2: Execute Tasks

For each task:

1. Mark the task as in progress.
2. Follow the task outcome, boundaries, and required verification. Minor implementation details may adapt to verified source facts when they do not change the contract; record the deviation. Material plan changes return to planning and approval.
3. Establish the evidence mode required by each behavior or contract slice before its production change.
4. Run the task's specified verification.
5. When Documentation Impact is non-`none`, create or update module documentation in the approved maintained location; keep Capsule state and command history out of it.
6. Record actual RED/GREEN/REFACTOR and verification evidence in the Capsule.
7. Mark the task complete only after verification supports it.

## Step 3: Complete Execution

After all tasks are complete and verified:

- Update Capsule evidence and report the verified implementation, remaining risk, branch, and worktree status.
- Do not invoke `finishing-a-development-branch` unless the user requests commit, merge, PR, branch integration, or cleanup.
- Implementation approval does not authorize commit, pull, push, merge, PR creation, or branch/worktree cleanup.

## Stop Conditions

Stop and ask for guidance when:

- Dependencies are missing.
- Tests fail for an unclear reason.
- The plan has a critical gap.
- You do not understand an instruction.
- Verification repeatedly fails.

Do not guess through a blocked plan.

## Important Rules

- Review the plan before editing.
- Follow the plan steps; do not silently widen scope.
- Do not skip verification.
- Use required skills named by the plan.
- Do not start implementation directly on `main` or `master` without explicit user approval.
