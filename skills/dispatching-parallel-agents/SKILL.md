---
name: dispatching-parallel-agents
description: Use when there are two or more independent tasks with no shared state or ordering dependency.
---

# Dispatching Parallel Agents

## Overview

Delegate independent problem areas to focused agents with isolated context. Give each agent only the instructions, files, constraints, and expected output needed for its task.

Core principle: assign each independent domain to one agent so investigation or implementation can happen concurrently without shared-state conflicts.

## When to Use

Use this skill when:

- Three or more test files fail for unrelated root causes.
- Multiple subsystems are independently broken.
- Each problem can be understood without the context of the others.
- The investigations do not share mutable state.
- The tasks have disjoint write sets.

Do not use it when:

- Failures are related and one fix may resolve several.
- The full system state must be understood before changing anything.
- Agents would edit the same files or interfere with shared resources.
- The user has not authorized subagent or parallel-agent work on the current platform.

## Pattern

1. Identify independent domains. Group by test file, subsystem, feature, or failure mode.
2. Define narrow tasks. Each agent needs scope, goal, constraints, and expected output.
3. Dispatch in parallel only when the tool and user authorization allow it.
4. Review returned work. Read summaries, inspect diffs, check conflicts, and run integrated tests.

## Good Agent Prompt

```text
Fix the three failures in src/agents/agent-tool-abort.test.ts.

Scope:
- Read the test file and the implementation it exercises.
- Find whether the failures are timing issues or product bugs.
- Prefer event-driven waits over arbitrary timeouts.
- Do not edit unrelated files.

Return:
- Root cause.
- Files changed.
- Verification commands and results.
```

## Common Mistakes

- Asking an agent to "fix all tests".
- Sending vague context such as "fix the race condition".
- Omitting file ownership and allowing broad refactors.
- Accepting an agent success report without reading the diff and running verification.
