import type { WorkflowDiagnostic } from "./diagnostics.ts";
import type { UserFlow } from "./route-decision.ts";
export interface ActiveChangeRecord {
    schemaVersion: 1;
    id: string;
    flow: UserFlow;
    feature?: string;
    docId?: string;
    intentFingerprint: string;
    scope: {
        plannedFiles?: string[];
        specIds?: string[];
        summary: string;
    };
    currentTaskId?: string;
    state: "drafting" | "approval-pending" | "ready" | "executing" | "needs-rescope" | "verifying" | "complete" | "archived";
    artifactRef?: string;
    updatedAt: string;
}
export interface ActiveChangeRestoreResult {
    record: ActiveChangeRecord | null;
    source: "explicit" | "cache" | "standard-change" | "none";
    diagnostics: WorkflowDiagnostic[];
}
export declare const ACTIVE_CHANGE_STATE_FILE = ".coding-plugins/runtime-state.json";
export declare function saveActiveChange(root: string, record: ActiveChangeRecord): string;
export declare function loadActiveChange(root: string): ActiveChangeRecord | null;
export declare function restoreActiveChange(root: string, options?: {
    changeId?: string;
}): ActiveChangeRestoreResult;
