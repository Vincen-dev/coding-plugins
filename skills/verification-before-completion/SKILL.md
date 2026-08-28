---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing; requires running verification commands and reading their output first.
---

# Verification Before Completion

## Overview

Evidence comes before the claim. Do not say work is complete, fixed, clean, passing, or ready unless fresh verification in the verified delivery context supports that statement. Fresh means the evidence was produced after the final relevant change in the same verified context; a conversation turn boundary alone does not make evidence fresh or stale.

## Gate Function

Before making any completion claim:

1. Identify the command or check that proves the claim.
2. Run the full command in the current context.
3. Read the output, exit code, pass/fail count, and warnings.
4. Confirm the verification provenance matches the actual delivery target.
5. Decide whether the output supports the claim.
6. Report the result with the command, provenance, and relevant evidence.

If verification fails, report the failure and do not claim completion.

## Verification Provenance

Record the fields relevant to the claim:

- repository root;
- branch/HEAD;
- dirty diff fingerprint or exact staged/unstaged scope;
- entrypoint/flavor;
- resolved dependencies and lock state;
- generated outputs and codegen/DI state;
- artifact/device identity for installed, packaged, simulator, or physical-device claims;
- external backend, signing, account, or environment when it affects the result.

A green command in another checkout, against stale generated outputs, or for a different artifact does not verify the user's running target.

## Risk-Proportionate Verification

Match final verification to the selected profile and affected contract. Focused checks are sufficient only for claims limited to that focused surface; focused checks do not support a broad completion claim.

For public API, schema, migration, compatibility, security, or release work, run the full relevant test suite by default in addition to focused contract checks. "Full relevant" means the broadest maintained suite that exercises the affected package or product boundary, not necessarily every unrelated repository in a monorepo.

If the full relevant suite cannot run, narrow the completion claim, name the unverified commands and surfaces, and record them under Residual Risks. Do not replace the missing suite with previous output or a narrower check while claiming the whole change is complete.

Classify every known baseline failure separately from new failures. Rerun or otherwise establish enough evidence to show that it is pre-existing and out of scope; do not change unrelated code or weaken tests merely to make a broad suite green.

For device, firmware, signing, backend, release, or performance outcomes, name the external verification gate explicitly. Local unit, widget, source-scan, or simulator checks support only the surfaces they exercise.

## Documentation Delivery

Read the current Documentation Impact classification before completion. When it is non-`none`, confirm that the maintained documentation target exists or that the external update has verifiable evidence, and verify the documentation against the final code, public API, lifecycle, data ownership, and external boundaries relevant to the change.

Module documentation does not replace tests, runtime evidence, artifact/device checks, or external verification. When documentation cannot be updated or checked, narrow the completion claim and record the stale or missing target under Residual Risks.

## Required Evidence Examples

| Claim | Required Evidence |
| --- | --- |
| Target tests pass | Named test scope with zero target failures; known baseline failures are separately classified. |
| Lint is clean | Lint output with zero errors. |
| Build succeeds | Build command exit code 0. |
| Bug is fixed | The reproduction or regression test now passes. |
| Contract item is satisfied | `VC-*` traceability plus its declared test or reproducible check. |
| Subagent work is complete | Main-thread diff inspection plus independent verification. |
| Governed public or compatibility change is complete | Focused contract checks plus the full relevant suite, or an explicitly narrowed claim with Residual Risks. |
| Module documentation is delivered | Non-`none` Documentation Impact target exists and matches the final maintained contract; external targets have a verifiable reference. |

## Red Flags

- Saying "should", "probably", or "looks good" before verification.
- Trusting a previous run as current evidence.
- Verifying the wrong checkout, entrypoint, generated state, build artifact, or device.
- Trusting a subagent success report without checking.
- Running only a narrow check while claiming broad completion.
- Preparing a commit, PR, tag, or release without fresh checks.

## Bottom Line

No shortcut exists. Run the command, read the output, then make the claim only if the evidence supports it.
