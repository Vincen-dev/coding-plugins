import type { WorkflowMode } from "./workflow-mode.ts";
export type ScopeRequiredAction = "continue" | "reroute-workflow" | "split-task" | "upgrade-to-maintenance-chain";
export interface ScopeViolation {
    id: "docs-only-scope-expanded" | "multiple-features-detected" | "release-scope-expanded";
    message: string;
    required_action: ScopeRequiredAction;
    recommended_mode: WorkflowMode;
    blocked_actions: string[];
}
export interface ScopeCheckOptions {
    mode: WorkflowMode;
    intent: string;
    plannedFiles?: string[];
    actualFiles?: string[];
    taskCount?: number;
    featureCount?: number;
    actions?: string[];
}
export interface ScopeCheckResult {
    ok: boolean;
    mode: WorkflowMode;
    recommended_mode: WorkflowMode;
    required_action: ScopeRequiredAction;
    planned_files: string[];
    actual_files: string[];
    task_count: number;
    feature_count: number;
    actions: string[];
    violations: ScopeViolation[];
    blocked_actions: string[];
}
export declare function checkScope(options: ScopeCheckOptions): ScopeCheckResult;
