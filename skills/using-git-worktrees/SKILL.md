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

Classify the checkout before deciding that it already has another writer:

- `clean`: no existing changes; continue after the worktree approval and setup checks.
- `known-unrelated`: inactive, user-owned changes are not proof of an active writer. Confirm that target files and shared mutable resources are disjoint before choosing isolation.
- `overlapping-or-unknown`: overlapping files or unclear ownership block editing until resolved.
- `active-writer`: another task or process is actively writing; isolate with the approved worktree or wait.

Check shared mutable resources as well as file paths. Codegen, localization generation, dependency resolution, native build directories, the Git index, devices, and package caches can conflict even when source files are disjoint. Partial staging, temporary indexes, stash choreography, and branch-ref manipulation are not a substitute for isolation when overlap or an active writer exists.

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

If neither directory is ignored, do not automatically edit `.gitignore`. Use an already approved external/user-provided path, or ask whether the user wants a separate repository setup change before modifying ignore rules.

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

Dependency setup is not an automatic consequence of creating a worktree. Run it only when required by the repository instructions or by baseline verification.

Before setup, inspect the package manager and lockfile. Prefer frozen or locked installation modes that do not rewrite dependency state. If setup would change a lockfile, generated dependency metadata, or another tracked file outside the approved scope, stop and ask. If it requires a network download or credentials, follow the environment's approval boundary and report the external dependency.

Examples, only when the repository actually requires them:

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
- Automatically editing `.gitignore` because a preferred worktree directory is not ignored.
- Running dependency setup or network downloads when baseline verification does not require them.
- Skipping baseline verification before claiming readiness.
- Continuing on `main` or `master` without explicit user approval.
- Creating a feature or release branch when repository contribution rules forbid it.
- Starting a second write task in a shared checkout.
- Treating selective staging as the normal solution for concurrent task isolation.
