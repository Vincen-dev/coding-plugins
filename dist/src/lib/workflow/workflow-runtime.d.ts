import type { IntentClassificationOptions } from "./intent-classifier.ts";
import type { RouteDecisionV2 } from "./route-decision.ts";
export type LegacyWorkflowMode = "analysis-only" | "docs-only" | "tdd-only" | "full-chain" | "maintenance-chain";
export interface LegacyWorkflowProjection {
    mode: LegacyWorkflowMode;
    explicit: false;
    reason: string;
}
export interface WorkflowRuntimeResult {
    decision: RouteDecisionV2;
    v1: LegacyWorkflowProjection;
}
export declare function projectRouteDecisionV1(decision: RouteDecisionV2, riskSignals?: string[]): LegacyWorkflowProjection;
export declare function evaluateWorkflowRuntime(intent: string, options?: IntentClassificationOptions): WorkflowRuntimeResult;
