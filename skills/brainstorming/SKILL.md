---
name: brainstorming
description: Use when users want idea exploration, solution comparison, product direction discussion, feasibility judgment, or problem framing before a change is approved.
---

# Brainstorming

## Overview

`brainstorming` turns an unformed idea into a clear problem statement, boundaries, options, tradeoffs, and a next-step decision without creating change artifacts.

Core principle: decide whether the work is worth implementing and which risk profile it needs before handing it to `change-capsule` or direct implementation.

## When to Use

Use this skill when:

- The user asks to brainstorm, discuss first, compare options, evaluate whether to do something, or design a better approach.
- Product direction, feature boundaries, user value, success criteria, or non-goals are still unclear.
- Several viable approaches need cost, risk, and recommendation comparison.
- The user explicitly says not to write documents, not to implement, or to analyze first.
- The request is large enough that it should be split before implementation.

Do not use this skill when:

- The user already approved implementation or asked to create durable artifacts; use `change-capsule` or the appropriate implementation skill.
- An approved Capsule plan already exists; go directly to `executing-plans`.
- There is a clear bug reproduction; use `systematic-debugging`.
- The change is small, clear, and already has a Verifiable Contract; use `test-driven-development`.
- The user only asks to explain, read, search, query status, or review; use normal analysis or the matching skill.

## Hard Gates

- Do not write code, scaffold implementation, or invoke implementation skills.
- Do not create a Change Capsule unless the user approves formal landing.
- Do not modify implementation, plan, or evidence artifacts.
- Do not present exploratory judgment as an approved Verifiable Contract.
- Do not enter `change-capsule` until the user confirms formal landing.

## Process

1. Read context: inspect relevant code, documents, conventions, and recent changes; if repository context is unavailable, state the basis for the judgment.
2. Identify the problem type: product direction, user workflow, technical approach, maintenance risk, migration, debugging, or explanation.
3. Clarify the key gap: ask at most one question that changes goals, boundaries, solution choice, or acceptance; otherwise state a reasonable assumption.
4. Split the problem when the scope is too large, and recommend the first landable slice.
5. Present two or three viable options with fit, cost, risk, and non-fit.
6. Recommend one option with concrete reasoning and list remaining open questions.
7. Decide the next step: only after user confirmation, hand off to `change-capsule` or `test-driven-development`; otherwise stay in analysis and option comparison.

## Output Shape

By default, answer in the conversation only and do not create formal documents. Include:

- Problem definition.
- Goals and non-goals.
- Known constraints.
- Option comparison.
- Recommendation.
- Risks and open questions.
- Which workflow profile is recommended.

If the user explicitly asks for temporary notes, create only informal notes and state that they are not an approved Change Capsule.

## Handoff

When the user confirms formal landing, implementation, or picks an option, hand off to `change-capsule` with:

- The chosen option.
- Goals and non-goals.
- Outcome and Boundary.
- Rejected options and why.
- Verifiable Contract items and risk profile that still need confirmation.

Handoff phrase:

```text
The idea has been framed as <option name>. If you confirm implementation, the next step is to create the smallest Change Capsule required by the selected risk profile.
```

## Common Mistakes

- Creating a Change Capsule when the user only asked for options.
- Treating brainstorming as a mandatory artifact phase.
- Entering implementation before user confirmation.
- Giving only one option without comparing alternatives.
- Discussing implementation without defining goals, non-goals, and success criteria.
- Turning the recommendation into a task checklist that bypasses SDD.
