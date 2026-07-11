import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function policyBundle(overrides = {}) {
  return {
    profile: "typescript",
    required: [
      { id: "POL-ARCH-001", version: "1", level: "required", source: { kind: "repository", ref: "tests/arch.test.mjs" }, verification: [] },
      { id: "POL-TDD-001", version: "1", level: "required", source: { kind: "repository", ref: "skills/tdd.md" }, verification: [] },
    ],
    recommended: [],
    informative: [],
    skillBindings: [{
      name: "test-driven-development",
      source: "versioned-plugin",
      version: "1.1.1",
      appliesPolicyIds: ["POL-TDD-001"],
      requiredForExecution: true,
      portable: true,
    }],
    conflicts: [],
    missingSources: [],
    requiredPolicyHash: "sha256:policy",
    ...overrides,
  };
}

function approvalInput(overrides = {}) {
  return {
    tsd: { status: "review-ready", text: "TSD", policyDesignIds: ["POL-ARCH-001", "POL-TDD-001"] },
    tvd: { status: "review-ready", text: "TVD", policyTestIds: ["POL-ARCH-001", "POL-TDD-001"] },
    policyBundle: policyBundle(),
    waivers: [],
    ...overrides,
  };
}

test("REQ-007 blocks incomplete design, test, source, conflict, skill, and waiver inputs", () => {
  assert.equal(typeof workflow.auditTechnicalBundle, "function", "technical approval audit is missing");

  const result = workflow.auditTechnicalBundle(approvalInput({
    tsd: { status: "draft", text: "TSD", policyDesignIds: ["POL-ARCH-001"] },
    tvd: { status: "draft", text: "TVD", policyTestIds: ["POL-TDD-001"] },
    policyBundle: policyBundle({
      conflicts: ["POL-ARCH-001<->POL-TDD-001"],
      missingSources: ["POL-ARCH-001"],
      skillBindings: [{
        name: "personal-tdd",
        source: "personal",
        appliesPolicyIds: ["POL-TDD-001"],
        requiredForExecution: true,
        portable: false,
      }],
    }),
    waivers: [{ policyId: "POL-TDD-001", reason: "skip", approved: false }],
  }));

  assert.equal(result.ok, false);
  assert.deepEqual(result.blockers, [
    "POLICY_CONFLICT:POL-ARCH-001<->POL-TDD-001",
    "POLICY_DESIGN_MISSING:POL-TDD-001",
    "POLICY_SOURCE_MISSING:POL-ARCH-001",
    "POLICY_TEST_MISSING:POL-ARCH-001",
    "POLICY_WAIVER_UNAPPROVED:POL-TDD-001",
    "REQUIRED_SKILL_NON_PORTABLE:personal-tdd",
    "TSD_NOT_REVIEW_READY",
    "TVD_NOT_REVIEW_READY",
  ]);
});

test("REQ-007 approves a complete joint TSD/TVD policy bundle", () => {
  assert.equal(typeof workflow.auditTechnicalBundle, "function", "technical approval audit is missing");

  const result = workflow.auditTechnicalBundle(approvalInput());

  assert.equal(result.ok, true);
  assert.deepEqual(result.blockers, []);
  assert.match(result.approvalBundleHash, /^sha256:/);
  assert.equal(result.requiredPolicyHash, "sha256:policy");
});

test("REQ-007 governed-v2 templates expose policy design and TC-POL contracts", () => {
  const technicalTemplate = readFileSync(join(repoRoot, "skills/writing-technicals/templates/technical-design-document.md"), "utf8");
  const testTemplate = readFileSync(join(repoRoot, "skills/writing-test-cases/templates/test-cases.md"), "utf8");
  const metadataTemplate = readFileSync(join(repoRoot, "skills/document-metadata/templates/document-metadata.md"), "utf8");

  assert.match(technicalTemplate, /## Engineering Profile/);
  assert.match(technicalTemplate, /## Policy-to-Design Mapping/);
  assert.match(technicalTemplate, /## Skill Usage Plan/);
  assert.match(technicalTemplate, /## Policy Verification Gates/);
  assert.match(testTemplate, /TC-POL-/);
  assert.match(metadataTemplate, /workflow_schema: governed-v2/);
});
