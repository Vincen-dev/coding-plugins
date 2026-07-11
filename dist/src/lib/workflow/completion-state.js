export function auditCompletion(input) {
    const blockers = [];
    if (!input.decisionsApproved) {
        blockers.push("DECISION_STALE");
    }
    if (!input.evidenceFormal) {
        blockers.push("EVIDENCE_NOT_FORMAL");
    }
    if (!input.policyCoverageComplete) {
        blockers.push("POLICY_COVERAGE_MISSING");
    }
    if (input.scopeRelation === "expanded") {
        blockers.push("SCOPE_EXPANDED");
    }
    else if (input.scopeRelation === "new-change" || input.scopeRelation === "uncertain") {
        blockers.push(`SCOPE_${input.scopeRelation.replace("-", "_").toUpperCase()}`);
    }
    if (!input.sourceHashMatches) {
        blockers.push("SOURCE_HASH_STALE");
    }
    if (!input.tasksComplete) {
        blockers.push("TASKS_INCOMPLETE");
    }
    if (!input.testsPassed) {
        blockers.push("TESTS_FAILED");
    }
    blockers.sort();
    const formalCompletionAllowed = blockers.length === 0;
    return {
        implementation: input.tasksComplete ? "complete" : "pending",
        verification: input.testsPassed ? "passed" : "failed",
        workflow: formalCompletionAllowed ? "complete" : "blocked",
        commit: input.commitRequested ? (input.commitComplete ? "complete" : "pending") : "not-requested",
        publish: input.publishApplicable ? (input.publishComplete ? "complete" : "pending") : "not-applicable",
        validFor: formalCompletionAllowed
            ? ["local-review", "task-completion", "formal-completion"]
            : input.tasksComplete && input.testsPassed ? ["local-review", "task-completion"] : ["local-review"],
        formalCompletionAllowed,
        blockers,
    };
}
