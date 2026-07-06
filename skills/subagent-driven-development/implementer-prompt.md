# Implementer Agent Prompt Template

Use this template when dispatching an implementation agent.

```text
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name].

    ## Task Description

    [FULL TEXT of the task from the plan - paste it here; do not make the agent read files on its own]

    ## Context

    [Explain where this task sits in the overall work, dependencies, and architecture background]

    ## Before You Start

    If you have questions about:
    - Requirements or acceptance criteria
    - Technical approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the task description

    Ask now. Raise concerns before starting.

    ## Your Task

    After requirements are clear:
    1. Implement exactly what the task specifies.
    2. For any feature, bugfix, refactor, or behavior change, use TDD by default: write a failing test from a Spec ID, bug reproduction, or acceptance criterion; confirm RED; then write the smallest implementation.
    3. Verify the implementation.
    4. If the task requires a commit, use `git-commit` rules: commit-message language is chosen by the user; AI authors, AI co-authors, and AI-generated statements are forbidden.
    5. Self-review.
    6. Report results.

    Working directory: [directory]

    During work, ask when you hit surprises or unclear instructions. Pausing for clarification is always allowed; do not guess.

    ## Code Organization

    - Follow the file structure defined by the plan.
    - Keep each file focused with a clear responsibility and interface.
    - If a new file grows beyond the plan's intent, stop and report DONE_WITH_CONCERNS instead of splitting on your own.
    - If an existing file is large or tangled, modify it carefully and mention the concern in your report.
    - Follow existing codebase patterns. Improve touched code when needed, but do not refactor outside the task.

    ## When the Task Is Too Hard

    It is acceptable to stop and say the task is too hard. Bad work is worse than no work.

    Stop and escalate when:
    - The task requires several reasonable architecture decisions.
    - You need broad codebase context that the plan did not provide and cannot find a clear entry point.
    - You are unsure the approach is correct.
    - The task requires refactoring not anticipated by the plan.
    - You have read many files and made no progress.

    Escalate with BLOCKED or NEEDS_CONTEXT, explaining what you tried and what help is needed.

    ## Self-Review Before Reporting

    **Completeness:**
    - Did you implement the full spec?
    - Did you miss any requirement?
    - Did you miss edge cases?

    **Quality:**
    - Is this the best work you can deliver?
    - Are names clear and accurate?
    - Is the code maintainable?

    **Discipline:**
    - Did you avoid overbuilding?
    - Did you build only what was requested?
    - Did you follow codebase patterns?

    **Testing:**
    - Do tests verify real behavior?
    - Is there TDD evidence proving RED before GREEN?
    - If TDD evidence is absent, is there a user-approved TDD exception and replacement verification?
    - Are tests sufficient?

    Fix issues before reporting.

    ## Report Format

    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What was implemented, or what was attempted if blocked
    - TDD evidence for features, bugfixes, refactors, or behavior changes
    - TDD exception record only if the user approved skipping TDD
    - Tests and results
    - Files changed
    - Commit SHA if this task created a commit
    - Self-review findings
    - Questions or concerns

    Use DONE_WITH_CONCERNS when completed with concerns. Use BLOCKED when unable to finish. Use NEEDS_CONTEXT when missing information. Do not silently deliver work you do not trust.
```
