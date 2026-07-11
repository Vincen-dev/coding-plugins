import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";
import { buildBrief } from "../../src/lib/workflow/workflow-brief.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("REQ-008 audits required Policy coverage across design, test, task, and evidence", () => {
  assert.equal(typeof workflow.auditPolicyCoverage, "function", "policy coverage audit is missing");

  const complete = workflow.auditPolicyCoverage({
    requiredPolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
    designPolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
    testPolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
    taskPolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
    evidencePolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
  });
  assert.equal(complete.ok, true);
  assert.deepEqual(complete.blockers, []);

  const missing = workflow.auditPolicyCoverage({
    requiredPolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
    designPolicyIds: ["POL-ARCH-001"],
    testPolicyIds: ["POL-TDD-001"],
    taskPolicyIds: ["POL-ARCH-001", "POL-TDD-001"],
    evidencePolicyIds: ["POL-ARCH-001"],
  });
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.blockers, [
    "POLICY_COVERAGE_MISSING:POL-ARCH-001:test",
    "POLICY_COVERAGE_MISSING:POL-TDD-001:design",
    "POLICY_COVERAGE_MISSING:POL-TDD-001:evidence",
  ]);
});

test("REQ-008 workflow brief returns only the current task Policy and Skill context", () => {
  const first = buildBrief(repoRoot, {
    feature: "workflow-runtime",
    docId: "workflow-simplification",
    target: "execute",
    task: "TASK-001",
  });
  const second = buildBrief(repoRoot, {
    feature: "workflow-runtime",
    docId: "workflow-simplification",
    target: "execute",
    task: "TASK-002",
  });

  assert.deepEqual(first.required_policy_ids, ["POL-ARCH-001", "POL-TDD-001"]);
  assert.deepEqual(first.required_skills, ["test-driven-development", "verification-before-completion"]);
  assert.deepEqual(second.required_policy_ids, ["POL-ARCH-001", "POL-COMPAT-001", "POL-TDD-001"]);
  assert.deepEqual(second.required_skills, ["test-driven-development"]);
  assert.equal(second.required_skills.includes("document-metadata"), false);
});
