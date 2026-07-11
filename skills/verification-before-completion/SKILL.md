---
name: verification-before-completion
description: Use before claiming work is complete, fixed, or passing; requires running verification commands and reading their output first.
---

# Verification Before Completion

## Overview

Evidence comes before the claim. Do not say work is complete, fixed, clean, passing, or ready unless fresh verification from this turn supports that statement.

## Gate Function

Before making any completion claim:

1. Identify the command or check that proves the claim.
2. Run the full command in the current context.
3. Read the output, exit code, pass/fail count, and warnings.
4. Decide whether the output supports the claim.
5. Report the result with the command and relevant evidence.

If verification fails, report the failure and do not claim completion.

## Risk-Proportionate Verification

Match final verification to the selected profile and affected contract. Focused checks are sufficient only for claims limited to that focused surface; focused checks do not support a broad completion claim.

For public API, schema, migration, compatibility, security, or release work, run the full relevant test suite by default in addition to focused contract checks. "Full relevant" means the broadest maintained suite that exercises the affected package or product boundary, not necessarily every unrelated repository in a monorepo.

If the full relevant suite cannot run, narrow the completion claim, name the unverified commands and surfaces, and record them under Residual Risks. Do not replace the missing suite with previous output or a narrower check while claiming the whole change is complete.

## Required Evidence Examples

| Claim | Required Evidence |
| --- | --- |
| Tests pass | Test output with zero failures. |
| Lint is clean | Lint output with zero errors. |
| Build succeeds | Build command exit code 0. |
| Bug is fixed | The reproduction or regression test now passes. |
| Contract item is satisfied | `VC-*` traceability plus its declared test or reproducible check. |
| Subagent work is complete | Main-thread diff inspection plus independent verification. |
| Governed public or compatibility change is complete | Focused contract checks plus the full relevant suite, or an explicitly narrowed claim with Residual Risks. |

## Red Flags

- Saying "should", "probably", or "looks good" before verification.
- Trusting a previous run as current evidence.
- Trusting a subagent success report without checking.
- Running only a narrow check while claiming broad completion.
- Preparing a commit, PR, tag, or release without fresh checks.

## Bottom Line

No shortcut exists. Run the command, read the output, then make the claim only if the evidence supports it.
