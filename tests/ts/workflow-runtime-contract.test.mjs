import assert from "node:assert/strict";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

test("REQ-002 keeps omitted scope values unknown instead of coercing them to zero", () => {
  assert.equal(typeof workflow.classifyIntent, "function", "classifyIntent contract is missing");
  assert.equal(typeof workflow.decideRoute, "function", "decideRoute contract is missing");

  const classification = workflow.classifyIntent("修改按钮交互");
  const decision = workflow.decideRoute(classification);

  assert.equal(classification.scopeKnowledge, "unknown");
  assert.equal(decision.schemaVersion, "2.0");
  assert.equal(decision.scope.knowledge, "unknown");
  assert.equal("fileCount" in decision.scope, false);
  assert.equal("taskCount" in decision.scope, false);
});

test("REQ-002 produces a self-consistent route decision", () => {
  assert.equal(typeof workflow.classifyIntent, "function", "classifyIntent contract is missing");
  assert.equal(typeof workflow.decideRoute, "function", "decideRoute contract is missing");

  const decision = workflow.decideRoute(workflow.classifyIntent("开始实现按钮交互", {
    plannedFiles: ["src/button.ts"],
    taskCount: 1,
    featureCount: 1,
  }));
  const blocked = new Set(decision.blockedActions);

  assert.equal(decision.flow, "change");
  assert.equal(decision.scope.knowledge, "known");
  assert.equal(decision.allowedActions.some((action) => blocked.has(action)), false);
  assert.equal(decision.diagnostics.every((diagnostic) => typeof diagnostic.code === "string"), true);
});

test("REQ-002 evaluates v2 once and projects a compatible v1 mode", () => {
  assert.equal(typeof workflow.evaluateWorkflowRuntime, "function", "WorkflowRuntime contract is missing");
  assert.equal(typeof workflow.projectRouteDecisionV1, "function", "v1 projector contract is missing");

  const runtime = workflow.evaluateWorkflowRuntime("分析数据库 schema 应该怎么实现");

  assert.equal(runtime.decision.flow, "inspect");
  assert.equal(runtime.v1.mode, "analysis-only");
  assert.match(runtime.v1.reason, /projected/i);
});
