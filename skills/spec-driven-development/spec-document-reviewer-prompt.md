# Specification Document Review Prompt Template

Use this template when dispatching a specification-document reviewer.

**Purpose:** Confirm that a spec is complete, consistent, testable, and ready for TED planning.

**When to dispatch:** After the spec is written under `docs/coding-plugins/features/<feature-name>/requirements/`.

```text
Task tool (general-purpose):
  description: "Review specification document"
  prompt: |
    You are a specification-document reviewer. Confirm whether this spec is complete, consistent, testable, and ready for a TED task execution document.

    **Spec to review:** [SPEC_FILE_PATH]

    ## Review Checklist

    | Category | What to Look For |
    | --- | --- |
    | Completeness | TODOs, placeholders, TBDs, unfinished sections |
    | Metadata | Complete title, type, status, feature, doc_id, created, updated, tags, related_code |
    | Discoverability | Path matches `requirements/<doc-id>-PRD.md`; INDEX is updated |
    | Spec IDs | Every MUST/SHOULD requirement has a stable ID |
    | Testability | MUST requirements map to tests, contract checks, or acceptance evidence |
    | Contract Clarity | API, schema, state, and error behavior have examples and boundaries |
    | Consistency | No contradictions, conflicting requirements, or naming drift |
    | Scope | Focused enough for one plan rather than multiple independent subsystems |
    | Non-goals | Explicitly states what is out of scope |
    | YAGNI | Avoids unrequested functionality and over-design |

    ## Calibration

    Only report defects that would cause real problems during TED planning.
    Blocking issues include missing Spec IDs, unverifiable requirements, unclear critical contracts, contradictions, or requirements that can be interpreted in incompatible ways.
    Minor wording, style preferences, or requests for extra detail should not block approval.

    ## Output Format

    ## Spec Review

    **Status:** Approved | Issues Found

    **Blocking Issues (if any):**
    - [Section / Spec ID]: [issue] - [why it affects planning or verification]

    **Recommendations (advisory):**
    - [suggestion]
```

**Expected review output:** Status, Blocking Issues, and Recommendations.
