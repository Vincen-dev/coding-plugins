---
name: change-capsule
description: Create, resume, and maintain the smallest durable change artifact set required by the selected risk profile.
---

# Change Capsule

## Purpose

A Change Capsule preserves intent, scope, decisions, execution context, and evidence across turns without a workflow service. Create only the artifacts justified by the selected profile.

## Artifact Profiles

| Profile | Artifact contract |
| --- | --- |
| Inspect | 0 artifacts; answer directly |
| Quick Change | 0 artifacts; use focused implementation and verification |
| Standard Change | 1 artifact: `change.md` |
| Governed Change | 3 artifacts: `change.md`, `plan.md`, `evidence.md` |
| Critical Change | Governed artifacts plus optional `design.md` and `tests.md` when risk requires them |

Default directory:

```text
docs/coding-plugins/changes/<change-id>/
```

Use an external artifact location when the repository already has an approved system of record. Record the external reference in `change.md` and do not create a competing local state.

## Document Language

All generated documents must use Simplified Chinese for titles, headings, narrative text, checklist descriptions, placeholders, decisions, approvals, evidence, and risk statements.

Keep stable machine-facing elements in English: frontmatter keys and enum values, file names, `change_id`, `VC-*` identifiers, code identifiers, commands, paths, API names, and unavoidable technical terms. Do not translate those elements or use them as a reason to produce English narrative sections.

When copying a template or maintaining an existing Capsule, preserve this language boundary. Translate any active English narrative before completing the change.

## Single Source of State

`change.md` is the only artifact that records whole-change phase, risk, approvals, current task, artifact references, and completion status. Attachments contain their own subject matter but must not duplicate whole-change state.

Allowed phases:

```text
framing -> planned -> approved -> executing -> verifying -> complete -> archived
```

Do not create a hidden active-change cache. Do not encode state in comments or duplicate approval records in attachment files.

## Module Documentation Delivery

Module documentation is a durable, living description of the delivered product or architecture: its purpose, ownership, entrypoints, flows, data, external contracts, lifecycle, verification surface, and known limits. It is separate from the Change Capsule, which records one change's intent, execution state, decisions, approval, and evidence.

Record the `Documentation Impact Check` in `change.md` using one of `none`, `update-existing`, `create-module-doc`, or `external-doc`, plus the target, reason, and verification method. For `update-existing`, `create-module-doc`, or `external-doc`, make the documentation update an explicit delivery task and link the maintained target from `change.md`.

Publish module documentation in the repository's existing product, feature, module, or architecture documentation system, or in its approved external system of record. Do not duplicate or record Capsule phase, approval, current task, completion state, or command transcripts in module documentation. A maintained module document does not replace tests, runtime evidence, or an external verification gate.

## Phase Gates

- Move from framing to planned only after the Verifiable Contract contains complete Outcome, Boundary, and Verification fields and the required artifact set exists.
- Move from planned to approved only after the Profile's required approvals are recorded from actual user instructions.
- An unresolved material Decision Point blocks the move to executing. Resolve it with an actual user decision or narrow the approved contract so it is no longer material.
- Move from approved to executing immediately before the first production change.
- Move from executing to verifying only after all planned tasks and focused checks are complete.
- A verification failure returns the change to executing with the failing observation as the Current Task.
- A material contract change or material plan change returns the change to planned and invalidates every downstream approval affected by that change.
- Move from verifying to complete only after fresh verification is read, every `VC-*` item is accounted for, and Residual Risks are explicit.
- Move from complete to archived only as a retention action; archiving does not change the delivered outcome.

## Create Flow

1. Confirm the selected profile from `using-coding-plugins`.
2. Choose a stable kebab-case change id.
3. Copy only the templates required by that profile.
4. Fill intent, risk, scope, numbered Verifiable Contract items, artifacts, and current task in `change.md`.
5. Record the Documentation Impact classification, maintained target, reason, and verification method in `change.md`.
6. Record material Assumptions and Decision Points in `change.md`; mark which unresolved items block execution.
7. For Governed or Critical work, write an executable `plan.md` before requesting execution approval.
8. Record actual implementation and verification evidence in `evidence.md`.

## Required Capability Hard Gate

