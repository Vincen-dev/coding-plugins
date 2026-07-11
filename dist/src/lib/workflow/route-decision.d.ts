import type { WorkflowDiagnostic } from "./diagnostics.ts";
import type { IntentClassification, ScopeKnowledge } from "./intent-classifier.ts";
export type UserFlow = "inspect" | "change" | "governed-change";
export interface RouteDecisionV2 {
    schemaVersion: "2.0";
    flow: UserFlow;
    state: string;
    scope: {
        knowledge: ScopeKnowledge;
        relation: "within-scope" | "expanded" | "new-change" | "uncertain";
    };
    next: {
        action: string;
        skill?: string;
        command?: {
            name: "task";
            args: string[];
        };
    };
    allowedActions: string[];
    blockedActions: string[];
    diagnostics: WorkflowDiagnostic[];
}
export declare function decideRoute(classification: IntentClassification): RouteDecisionV2;
