---
name: finishing-a-development-branch
description: Use when implementation is complete, tests pass, and the user needs a structured decision about merge, PR, keep, or cleanup.
---

# Finishing a Development Branch

## Overview

Finish development work with clear options. Verify first, then handle commit needs, inspect the environment, present choices, execute the user's choice, and clean up only when appropriate.

Start by saying: "I am using the finishing-a-development-branch skill to finish this work."

## Step 1: Verify

Before presenting finishing options, run the relevant verification commands. If tests fail, stop and report failures. Do not move to commit, merge, PR, or cleanup.

## Step 2: Check for Uncommitted Changes

Run:

```bash
git status --short
```

If there are uncommitted changes, ask whether to create a commit before integration. If the user chooses commit, use `using-git-commit`.

The commit flow must:

- Follow the `using-git-commit` skill.
- Run the commit guard for author, language, sensitive-file, and DP-7 checks.
- Keep unrelated or unsafe changes out of the finishing commit.

If the user declines commit, continue only with options that honestly state uncommitted changes remain.

## Step 3: Inspect Environment

Determine:

- Current branch.
- Whether this is a linked worktree or normal checkout.
- Base branch, usually `main` unless evidence says otherwise.
- Whether remote push is available if PR is desired.

## Step 4: Present Options

For a normal named branch or linked worktree, present:

1. Merge locally into the base branch.
2. Push and open a PR.
3. Keep the branch/worktree for later.
4. Discard the branch/worktree.

For detached or externally managed workspaces, omit destructive cleanup choices that are unsafe.

## Step 5: Execute the User's Choice

- Local merge: switch to base, pull if appropriate, merge, rerun verification, then clean up only after success.
- Push/PR: push branch and create PR; do not clean up the worktree.
- Keep: leave branch and worktree in place and report where they are.
- Discard: require explicit confirmation such as `discard`; then remove only worktrees created by this flow and delete the branch.

## Prohibited

- Skipping verification before finishing.
- Committing without `using-git-commit`.
- Choosing a commit-message language without user preference or established rule.
- Cleaning up after PR creation.
- Deleting a branch or worktree without explicit discard confirmation.
- Reverting user changes.
