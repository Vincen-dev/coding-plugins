import type { ActiveChangeRecord } from "./active-change.ts";
export type ScopeRelation = "within-scope" | "expanded" | "new-change" | "uncertain";
export interface ScopeRequest {
    summary?: string;
    plannedFiles?: string[];
    specIds?: string[];
    riskSignals?: string[];
    independentGoal?: boolean;
}
export declare function classifyScopeRelation(active: ActiveChangeRecord, request: ScopeRequest): ScopeRelation;
