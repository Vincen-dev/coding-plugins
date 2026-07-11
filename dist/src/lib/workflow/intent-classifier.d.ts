export type IntentKind = "inspect" | "change" | "continue" | "approve" | "complete";
export type ScopeKnowledge = "known" | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export interface IntentClassificationOptions {
    plannedFiles?: string[];
    taskCount?: number;
    featureCount?: number;
}
export interface IntentClassification {
    intentKind: IntentKind;
    requestedAction: string;
    scopeKnowledge: ScopeKnowledge;
    riskLevel: RiskLevel;
    riskSignals: string[];
    confidence: "certain" | "uncertain";
}
export declare function classifyIntent(intent: string, options?: IntentClassificationOptions): IntentClassification;
