import { createWorkflowDiagnostic, sortWorkflowDiagnostics } from "./diagnostics.js";
function flowForClassification(classification) {
    if (classification.intentKind === "inspect") {
        return "inspect";
    }
    if (classification.riskLevel === "high") {
        return "governed-change";
    }
    return "change";
}
export function decideRoute(classification) {
    const flow = flowForClassification(classification);
    const diagnostics = classification.scopeKnowledge === "unknown"
        ? [createWorkflowDiagnostic("ROUTE_SCOPE_UNKNOWN")]
        : [];
    if (flow === "inspect") {
        return {
            schemaVersion: "2.0",
            flow,
            state: "inspect-ready",
            scope: { knowledge: classification.scopeKnowledge, relation: "uncertain" },
            next: { action: "answer-directly" },
            allowedActions: ["answer-directly"],
            blockedActions: ["execute-change", "start-governed-change"],
            diagnostics: sortWorkflowDiagnostics(diagnostics),
        };
    }
    if (flow === "governed-change") {
        return {
            schemaVersion: "2.0",
            flow,
            state: "governed-change-required",
            scope: { knowledge: classification.scopeKnowledge, relation: "uncertain" },
            next: {
                action: "start-governed-change",
                skill: "spec-driven-development",
                command: { name: "task", args: ["status", "--contract-version", "2"] },
            },
            allowedActions: ["start-governed-change", "inspect-governed-state"],
            blockedActions: ["execute-change"],
            diagnostics: sortWorkflowDiagnostics(diagnostics),
        };
    }
    return {
        schemaVersion: "2.0",
        flow,
        state: "change-ready",
        scope: {
            knowledge: classification.scopeKnowledge,
            relation: classification.scopeKnowledge === "known" ? "within-scope" : "uncertain",
        },
        next: { action: "define-scope-and-test", skill: "test-driven-development" },
        allowedActions: ["define-scope-and-test", "execute-change"],
        blockedActions: ["start-governed-execution"],
        diagnostics: sortWorkflowDiagnostics(diagnostics),
    };
}
