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

## Required Evidence Examples

| Claim | Required Evidence |
| --- | --- |
| Tests pass | Test output with zero failures. |
| Lint is clean | Lint output with zero errors. |
| Build succeeds | Build command exit code 0. |
| Bug is fixed | The reproduction or regression test now passes. |
| Requirement is satisfied | Spec traceability plus relevant tests or contract checks. |
| Subagent work is complete | Main-thread diff inspection plus independent verification. |

## Red Flags

- Saying "should", "probably", or "looks good" before verification.
- Trusting a previous run as current evidence.
- Trusting a subagent success report without checking.
- Running only a narrow check while claiming broad completion.
- Preparing a commit, PR, tag, or release without fresh checks.

## Bottom Line

No shortcut exists. Run the command, read the output, then make the claim only if the evidence supports it.
