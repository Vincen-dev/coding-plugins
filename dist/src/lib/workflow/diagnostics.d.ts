export declare const WORKFLOW_DIAGNOSTIC_CODES: {
    readonly ROUTE_SCOPE_UNKNOWN: {
        readonly priority: 10;
        readonly severity: "warning";
        readonly message: "Scope size is unknown; no zero-value assumption was made.";
        readonly remediation: "Provide planned files or task and feature counts when they are known.";
    };
    readonly ROUTE_CONFLICT: {
        readonly priority: 20;
        readonly severity: "error";
        readonly message: "Workflow inputs produced conflicting route constraints.";
        readonly remediation: "Resolve the conflicting intent, scope, or document state before continuing.";
    };
    readonly ACTIVE_CHANGE_AMBIGUOUS: {
        readonly priority: 30;
        readonly severity: "error";
        readonly message: "More than one active change matches the request.";
        readonly remediation: "Select an explicit change id, feature, or document id.";
    };
    readonly SCOPE_EXPANDED: {
        readonly priority: 40;
        readonly severity: "error";
        readonly message: "The requested work expands the approved scope.";
        readonly remediation: "Rescope the active change or create a separate change.";
    };
    readonly DECISION_STALE: {
        readonly priority: 50;
        readonly severity: "error";
        readonly message: "An approved decision no longer matches its artifact bundle.";
        readonly remediation: "Review the changed artifacts and approve the decision again.";
    };
    readonly POLICY_SOURCE_NON_PORTABLE: {
        readonly priority: 60;
        readonly severity: "error";
        readonly message: "A required policy source is not reproducible outside this machine.";
        readonly remediation: "Move the rule into a repository policy or a versioned plugin source.";
    };
    readonly POLICY_COVERAGE_MISSING: {
        readonly priority: 70;
        readonly severity: "error";
        readonly message: "A required policy is missing design, test, task, or evidence coverage.";
        readonly remediation: "Complete the policy coverage chain before approval or completion.";
    };
    readonly EVIDENCE_NOT_FORMAL: {
        readonly priority: 80;
        readonly severity: "error";
        readonly message: "The evidence is valid only for local review.";
        readonly remediation: "Store evidence in a tracked formal artifact before claiming workflow completion.";
    };
    readonly COMPLETION_BLOCKED: {
        readonly priority: 90;
        readonly severity: "error";
        readonly message: "Completion requirements are not satisfied.";
        readonly remediation: "Resolve the reported task, verification, policy, scope, hash, or decision blockers.";
    };
    readonly COMPAT_PROJECTION_UNAVAILABLE: {
        readonly priority: 100;
        readonly severity: "error";
        readonly message: "The v2 workflow state cannot be represented safely by the v1 contract.";
        readonly remediation: "Request contract version 2 or migrate the consumer.";
    };
};
export type WorkflowDiagnosticCode = keyof typeof WORKFLOW_DIAGNOSTIC_CODES;
export type WorkflowDiagnosticSeverity = "info" | "warning" | "error";
export interface WorkflowDiagnostic {
    code: string;
    severity: WorkflowDiagnosticSeverity;
    message: string;
    remediation?: string;
}
export declare function createWorkflowDiagnostic(code: WorkflowDiagnosticCode): WorkflowDiagnostic;
export declare function sortWorkflowDiagnostics(diagnostics: WorkflowDiagnostic[]): WorkflowDiagnostic[];
