---
name: writing-technicals
description: Use after approved specs exist and before TED planning to create or update a TSD technical design document, architecture decision, ADR, or implementation design.
---

# Writing Technicals

## Overview

TSD means Technical Solution Document. It translates approved requirements into a single implementation design. It explains how the system will satisfy the PRD, what will change, and why the chosen approach is appropriate.

Start by saying: "I am using the writing-technicals skill to create the TSD."

Default path:

```text
docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
```

## Prerequisites

- PRD exists and is approved.
- Use `document-metadata` to read README and PRD frontmatter.
- Feature and doc id match the PRD.
- If requirements are still changing, return to `writing-requirements`.

## TSD Responsibilities

TSD should include:

- Read summary.
- Design goals and non-goals.
- Affected files, modules, commands, or interfaces.
- Key decisions and alternatives considered.
- Data, schema, API, state, or CLI contracts when relevant.
- Compatibility and migration strategy.
- Testing strategy and VED evidence expectations.
- Risks and mitigations.

TSD should not include:

- New requirements not present in PRD.
- Step-by-step implementation tasks.
- Actual RED/GREEN evidence.
- Commit, branch, or release instructions unless required by the design scope.

## Writing Flow

1. Read PRD frontmatter and body.
2. Extract requirement IDs and acceptance criteria.
3. Inspect existing code, docs, tests, and local conventions.
4. Identify the minimal design that satisfies the PRD.
5. Record alternatives only when they affect the decision.
6. Map design decisions back to requirement IDs.
7. Define test strategy and evidence expectations.
8. Update metadata and index.
9. Run technical validation:

```bash
coding-plugins validate-technicals --root . --format json --strict docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
```

Use repository fallback when `coding-plugins` is not on `PATH`.

## Design Rules

- Do not hide requirements inside design language. If a sentence creates a MUST/SHOULD behavior, reference a Spec ID or mark it as a design constraint.
- Prefer existing codebase patterns over new abstractions.
- Choose structured parsers and APIs over ad hoc text manipulation when practical.
- Keep scope tied to approved requirements.
- State compatibility, migration, or why they do not apply.
- Keep tables for mappings and decisions; use prose and lists for explanation.

## Lifecycle Metadata

Use:

- `lifecycle_status: draft` while writing.
- `lifecycle_status: approved` after DP-2 approval.
- `lifecycle_status: implemented` only after implementation and VED closure.
- `implemented_commits` only for landed commits.
- `validated_by` for real commands or planned validation notes.

## Self-Review

- Every design decision maps to approved requirements.
- No new hidden requirement was introduced.
- Affected files or modules are concrete.
- Alternatives and tradeoffs are clear.
- Testing strategy is executable.
- Metadata and `related_docs` are correct.
- Validator has run.

## Handoff

After TSD is written, stop at DP-2. Once approved, hand off to `writing-test-cases`.
