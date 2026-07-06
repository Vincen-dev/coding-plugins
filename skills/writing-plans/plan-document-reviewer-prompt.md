# Plan Document Review Prompt Template

Use this template when dispatching a plan-document reviewer.

**Purpose:** Confirm that the plan is complete, matches the spec, has traceable Spec IDs, and is executable.

**When to dispatch:** After the full plan is written.

```text
Task tool (general-purpose):
  description: "Review plan document"
  prompt: |
    You are a plan-document reviewer. Confirm whether this plan is complete and ready for implementation.

    **Plan to review:** [PLAN_FILE_PATH]
    **Reference spec:** [SPEC_FILE_PATH]

    ## Review Checklist

    | Category | What to Look For |
    | --- | --- |
    | Completeness | TODOs, placeholders, incomplete tasks, missing steps |
    | Spec Alignment | Covers spec requirements without obvious scope creep |
    | Technical Design | Design summary, decisions, affected components, contracts, migration, tests, and risk mitigation are concrete |
    | Traceability | Every MUST Spec ID maps to tests and tasks |
    | Test Source | Failing tests come from Spec IDs, bug reproductions, or explicit acceptance criteria |
    | Task Split | Task boundaries are clear and executable |
    | Buildability | An engineer can follow the plan without getting stuck |

    ## Calibration

    Only report defects that would cause real implementation problems.
    It is blocking only if the implementer would likely fail, get stuck, miss requirements, or be unable to verify.
    Minor wording, style preferences, and nice-to-have detail do not block approval.

    Approve unless there is a serious gap, contradiction, placeholder, untraceable MUST spec, or task too vague to execute.

    ## Output Format

    ## Plan Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Task X, Step Y]: [issue] - [why it affects implementation]

    **Recommendations (advisory, do not block approval):**
    - [suggestion]
```

**Expected review output:** Status, Issues, and Recommendations.
