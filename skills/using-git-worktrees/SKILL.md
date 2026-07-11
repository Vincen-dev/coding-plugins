---
name: using-git-worktrees
description: Use before risky feature work or execution of an approved Change Capsule plan when workspace isolation is needed.
---

# Using Git Worktrees

## Overview

Ensure implementation happens in an isolated workspace when appropriate. Prefer platform-native worktree support. Fall back to `git worktree` only when native tooling is unavailable.

Start by saying: "I am using the using-git-worktrees skill to set up an isolated workspace."

## Step 0: Detect Existing Isolation

Read repository contribution instructions and current Git state. Use a feature branch or linked worktree by default. Work directly on the base branch only when repository rules and explicit user approval require it.

Before creating anything, inspect:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
git rev-parse --show-superproject-working-tree
```

If `GIT_DIR != GIT_COMMON` and this is not a submodule, you are already in a linked worktree. Do not create another one.

If this is a normal checkout on `main` or `master`, do not start implementation there without explicit user approval. Create or switch to an appropriate feature branch or worktree unless the repository explicitly requires direct base-branch work.

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

- Creating a second worktree when already isolated.
- Hand-writing `git worktree add` when native tooling is available.
- Skipping ignore checks for project-local worktree directories.
- Skipping baseline verification before claiming readiness.
- Continuing on `main` or `master` without explicit user approval.
- Creating a feature or release branch when repository contribution rules forbid it.
