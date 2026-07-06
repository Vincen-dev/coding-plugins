---
name: writing-skills
description: Use when creating a new skill, editing an existing skill, or validating a skill before deployment.
---

# Writing Skills

## Overview

Create and maintain Coding Plugins skills as executable agent instructions. A skill should tell the agent when to use it, what constraints apply, what steps to follow, and how to verify the work.

Core principle: skill text is agent-facing execution guidance. Durable machine-checkable gates should live in CLI guards, tests, or shared rule modules rather than being duplicated across many skills.

## When to Use

Use this skill when:

- Creating a new `skills/<name>/SKILL.md`.
- Editing an existing skill.
- Adding supporting prompts, references, scripts, or templates.
- Validating skill behavior before release.
- Separating skill guidance from guard rules.

## Skill Structure

Every `SKILL.md` needs:

- YAML frontmatter with `name` and `description`.
- A clear overview.
- When to use and when not to use.
- Preconditions and hard gates.
- Step-by-step process.
- Verification or evidence expectations.
- Common mistakes.
- Links to directly relevant references only.

Keep machine keys and agent-facing execution text in English. User-facing Chinese docs may remain in README, INSTALL, examples, or localized documentation when they are not the agent execution surface.

## Process

1. Read the existing skill and any directly referenced files.
2. Identify whether the change is instruction text, guard logic, metadata, prompt, script, or template.
3. Keep the edit scoped to the requested skill surface.
4. Avoid duplicating CLI-enforced rules inside multiple skills; refer to the guard instead.
5. Add or update tests when the skill contract can be checked.
6. Run targeted checks and then repository preflight when release-facing.

## Testing Skills

Use TDD when changing behavior that can be checked:

- Add or update a source-scan, prompt-builder, fixture, or routing test first.
- Confirm it fails for the old behavior.
- Update the skill or helper.
- Confirm it passes.
- Record VED evidence when the work is part of a formal chain.

## Common Mistakes

- Writing broad philosophy instead of actionable instructions.
- Mixing skill guidance with machine guard policy.
- Adding references that are not needed for the task.
- Translating user-facing docs while leaving agent-facing prompts inconsistent.
- Weakening gates during translation.
- Claiming the skill works without running a validation command.
