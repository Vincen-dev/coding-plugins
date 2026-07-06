---
name: writing-requirements
description: Use when writing or updating Coding Plugins PRD requirement documents, including feature, API contract, schema, state-machine, acceptance, or maintenance requirements under docs/coding-plugins/features.
---

# Writing Requirements

## Overview

This skill writes PRD and requirement specification documents. Requirements define what must be true and why; they do not prescribe implementation details or task execution.

Start by saying: "I am using the writing-requirements skill to create or update the PRD."

Default path:

```text
docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
```

## Prerequisites

- Use `document-metadata` for frontmatter and related document relationships.
- Confirm the feature name and doc id from the existing feature README, index, or user request.
- If the request is still exploratory, use `brainstorming` first.

## Content Rules

PRD should contain:

- Problem and goals.
- Non-goals.
- Users or stakeholders.
- Requirements with stable IDs such as `REQ-001`.
- Acceptance criteria or traceability.
- Risks, assumptions, and open questions.
- Explicit compatibility or migration expectations when relevant.

PRD should not contain:

- Implementation tasks.
- Code-level design.
- RED/GREEN evidence.
- Release or commit instructions unless they are part of the requirement scope.

## Process

1. Read existing README and related docs frontmatter.
2. Extract the requested behavior and classify it as feature, maintenance, API contract, schema, state machine, or acceptance criteria.
3. Write or update the PRD with stable requirement IDs.
4. Keep machine-readable keys in English; use prose for human-facing detail.
5. Update related metadata and `docs/coding-plugins/INDEX.md`.
6. Run the PRD validator.

Validation command:

```bash
coding-plugins validate-spec docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md --format json
```

Use the repository CLI fallback when `coding-plugins` is not on `PATH`.

## Approval Gate

After writing the PRD, stop at DP-1. Do not create TSD, TVD, or TED until the user approves the requirements.
