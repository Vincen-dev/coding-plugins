import type { WorkflowStateResult } from "./workflow-state.ts";
export declare const VALID_TARGETS: Set<string>;
interface NextContext {
    must_read: string[];
    may_skip: string[];
    focus_sections: string[];
    execution_source: string;
    new_plan_policy: string;
}
export interface WorkflowGuardResult {
    pass: boolean;
    target: string;
    feature: string;
    doc_id: string;
    state: string;
    next_skill: string;
    reason: string;
    missing_artifacts: string[];
    stale: boolean;
    failures: string[];
    next_context: NextContext;
}
export declare function parseExecutionLock(text: string): Record<string, string> | null;
export declare function validateExecutionLock(path: string): string[];
export declare function validateExecutionSections(path: string): string[];
export declare function buildNextContext(state: WorkflowStateResult, options: {
    target: string;
    passed: boolean;
}): NextContext;
export declare function checkWorkflowGuard(root: string, options: {
    feature: string;
    docId: string;
    target: string;
}): WorkflowGuardResult;
export {};
