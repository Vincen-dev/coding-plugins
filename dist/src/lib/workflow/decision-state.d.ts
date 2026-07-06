export declare const DECISION_STATE_FILE_NAME = ".coding-plugins-decisions.json";
export type DecisionStatusValue = "requested" | "approved";
export type DecisionAuditTarget = "execute" | "commit" | "tag" | "release" | "publish";
export interface DecisionRecord {
    feature: string;
    doc_id: string;
    id: string;
    status: DecisionStatusValue;
    reason: string;
    requested_at?: string;
    approved_at?: string;
}
export interface DecisionStateFile {
    schema_version: number;
    decisions: DecisionRecord[];
}
export interface DecisionStatusResult {
    feature: string;
    doc_id: string;
    id: string;
    status: DecisionStatusValue | "missing";
    approved: boolean;
    point: Record<string, unknown>;
    record: DecisionRecord | null;
    blocked_actions: string[];
}
export interface DecisionAuditResult {
    ok: boolean;
    approved: boolean;
    feature: string;
    doc_id: string;
    target: DecisionAuditTarget;
    required_decision: string | null;
    required_decisions: string[];
    missing_decisions: string[];
    decisions: DecisionStatusResult[];
    blocked_actions: string[];
}
export declare function requiredDecisionsForTarget(target: DecisionAuditTarget): string[];
export declare function getDecisionStatus(root: string, options: {
    feature: string;
    docId: string;
    id: string;
}): DecisionStatusResult;
export declare function requestDecision(root: string, options: {
    feature: string;
    docId: string;
    id: string;
    reason?: string;
}): DecisionStatusResult;
export declare function approveDecision(root: string, options: {
    feature: string;
    docId: string;
    id: string;
    reason?: string;
}): DecisionStatusResult;
export declare function auditDecisions(root: string, options: {
    feature: string;
    docId: string;
    target: DecisionAuditTarget;
}): DecisionAuditResult;
