export declare const VALID_MODES: Set<string>;
export * from "./diagnostics.ts";
export * from "./intent-classifier.ts";
export * from "./route-decision.ts";
export * from "./workflow-runtime.ts";
export * from "./active-change.ts";
export * from "./scope-drift.ts";
export * from "../documents/change-document.ts";
export * from "./policy-resolver.ts";
export * from "./technical-approval.ts";
export * from "./policy-coverage.ts";
export * from "./completion-state.ts";
export type WorkflowMode = "analysis-only" | "docs-only" | "tdd-only" | "full-chain" | "maintenance-chain";
export interface WorkflowModeResult {
    mode: WorkflowMode;
    explicit: boolean;
    reason: string;
}
interface InferModeOptions {
    files?: string[];
    taskCount?: number;
    explicitMode?: string;
}
export declare function inferMode(intent: string, options?: InferModeOptions): WorkflowModeResult;
