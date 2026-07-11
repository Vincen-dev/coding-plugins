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
3. If there is a serious issue, stop and tell the user before implementation.
4. If the plan is sound, create a task checklist and continue.

## Step 2: Execute Tasks

For each task:

1. Mark the task as in progress.
2. Follow the task steps exactly.
3. Establish test-first evidence before every production change.
4. Run the task's specified verification.
5. Record actual RED/GREEN/REFACTOR and verification evidence in the Capsule.
6. Mark the task complete only after verification supports it.

## Step 3: Finish Development

After all tasks are complete and verified:

- Say: "I am using the finishing-a-development-branch skill to finish this work."
- Use `finishing-a-development-branch`.
- Verify tests, then present the allowed integration choices.

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
