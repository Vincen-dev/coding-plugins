---
name: using-git-worktrees
description: Use only after the user explicitly requests or approves worktree isolation for risky feature work or execution of an approved Change Capsule plan.
---

# Using Git Worktrees

## Overview

Ensure implementation happens in an isolated workspace after the user authorizes that workspace change. Prefer platform-native worktree support. Fall back to `git worktree` only when native tooling is unavailable.

Explicit user approval is a hard precondition for invoking this skill and for creating or switching to a linked worktree. The default is to continue in the current checkout without invoking this skill. Isolation being useful, a plan being approved, or the checkout containing conflicts does not itself grant approval. Stop and ask when approval is absent or ambiguous.

After confirming approval, start by saying: "I am using the using-git-worktrees skill to set up the isolated workspace you approved."

## Single-Writer Rule

A shared checkout follows a single-writer rule: one active write task at a time. Multiple read-only tasks may inspect the same checkout, but a second write task requires either a user-approved separate worktree or waiting until the checkout has one writer.

Treat unrelated or overlapping changes from another task as evidence that the checkout already has a writer. Partial staging, temporary indexes, stash choreography, and branch-ref manipulation are not a substitute for isolation. They may be used only to recover or finish an already-entangled state after the exact diff and recovery path are understood.

## Step 0: Detect Existing Isolation

Confirm that the user's approval covers creating or switching to a linked worktree, then read repository contribution instructions and current Git state. Do not create or switch to a linked worktree until approval is present. Work directly on the base branch only when repository rules and explicit user approval require it.

Also inspect `git status --short --branch`. Classify every existing change as current-task, known user-owned, or unknown/other-task. If any write overlaps or ownership is unclear, do not edit in this checkout. Create a separate worktree only within the user's approved scope; otherwise stop and ask for direction.

Before creating anything, inspect:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
git rev-parse --show-superproject-working-tree
```

If `GIT_DIR != GIT_COMMON` and this is not a submodule, you are already in a linked worktree. Do not create another one.

If this is a normal checkout on `main` or `master`, do not start implementation there without explicit user approval. Create the approved worktree from an appropriate base, unless the repository explicitly requires direct base-branch work.

## Step 1: Prefer Native Worktree Support

If the platform provides a native worktree creation tool, use it. Native tools know how the host tracks worktrees and cleanup.

## Step 2: Git Worktree Fallback

Use this only when native tooling is unavailable.

Directory preference:

1. User-provided worktree path.
2. Project-local `.worktrees/`.
3. Project-local `worktrees/`.

Before creating project-local worktrees, verify the directory is ignored:

```bash
git check-ignore -q .worktrees
git check-ignore -q worktrees
```

If not ignored, update `.gitignore` and treat that as a separate setup change.

Create:

```bash
git worktree add <path> -b <branch-name>
```

For detached filesystem isolation without a named branch:

```bash
git worktree add --detach <path> <base-branch>
```

If sandbox permissions block worktree creation, report that and continue only after choosing a safe branch/workspace approach.

## Step 3: Project Setup

Run the relevant setup command when needed:

```bash
npm install
cargo build
pip install -r requirements.txt
poetry install
go mod download
```

## Step 4: Baseline Verification

Run the project baseline, such as `npm test`, `cargo test`, or `go test ./...`.

If baseline verification fails, report the failure and decide whether to investigate or continue with known baseline failures.

## Report Format

```text
Worktree ready at <full-path>
Branch: <branch>
Baseline: <command and result>
Ready to implement <feature-name>
```

## Prohibited

- Invoking this skill or creating or switching to a linked worktree without explicit user approval.
- Creating a second worktree when already isolated.
- Hand-writing `git worktree add` when native tooling is available.
- Skipping ignore checks for project-local worktree directories.
- Skipping baseline verification before claiming readiness.
- Continuing on `main` or `master` without explicit user approval.
- Creating a feature or release branch when repository contribution rules forbid it.
- Starting a second write task in a shared checkout.
- Treating selective staging as the normal solution for concurrent task isolation.
