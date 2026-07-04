export declare const VALID_MODES: Set<string>;
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
export {};
