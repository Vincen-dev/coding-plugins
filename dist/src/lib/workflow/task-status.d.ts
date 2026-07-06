import { checkState } from "./project-state.ts";
import type { DecisionAuditResult } from "./decision-state.ts";
import type { WorkflowBriefPayload } from "./workflow-brief.ts";
import type { WorkflowGuardResult } from "./workflow-guard.ts";
import { inferMode } from "./workflow-mode.ts";
import type { WorkflowStateResult } from "./workflow-state.ts";
export type TaskAction = "start" | "continue" | "status";
export interface TaskStatusOptions {
    action: TaskAction;
    root: string;
    intent: string;
    feature?: string;
    docId?: string;
}
export interface TaskStatusPayload {
    entrypoint: string;
    action: TaskAction;
    conversation_judgment_allowed: false;
    reason: string;
    mode: ReturnType<typeof inferMode>;
    project_state: ReturnType<typeof checkState> | null;
    workflow_state: WorkflowStateResult | null;
    guard: WorkflowGuardResult | null;
    brief: WorkflowBriefPayload | null;
    decision_status: DecisionAuditResult | null;
    feature: string | null;
    doc_id: string | null;
    state: string;
    allowed_actions: string[];
    blocked_actions: string[];
    next_skill: string;
    decision_point: string | null;
    next_command: string | null;
    next_args: string[];
    warnings: string[];
}
export declare function buildTaskStatus(options: TaskStatusOptions): TaskStatusPayload;
