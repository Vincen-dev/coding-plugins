export const WORKFLOW_DIAGNOSTIC_CODES = {
  ROUTE_SCOPE_UNKNOWN: {
    priority: 10,
    severity: "warning",
    message: "Scope size is unknown; no zero-value assumption was made.",
    remediation: "Provide planned files or task and feature counts when they are known.",
  },
  ROUTE_CONFLICT: {
    priority: 20,
    severity: "error",
    message: "Workflow inputs produced conflicting route constraints.",
    remediation: "Resolve the conflicting intent, scope, or document state before continuing.",
  },
  ACTIVE_CHANGE_AMBIGUOUS: {
    priority: 30,
    severity: "error",
    message: "More than one active change matches the request.",
    remediation: "Select an explicit change id, feature, or document id.",
  },
  SCOPE_EXPANDED: {
    priority: 40,
    severity: "error",
    message: "The requested work expands the approved scope.",
    remediation: "Rescope the active change or create a separate change.",
  },
  DECISION_STALE: {
    priority: 50,
    severity: "error",
    message: "An approved decision no longer matches its artifact bundle.",
    remediation: "Review the changed artifacts and approve the decision again.",
  },
  POLICY_SOURCE_NON_PORTABLE: {
    priority: 60,
    severity: "error",
    message: "A required policy source is not reproducible outside this machine.",
    remediation: "Move the rule into a repository policy or a versioned plugin source.",
  },
  POLICY_COVERAGE_MISSING: {
    priority: 70,
    severity: "error",
    message: "A required policy is missing design, test, task, or evidence coverage.",
    remediation: "Complete the policy coverage chain before approval or completion.",
  },
  EVIDENCE_NOT_FORMAL: {
    priority: 80,
    severity: "error",
    message: "The evidence is valid only for local review.",
    remediation: "Store evidence in a tracked formal artifact before claiming workflow completion.",
  },
  COMPLETION_BLOCKED: {
    priority: 90,
    severity: "error",
    message: "Completion requirements are not satisfied.",
    remediation: "Resolve the reported task, verification, policy, scope, hash, or decision blockers.",
  },
  COMPAT_PROJECTION_UNAVAILABLE: {
    priority: 100,
    severity: "error",
    message: "The v2 workflow state cannot be represented safely by the v1 contract.",
    remediation: "Request contract version 2 or migrate the consumer.",
  },
} as const;

export type WorkflowDiagnosticCode = keyof typeof WORKFLOW_DIAGNOSTIC_CODES;
export type WorkflowDiagnosticSeverity = "info" | "warning" | "error";

export interface WorkflowDiagnostic {
  code: string;
  severity: WorkflowDiagnosticSeverity;
  message: string;
  remediation?: string;
}

export function createWorkflowDiagnostic(code: WorkflowDiagnosticCode): WorkflowDiagnostic {
  const definition = WORKFLOW_DIAGNOSTIC_CODES[code];
  return {
    code,
    severity: definition.severity,
    message: definition.message,
    remediation: definition.remediation,
  };
}

export function sortWorkflowDiagnostics(diagnostics: WorkflowDiagnostic[]): WorkflowDiagnostic[] {
  return [...diagnostics].sort((left, right) => {
    const leftPriority = left.code in WORKFLOW_DIAGNOSTIC_CODES
      ? WORKFLOW_DIAGNOSTIC_CODES[left.code as WorkflowDiagnosticCode].priority
      : Number.MAX_SAFE_INTEGER;
    const rightPriority = right.code in WORKFLOW_DIAGNOSTIC_CODES
      ? WORKFLOW_DIAGNOSTIC_CODES[right.code as WorkflowDiagnosticCode].priority
      : Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority || left.code.localeCompare(right.code);
  });
}
