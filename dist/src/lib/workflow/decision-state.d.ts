import type { DecisionCatalogVersion } from "../agents/decision-points.ts";
export declare const DECISION_STATE_FILE_NAME = ".coding-plugins-decisions.json";
export type DecisionStatusValue = "requested" | "approved" | "stale";
export type DecisionAuditTarget = "execute" | "commit" | "tag" | "release" | "publish";
export interface DecisionRecord {
    feature: string;
    doc_id: string;
    id: string;
    status: DecisionStatusValue;
    reason: string;
    requested_at?: string;
    approved_at?: string;
    catalog_version?: DecisionCatalogVersion;
    artifact_hashes?: Record<string, string>;
    approved_bundle_hash?: string;
    required_policy_hash?: string;
    stale_reason?: string;
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
export interface DecisionBundleInput {
    artifacts: Record<string, string>;
    requiredPolicies?: unknown[];
    requiredSkills?: unknown[];
    advisorySkills?: unknown[];
    approvedWaivers?: string[];
}
export interface DecisionV2Result {
    feature: string;
    doc_id: string;
    id: string;
    catalog_version: "governed-v2";
    status: "approved" | "stale" | "missing";
    approved: boolean;
    approved_bundle_hash?: string;
    required_policy_hash?: string;
    stale_reason?: string;
}
export declare function computeDecisionBundleHash(bundle: DecisionBundleInput): string;
export declare function approveDecisionV2(root: string, options: {
    feature: string;
    docId: string;
    id: "DP-1" | "DP-2" | "DP-3";
    bundle: DecisionBundleInput;
    reason: string;
}): DecisionV2Result;
export declare function auditDecisionV2(root: string, options: {
    feature: string;
    docId: string;
    id: "DP-1" | "DP-2" | "DP-3";
    bundle: DecisionBundleInput;
}): DecisionV2Result;
