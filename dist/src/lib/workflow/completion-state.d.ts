import type { ScopeRelation } from "./scope-drift.ts";
export interface CompletionAuditInput {
    tasksComplete: boolean;
    testsPassed: boolean;
    policyCoverageComplete: boolean;
    scopeRelation: ScopeRelation;
    sourceHashMatches: boolean;
    decisionsApproved: boolean;
    evidenceFormal: boolean;
    commitRequested?: boolean;
    commitComplete?: boolean;
    publishApplicable?: boolean;
    publishComplete?: boolean;
}
export interface CompletionSummary {
    implementation: "pending" | "complete";
    verification: "pending" | "passed" | "failed";
    workflow: "pending" | "complete" | "blocked";
    commit: "not-requested" | "pending" | "complete";
    publish: "not-applicable" | "pending" | "complete";
    validFor: Array<"local-review" | "task-completion" | "formal-completion">;
    formalCompletionAllowed: boolean;
    blockers: string[];
}
export declare function auditCompletion(input: CompletionAuditInput): CompletionSummary;
