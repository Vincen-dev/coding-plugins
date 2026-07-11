import { checkState } from "./project-state.ts";
import type { DecisionAuditResult } from "./decision-state.ts";
import type { WorkflowBriefPayload } from "./workflow-brief.ts";
import type { WorkflowGuardResult } from "./workflow-guard.ts";
import type { LegacyWorkflowProjection } from "./workflow-runtime.ts";
import type { RouteDecisionV2 } from "./route-decision.ts";
import type { WorkflowStateResult } from "./workflow-state.ts";
import type { ActiveChangeRecord } from "./active-change.ts";
export type TaskAction = "start" | "continue" | "status" | "brief";
export interface TaskStatusOptions {
    action: TaskAction;
    root: string;
    intent: string;
    feature?: string;
    docId?: string;
    changeId?: string;
    plannedFiles?: string[];
    taskCount?: number;
    featureCount?: number;
}
export interface TaskStatusPayload {
    entrypoint: string;
    action: TaskAction;
    conversation_judgment_allowed: false;
    reason: string;
    mode: LegacyWorkflowProjection;
    route_decision: RouteDecisionV2;
    active_change: ActiveChangeRecord | null;
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
    task_brief: TaskBriefPayload;
    warnings: string[];
}
export interface TaskBriefPayload {
    current_status: {
        feature: string | null;
        doc_id: string | null;
        state: string;
        decision_point: string | null;
        next_skill: string;
        allowed_actions: string[];
        blocked_actions: string[];
    };
    required_skills: string[];
    unique_next_step: boolean;
    unique_next_command: string | null;
    next_args: string[];
    blockers: string[];
    verification_requirements: string[];
    context_policy: string[];
}
export interface TaskStatusV2Payload extends RouteDecisionV2 {
    context: {
        feature: string | null;
        docId: string | null;
        decisionPoint: string | null;
        currentTask: string | null;
    };
    activeChange: ActiveChangeRecord | null;
    blockers: string[];
    warnings: string[];
}
export declare function buildTaskStatus(options: TaskStatusOptions): TaskStatusPayload;
export declare function buildTaskStatusV2(payload: TaskStatusPayload): TaskStatusV2Payload;
