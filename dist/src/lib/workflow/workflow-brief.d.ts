import { VALID_TARGETS } from "./workflow-guard.ts";
export { VALID_TARGETS };
interface BriefOptions {
    feature: string;
    docId: string;
    target?: string;
    task?: string;
}
export interface WorkflowBriefPayload {
    pass: boolean;
    feature: string;
    doc_id: string;
    target: string;
    current_task?: string | null;
    state: string;
    reason: string;
    next_skill: string;
    failures: string[];
    must_read: string[];
    may_skip: string[];
    focus_sections: string[];
    task_headings: string[];
    required_policy_ids: string[];
    required_skills: string[];
    execution_source: string;
    new_plan_policy: string;
}
export declare function extractTaskHeadings(text: string): string[];
export declare function extractTaskPolicyContext(text: string, taskId: string): {
    policyIds: string[];
    skills: string[];
};
export declare function buildBrief(root: string, options: BriefOptions): WorkflowBriefPayload;
export declare function formatPlain(payload: WorkflowBriefPayload): string;
