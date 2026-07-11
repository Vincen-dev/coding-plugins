# Coding Plugins 2.0.0 Workflow

```text
User intent
  -> using-coding-plugins
  -> Inspect | Quick | Standard | Governed | Critical
  -> Verifiable Contract: Outcome | Boundary | Verification
  -> optional change-capsule artifacts
  -> failing test/check or refactor characterization baseline
  -> minimal implementation
  -> refactor with tests green
  -> contract and quality review
  -> fresh verification
  -> evidence and completion
  -> commit and branch finishing when requested
```

## Profiles

- Inspect: no artifact, answer directly.
- Quick: no artifact, focused TDD and verification.
- Standard: one `change.md`; reconfirm only on material scope expansion.
- Governed: `change.md`, `plan.md`, `evidence.md`; Scope/Plan and Execution approvals.
- Critical: Governed artifacts plus optional design/test/compliance attachments; Scope, Technical, and Execution approvals.

`change.md` is the only whole-change state source. Attachment files do not duplicate phase, approval, current-task, or completion fields.

## Universal invariants

- Test First: no production change without test-first evidence.
- Verifiable Contract: every implementation has numbered or conversational Outcome, Boundary, and Verification.
- Systematic Execution: stop rather than guess when the contract, failure, or verification is unclear.
- Simplicity: use the smallest honest Profile and its artifact budget.
- Evidence Before Claims: run and read fresh verification before completion language.
