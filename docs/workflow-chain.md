# Coding Plugins 2.x Workflow

```text
User intent
  -> using-coding-plugins
  -> Inspect | Quick | Standard | Governed | Critical
  -> pre-implementation hard gates: checkout ownership/resources | required capability | resolved decisions
  -> Verifiable Contract: Outcome | Boundary | Verification
  -> Documentation Impact Check: none | update-existing | create-module-doc | external-doc
  -> optional change-capsule artifacts
  -> behavior RED | refactor characterization | static contract check | external verification gate
  -> minimal implementation
  -> refactor with tests green
  -> contract and quality review
  -> fresh verification
  -> module documentation delivery when impact is non-none
  -> evidence and completion
  -> commit and branch finishing when requested
```

## Profiles

- Inspect: no artifact, answer directly.
- Quick: no artifact, focused TDD and verification.
- Standard: one `change.md`; reconfirm only on material scope expansion.
- Governed: `change.md`, `plan.md`, `evidence.md`; Scope/Plan and Execution approvals.
- Critical: Governed artifacts plus optional design/test/compliance attachments; Scope, Technical, and Execution approvals.

For Governed work, one unambiguous instruction given after the plan is presented may record both plan acceptance and immediate execution. Critical approvals remain separate.

`change.md` is the only whole-change state source. Attachment files do not duplicate phase, approval, current-task, or completion fields.

## Documentation delivery

Change Capsule records the history and evidence of one change; maintained module documentation describes the delivered module's current purpose, ownership, entrypoints, flows, data, external contracts, lifecycle, verification surface, and known limits. Module documentation is separate from Change Capsule state and does not replace tests or runtime evidence.

Module documentation is not mandatory for every change. `none` adds no documentation task; `update-existing`, `create-module-doc`, and `external-doc` must name a maintained target and verification. New modules and material changes to module boundaries, lifecycle, data ownership, public contracts, or external integrations require a create or update decision.

## Universal invariants

- Test First: no production change without the evidence mode appropriate to its behavior or contract; runtime behavior still requires a real RED.
- Verifiable Contract: every implementation has numbered or conversational Outcome, Boundary, and Verification.
- Systematic Execution: stop rather than guess when the contract, failure, or verification is unclear.
- Simplicity: use the smallest honest Profile and its artifact budget.
- Evidence Before Claims: run and read fresh verification before completion language.

## Pre-implementation hard gates

- A shared checkout has one active writer. Known unrelated inactive changes may remain when files and shared resources are disjoint; overlap, unknown ownership, or an active writer stops implementation. Worktrees require explicit user approval.
- Governed and Critical work stops when a required Skill, artifact, or approval is unavailable; it never downgrades to keep moving.
- Conditional assumptions that can change public behavior, schema, migration, compatibility, rollback, or verification become explicit Decision Points and block execution while unresolved.
- Public API, schema, migration, compatibility, security, and release changes run the full relevant suite by default; unavailable coverage narrows the completion claim and becomes a residual risk. Verification also records the checkout, entrypoint, resolved/generated state, and artifact or device relevant to the claim.
