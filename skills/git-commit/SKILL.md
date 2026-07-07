---
name: git-commit
description: Use when the user asks to commit changes, mentions commit, or a completed task needs an intentional Conventional Commit.
---

# Git Commit

## Overview

Create commits deliberately. Inspect the diff, group changes logically, stage only the intended files, generate a Conventional Commit message in the appropriate language, and reject unsafe author metadata.

Core principle: a commit is a delivery boundary, not a dump of the worktree.

## When to Use

Use this skill when:

- The user asks to commit.
- The user mentions `/commit` or says to submit code.
- A finishing flow asks whether to create a commit and the user agrees.

Do not use it when the user only asks for status, review, or implementation without committing.

## Preconditions

- Run relevant verification before committing, or clearly report any known failing verification.
- Check `git status --short`.
- Inspect staged and unstaged diffs.
- Do not stage secrets, local environment files, caches, generated noise, or unrelated user changes.
- Respect the worktree: never revert changes you did not make unless explicitly asked.

## Commit Language Resolution

Resolve commit-message language in this order:

1. Explicit user choice.
2. Recent repository commit history.
3. Ask the user if ambiguous and a commit is required.
4. Current conversation language only as a fallback.

Do not hard-code Chinese or English as a universal rule.

## Author Rules

Use the user's configured git identity. `commit-guard` is the authority for unsafe author metadata and AI-attribution rejection.

Required footer:

```text
Authored-by: <user.name> <user.email>
```

If `user.name` or `user.email` is missing, ask or set repo-local config only with user approval.

## Process

1. Run `git status --short`.
2. Inspect `git diff` and `git diff --cached`.
3. Identify logical commit groups. If the change set contains unrelated work, split commits.
4. Stage files intentionally with `git add <paths>`.
5. Recheck `git diff --cached`.
6. Generate a Conventional Commit:
   - `feat:`
   - `fix:`
   - `docs:`
   - `test:`
   - `refactor:`
   - `chore:`
   - `build:`
   - `ci:`
7. Include a concise body when needed.
8. Add the `Authored-by` footer.
9. Run `git commit`.
10. Report commit SHA, subject, and any verification caveats.

## Safety Checkpoints

Stop and ask before committing when:

- Sensitive files are staged.
- The diff includes unrelated user changes.
- Verification failed and the user did not explicitly accept the risk.
- Commit language cannot be determined.
- The commit would include generated release artifacts, version bumps, or publish-related files that were not requested.
- The active formal workflow requires DP-7 and `commit-guard` does not pass.

## Message Shape

```text
type(scope): concise summary

Optional body explaining why, not just what.

Authored-by: Name <email@example.com>
```

## Common Mistakes

- Using one large commit for unrelated changes.
- Staging the whole worktree without inspecting it.
- Committing `.env`, local config, caches, or temporary files.
- Adding AI co-author lines.
- Forcing a language rule against user preference.
- Committing before required workflow decision points.
