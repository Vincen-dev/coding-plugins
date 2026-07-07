# Coding Plugins for Gemini CLI

Coding Plugins is a Chinese-first coding-agent workflow plugin with English agent-facing skills. At the start of any development, debugging, review, commit, or finishing task, read and follow `skills/using-coding-plugins/SKILL.md`.

## Default Entry Points

- Idea discussion, unclear requirements, or analysis before landing: use `brainstorming`.
- New feature, behavior change, API contract, schema, state machine, or unclear acceptance criteria: use `spec-driven-development`.
- Small clear change: use `test-driven-development`.
- Bug, failing test, CI failure, or unclear root cause: use `systematic-debugging`.
- Approved TED task execution document: use `subagent-driven-development` when authorized, otherwise `executing-plans`.
- Before claiming completion: use `verification-before-completion`.
- When the user asks for a commit: use `using-git-commit`.

## Core Constraints

- Specs before implementation; evidence before completion claims.
- During execution, prefer the current TED task section and execution lock instead of rereading the whole upstream chain.
- After changing this plugin, run `npm run preflight`.
