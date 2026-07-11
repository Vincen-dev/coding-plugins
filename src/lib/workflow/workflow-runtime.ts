import { classifyIntent } from "./intent-classifier.ts";
import type { IntentClassificationOptions } from "./intent-classifier.ts";
import { createWorkflowDiagnostic } from "./diagnostics.ts";
import { decideRoute } from "./route-decision.ts";
import type { RouteDecisionV2 } from "./route-decision.ts";

export type LegacyWorkflowMode =
  | "analysis-only"
  | "docs-only"
  | "tdd-only"
  | "full-chain"
  | "maintenance-chain";

export interface LegacyWorkflowProjection {
  mode: LegacyWorkflowMode;
  explicit: false;
  reason: string;
}

export interface WorkflowRuntimeResult {
  decision: RouteDecisionV2;
  v1: LegacyWorkflowProjection;
}

function hasMaintenanceProfile(decision: RouteDecisionV2, riskSignals: string[]): boolean {
  return decision.flow === "governed-change"
    && riskSignals.some((signal) => ["migration", "compatibility", "security", "release", "sdk"].includes(signal));
}

export function projectRouteDecisionV1(
  decision: RouteDecisionV2,
  riskSignals: string[] = [],
): LegacyWorkflowProjection {
  const overlap = decision.allowedActions.some((action) => decision.blockedActions.includes(action));
  if (overlap) {
    const diagnostic = createWorkflowDiagnostic("COMPAT_PROJECTION_UNAVAILABLE");
    throw new Error(`${diagnostic.code}: ${diagnostic.message}`);
  }
  if (decision.flow === "inspect") {
    return { mode: "analysis-only", explicit: false, reason: "v2 Inspect projected to legacy analysis-only" };
  }
  if (decision.flow === "change") {
    return { mode: "tdd-only", explicit: false, reason: "v2 Change projected to legacy tdd-only" };
  }
  return hasMaintenanceProfile(decision, riskSignals)
    ? { mode: "maintenance-chain", explicit: false, reason: "v2 Governed Change maintenance profile projected to legacy maintenance-chain" }
    : { mode: "full-chain", explicit: false, reason: "v2 Governed Change projected to legacy full-chain" };
}

export function evaluateWorkflowRuntime(
  intent: string,
  options: IntentClassificationOptions = {},
): WorkflowRuntimeResult {
  const classification = classifyIntent(intent, options);
  const decision = decideRoute(classification);
  return {
    decision,
    v1: projectRouteDecisionV1(decision, classification.riskSignals),
  };
}
