import assert from "node:assert/strict";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

test("OBS-001 exposes registered stable diagnostics with remediation", () => {
  assert.equal(typeof workflow.createWorkflowDiagnostic, "function", "diagnostics contract is missing");
  assert.equal(typeof workflow.WORKFLOW_DIAGNOSTIC_CODES, "object", "diagnostic registry is missing");

  const diagnostic = workflow.createWorkflowDiagnostic("ROUTE_SCOPE_UNKNOWN");

  assert.deepEqual(diagnostic, {
    code: "ROUTE_SCOPE_UNKNOWN",
    severity: "warning",
    message: "Scope size is unknown; no zero-value assumption was made.",
    remediation: "Provide planned files or task and feature counts when they are known.",
  });
});

test("OBS-001 sorts multiple diagnostics deterministically by registry priority", () => {
  assert.equal(typeof workflow.sortWorkflowDiagnostics, "function", "diagnostic sorting contract is missing");

  const diagnostics = workflow.sortWorkflowDiagnostics([
    { code: "COMPLETION_BLOCKED", severity: "error", message: "blocked" },
    { code: "ROUTE_SCOPE_UNKNOWN", severity: "warning", message: "unknown" },
    { code: "ACTIVE_CHANGE_AMBIGUOUS", severity: "error", message: "ambiguous" },
  ]);

  assert.deepEqual(diagnostics.map((item) => item.code), [
    "ROUTE_SCOPE_UNKNOWN",
    "ACTIVE_CHANGE_AMBIGUOUS",
    "COMPLETION_BLOCKED",
  ]);
});
