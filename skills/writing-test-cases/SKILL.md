---
name: writing-test-cases
description: Use after approved requirement documents and technical documents exist, before writing TED task execution documents, to create or update TVD test case documents under docs/coding-plugins/features.
---

# Writing Test Cases

## Overview

This skill turns approved requirements and a TSD into a TVD test case document. TVD fixes what must be tested, at what layer, with which assertions, before TED execution tasks are written.

Start by saying: "I am using the writing-test-cases skill to write the TVD."

Default path:

```text
docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
```

## When to Use

Use this skill when:

- PRD requirements are approved.
- A TSD exists and the test strategy needs to be made executable.
- Each MUST requirement needs a test type, assertion, data, and evidence target.

Do not use it when:

- Requirements are not approved.
- No technical design exists.
- You are writing actual test code or RED/GREEN evidence; use `test-driven-development`.

## Process

1. Use `document-metadata` to read README, PRD, TSD, TED, and VED relationships.
2. List all MUST requirement IDs.
3. Read the TSD for design decisions, affected files, and test strategy.
4. Create or update the TVD.
5. Add one focused test case per behavior or contract.
6. State any manual test or no-test exception with reason and replacement evidence.
7. Update the index and run relevant validators.

## Content Rules

TVD should include:

- Read summary.
- Test case matrix.
- Test type: behavior, contract, architecture, source-scan, config, or manual.
- Preconditions, steps, assertions, test data, and covered requirement IDs.
- Evidence target in the same doc id's VED.

TVD should not include:

- Implementation tasks.
- Actual RED/GREEN output.
- Technical decision debates.
- Duplicated document path tables that belong in metadata.

## Approval Gate

After writing TVD, stop at DP-3. Do not write or execute TED until the user approves the test design.
