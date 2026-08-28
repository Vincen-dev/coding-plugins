---
name: subagent-driven-development
description: Use when an approved Change Capsule plan contains independent tasks suitable for implementation and review agents.
---

# Subagent Driven Development

## Overview

Execute Capsule plan tasks through focused implementation and review agents when the user and current platform authorize subagent work.

Do not spawn subagents unless the user explicitly asked for subagents, delegation, or parallel agent work. If not authorized, use `executing-plans` in the current session.

## Preconditions

- The active Capsule plan is approved for execution.
- `change.md` identifies one current task and the relevant artifact references.
- Work happens in a safe branch or isolated workspace.
- Each delegated task has a disjoint write set.
- Delegated tasks have disjoint shared mutable resources; codegen, localization generation, dependency resolution, native build directories, the Git index, devices, and caches count as shared state.

## Dispatch Flow

1. Assemble an implementer prompt from the current Capsule task. Include the task text, scope fence, `VC-*` items, Documentation Impact classification and target, required tests, and evidence expectations.
2. Assign file ownership and state that other agents or the main thread may be editing other files.
3. Assign shared-resource ownership. Serialize codegen, native build, Git index, dependency, localization, and device operations even when source files are disjoint.
4. Require TDD for behavior, contract, config, architecture, or source-scan changes.
5. For non-`none` Documentation Impact, assign ownership of the module documentation task and keep it disjoint from Capsule state.
6. Require a final report with files changed, module documentation delivered when required, commands, results, and concerns.
7. Review returned changes in the main thread.
8. Run contract review and code quality review when appropriate.
9. Integrate only after verification.

## Review Flow

Use two review angles:

- Contract reviewer: confirms required `VC-*` items and plan task instructions are satisfied.
- Code quality reviewer: finds bugs, regression risks, weak tests, and maintainability issues.

Do not trust review or implementation reports without reading the diff and running verification locally.

## Stop Conditions

Stop or route back to planning when:

- The approved Capsule scope or plan changed materially.
- The task scope overlaps another active task.
- The agent needs a major architecture decision not present in the Capsule plan.
- Verification cannot be run.
- Review finds blocking issues.
