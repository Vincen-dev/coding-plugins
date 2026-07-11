import type { DecisionAuditResult, DecisionStatusResult, DecisionV2Result } from "./decision-state.ts";
import type { CompletionSummary } from "./completion-state.ts";
export type WorkflowSchema = "governed-v1" | "governed-v2";
export interface GovernedApprovalResult {
    ok: boolean;
    blockers: string[];
    decision: DecisionStatusResult | DecisionV2Result | null;
}
export interface FormalCompletionResult extends CompletionSummary {
    feature: string;
    docId: string;
    workflowSchema: WorkflowSchema;
    evidenceErrors: string[];
    policyBlockers: string[];
}
export declare function workflowSchema(root: string, options: {
    feature: string;
    docId: string;
}): WorkflowSchema;
export declare function approveGovernedDecision(root: string, options: {
    feature: string;
    docId: string;
    id: "DP-1" | "DP-2" | "DP-3";
    reason: string;
}): GovernedApprovalResult;
export declare function auditGovernedExecution(root: string, options: {
    feature: string;
    docId: string;
}): DecisionAuditResult;
export declare function auditFormalCompletion(root: string, options: {
    feature: string;
    docId: string;
}): FormalCompletionResult;
