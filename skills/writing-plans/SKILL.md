---
name: writing-plans
description: Use when approved PRD, TSD, and TVD documents exist and a TED task execution document must be created or updated.
---

# Writing Plans

## Overview

TED means Task Execution Document. It converts approved PRD, TSD, and TVD documents into executable, verifiable tasks that can produce VED evidence.

Core principle: TED answers how the executor should proceed next. TSD remains the design source; TVD remains the test-design source; metadata remains the relationship source.

Start by saying: "I am using the writing-plans skill to create the TED."

Default path:

```text
docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
```

VED path:

```text
docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
```

## Prerequisites

- PRD is approved.
- TSD exists and is approved.
- TVD exists and is approved.
- Use `document-metadata` for frontmatter and related docs.
- Feature and doc id match PRD, TSD, TVD, and VED.

## TED Should Include

- Execution goal and entry point.
- Minimal execution brief.
- Task overview with stable task IDs.
- Per-task goal, prerequisites, file scope, steps, verification, and VED requirements.
- Spec ID to task and test mapping.
- RED/GREEN/REFACTOR requirements.
- Source hash from upstream PRD/TSD/TVD.
- Execution lock section.

TED should not include:

- Full technical design.
- New requirements.
- Actual RED/GREEN output.
- Final validation evidence.
- Broad release, commit, or publish work unless it is in scope.

## Writing Flow

1. Use `document-metadata` to read PRD, TSD, TVD, and VED frontmatter.
2. Extract all MUST requirement IDs.
3. Extract only execution-relevant constraints from TSD.
4. Extract test cases, test types, assertions, and data from TVD.
5. Write `Execution Brief`.
6. Write `Execution Lock` with intent lock, scope fence, required spec IDs, required tests, review gates, and rewind triggers.
7. Write one task row per `TASK-001` in the overview.
8. Create one section per task with goal, prerequisites, modification scope, steps, verification, and VED requirements.
9. Require TDD for behavior, contract, config, architecture, and source-scan changes.
10. Generate `source_hash`:

```bash
coding-plugins workflow-state hash --feature <feature-name> --doc-id <doc-id> --json
```

11. Run `npm run preflight -- --write-index`.
12. Run `npm run preflight`.

## Task Section Shape

```markdown
## <Task Title> (TASK-001 / REQ-001)

### Goal

What observable change this task creates.

### Preconditions

- Approved requirements.
- Approved design decisions.
- Approved test cases.

### Modification Scope

- Create: `path`, purpose.
- Modify: `path`, boundary.
- Test: `path`, behavior covered.

### Steps

- [ ] Write failing test.
- [ ] Run RED and confirm the right failure.
- [ ] Implement minimally.
- [ ] Run GREEN.
- [ ] Refactor and rerun.
- [ ] Record VED evidence.

### Verification

Commands and expected results.

### VED Requirements

Evidence fields and exception requirements.
```

## Execution Gate

Before implementation, TED must be approved and current:

```bash
coding-plugins workflow-state inspect --feature <feature-name> --doc-id <doc-id> --json
coding-plugins workflow-guard check --feature <feature-name> --doc-id <doc-id> --target execute --json
```

If state is `plan-draft`, `plan-unlocked`, or `plan-stale`, do not execute.

## Self-Review

- Every MUST Spec ID maps to a task or explicit exception.
- Every task has a stable ID.
- Every task has file scope, commands, and expected results.
- TED does not restate the whole TSD.
- TED does not contain actual execution evidence.
- VED path is linked.
- `source_hash` is present.
- Index and validators have run.

## Handoff

After TED is saved, stop at DP-4 and ask for execution-plan approval. Do not implement before approval and workflow guard success.