A missing required Skill, artifact, or approval is a hard gate for Governed and Critical work. Stop before production implementation and report the missing capability.

Do not replace a Governed or Critical workflow with a Quick Change, an ephemeral conversation contract, or fewer artifacts because `change-capsule` is not discoverable or convenient. Restore the required capability or create the required artifacts directly from the documented templates before continuing.

## Assumptions and Decision Points

Record a conditional statement as an Assumption when the current plan relies on it. Promote it to a Decision Point when its answer can change scope, public behavior, schema, migration, compatibility, security, rollback, or verification strength.

Each material Decision Point records the question, current status, decision source, impact, and whether it blocks execution. An unresolved material Decision Point blocks executing; do not infer approval from a conditional recommendation such as "if already released" or "if compatibility is required."

When a resolved assumption proves false or a decision changes materially, return the change to planned, update the Verifiable Contract and plan, and invalidate affected downstream approval.

## Approval Rules

- Quick Change: the user's implementation request is authorization; no additional approval.
- Standard Change: request confirmation only when scope expands materially.
- Governed Change: record Scope/Plan approval, then Execution approval. One unambiguous instruction given after the user sees the plan may satisfy both records when it both accepts the plan and directs immediate implementation; preserve the actual source instead of duplicating ceremonial entries.
- Critical Change: record Scope, Technical, and Execution approvals separately.

Approval records summarize the user's actual instruction and date. Never invent approval from document status alone.

## Resume Flow

Inspect incomplete `docs/coding-plugins/changes/*/change.md` files. Match by change id, intent, scope, or referenced files. If more than one candidate matches, list them and ask the user which change to resume.

After selecting a change:

1. Read `change.md` first.
2. Read only the attachments listed under Artifacts.
3. Continue from Current Task.
4. Reconfirm approval when scope, risk, the Verifiable Contract, rollback, or verification materially changes.

## Scope Drift

Upgrade the profile before implementation when:

- external public API or compatibility appears;
- schema, data migration, security, release, payment, credentials or session authorization, or compliance enters scope;
- rollback becomes uncertain;
- a conditional assumption becomes a material unresolved Decision Point;
- the task splits into independent product changes;
- the approved plan changes materially.

Do not downgrade solely to avoid writing an artifact or asking for approval.

## Evidence and Completion

For Standard work, update Evidence and Completion in `change.md`. For Governed or Critical work, keep detailed RED/GREEN/REFACTOR, final verification, and Residual Risks in `evidence.md`, then summarize the outcome in `change.md`.

Mark complete only after `verification-before-completion` has read fresh results and every Verifiable Contract item is implemented, verified, explicitly deferred, or reported under Residual Risks.

## Completion Compaction

Before marking a Capsule complete, compact process history so the durable artifact remains useful:

- Keep final decisions, the current Verifiable Contract, material rejected options, final verification, delivery references, deferred work, and Residual Risks.
- Collapse or remove repeated status narration, superseded command transcripts, duplicated intermediate summaries, and failed attempts that no longer explain a decision.
- Keep `change.md` as the whole-change summary. Do not duplicate whole-change scope, phase, approvals, or completion across `change.md`, `plan.md`, and `evidence.md`.
- Keep one representative RED per behavior or contract slice when several iterations prove the same fact.
- State that `complete` applies to the current change slice; do not imply that external devices, backends, releases, or a broader feature are complete without their own evidence.

## Templates

- `templates/change.md`: required for Standard, Governed, and Critical.
- `templates/plan.md`: required for Governed and Critical.
- `templates/evidence.md`: required for Governed and Critical.
- `templates/design.md`: optional Critical design attachment.
- `templates/tests.md`: optional Critical test-program attachment.
- `templates/module-doc.md`: optional template to copy into maintained product or architecture documentation, or adapt for an external documentation system. It does not count as a Capsule artifact and is not stored in the Capsule directory by default.

## Handoff

- Approved plan: use `executing-plans` in the current checkout by default. If isolation is needed, obtain explicit user approval before handing off to `using-git-worktrees`.
- Implementation behavior: `test-driven-development`.
- Unclear failure: `systematic-debugging`.
- Completion: `verification-before-completion`.
- Commit and integration: `using-git-commit`, then `finishing-a-development-branch` when requested.
