---
name: brainstorming
description: Use when users want idea exploration, solution comparison, product direction discussion, feasibility judgment, or pre-SDD problem framing before formal Coding Plugins documents are created.
---

# Brainstorming

## Overview

`brainstorming` is the pre-SDD framing skill. It turns an unformed idea into a clear problem statement, boundaries, options, tradeoffs, and a next-step decision without creating formal SDD artifacts.

Core principle: decide whether the work is worth entering the formal document chain before handing it to `spec-driven-development`.

## When to Use

Use this skill when:

- The user asks to brainstorm, discuss first, compare options, evaluate whether to do something, or design a better approach.
- Product direction, feature boundaries, user value, success criteria, or non-goals are still unclear.
- Several viable approaches need cost, risk, and recommendation comparison.
- The user explicitly says not to write documents, not to implement, or to analyze first.
- The request is large enough that it should be split before implementation.

Do not use this skill when:

- The user already asked to land documentation, write a PRD, start implementation, or create a plan; use `spec-driven-development` or the appropriate downstream skill.
- An approved PRD already exists; go directly to `writing-technicals`, `writing-test-cases`, or `writing-plans`.
- There is a clear bug reproduction; use `systematic-debugging`.
- The change is small, clear, and has known acceptance criteria; use `test-driven-development`.
- The user only asks to explain, read, search, query status, or review; use normal analysis or the matching skill.

## Hard Gates

- Do not write code, scaffold implementation, or invoke implementation skills.
- Do not create README, PRD, TSD, TVD, TED, or VED documents.
- Do not maintain formal `document-metadata`, `related_docs`, README, or `docs/coding-plugins/INDEX.md`.
- Do not present exploratory judgment as an approved requirement.
- Do not enter `writing-requirements`, `writing-technicals`, `writing-test-cases`, or `writing-plans` until the user confirms formal landing.

## Process

1. Read context: inspect relevant code, documents, conventions, and recent changes; if repository context is unavailable, state the basis for the judgment.
2. Identify the problem type: product direction, user workflow, technical approach, maintenance risk, migration, debugging, or explanation.
3. Clarify the key gap: ask at most one question that changes goals, boundaries, solution choice, or acceptance; otherwise state a reasonable assumption.
4. Split the problem when the scope is too large, and recommend the first landable slice.
5. Present two or three viable options with fit, cost, risk, and non-fit.
6. Recommend one option with concrete reasoning and list remaining open questions.
7. Decide the next step: only after user confirmation, hand off to `spec-driven-development`; otherwise stay in analysis and option comparison.

## Output Shape

By default, answer in the conversation only and do not create formal documents. Include:

- Problem definition.
- Goals and non-goals.
- Known constraints.
- Option comparison.
- Recommendation.
- Risks and open questions.
- Whether `spec-driven-development` is recommended.

If the user explicitly asks for temporary notes, create only informal notes and state that they are not PRD, TSD, TVD, TED, or VED artifacts and do not enter the formal document index.

## Handoff to SDD

When the user confirms formal landing, implementation, document-chain entry, or picks an option, hand off to `spec-driven-development` with:

- The chosen option.
- Goals and non-goals.
- Requirement boundaries.
- Rejected options and why.
- Contracts, acceptance criteria, or risks that still need PRD confirmation.

Handoff phrase:

```text
The idea has been framed as <option name>. If you confirm formal landing, the next step is to use spec-driven-development to create or update the formal PRD chain.
```

## Common Mistakes

- Creating a PRD when the user only asked for options.
- Treating brainstorming as a mandatory design-doc phase and committing it into formal specs.
- Entering `writing-requirements` before user confirmation.
- Giving only one option without comparing alternatives.
- Discussing implementation without defining goals, non-goals, and success criteria.
- Turning the recommendation into a task checklist that bypasses SDD.
