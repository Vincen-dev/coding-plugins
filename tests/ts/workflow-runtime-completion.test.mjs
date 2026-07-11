import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";
import { buildResult } from "../../src/lib/documents/validate-tdd-evidence.ts";
import { artifactPath, computeUpstreamHash, inspectDocumentChain } from "../../src/lib/workflow/workflow-state.ts";

function validEvidence() {
  return [
    "# Evidence",
    "",
    "## TDD 证据",
    "",
    "- **规格/缺陷/验收:** REQ-009",
    "- **测试类型:** contract",
    "- **RED 测试:** `unit-evidence-contract`",
    "- **RED 命令:** `node --test evidence-contract`",
    "- **RED 失败:** AssertionError because eligibility fields were absent.",
    "- **GREEN 变更:** Added explicit eligibility fields.",
    "- **GREEN 命令:** `node --test evidence-contract` PASS",
    "- **REFACTOR 命令:** `node --test evidence-contract` PASS",
    "- **最终验证:** `node --test evidence-contract` PASS",
    "",
  ].join("\n");
}

test("REQ-009 separates TDD content validity from formal evidence eligibility", () => {
  const root = mkdtempSync(join(tmpdir(), "workflow-evidence-eligibility-"));
  try {
    const evidence = join(root, "docs/coding-plugins/features/alpha/evidences/alpha-VED.md");
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(evidence, validEvidence(), "utf8");

    const tracked = buildResult(evidence, { strict: true, root, artifactMode: "tracked" });
    assert.equal(tracked.content_valid, true);
    assert.equal(tracked.formal_completion_allowed, true);
    assert.deepEqual(tracked.valid_for, ["local-review", "task-completion", "formal-completion"]);

    writeFileSync(join(root, ".gitignore"), "docs/coding-plugins/features/*\n", "utf8");
    const ignored = buildResult(evidence, { strict: true, root, artifactMode: "tracked" });
    assert.equal(ignored.content_valid, true);
    assert.equal(ignored.formal_completion_allowed, false);
    assert.deepEqual(ignored.valid_for, ["local-review"]);
    assert.ok(ignored.errors.some((error) => error.includes("ignored evidence")));

    const local = buildResult(evidence, { strict: true, root, artifactMode: "local" });
    assert.equal(local.content_valid, true);
    assert.equal(local.formal_completion_allowed, false);
    assert.deepEqual(local.valid_for, ["local-review"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-009 completion audit reports dimensions and blocks every formal dependency", () => {
  assert.equal(typeof workflow.auditCompletion, "function", "completion audit is missing");

  const complete = workflow.auditCompletion({
    tasksComplete: true,
    testsPassed: true,
    policyCoverageComplete: true,
    scopeRelation: "within-scope",
    sourceHashMatches: true,
    decisionsApproved: true,
    evidenceFormal: true,
  });
  assert.deepEqual(complete, {
    implementation: "complete",
    verification: "passed",
    workflow: "complete",
    commit: "not-requested",
    publish: "not-applicable",
    validFor: ["local-review", "task-completion", "formal-completion"],
    formalCompletionAllowed: true,
    blockers: [],
  });

  const blocked = workflow.auditCompletion({
    tasksComplete: false,
    testsPassed: false,
    policyCoverageComplete: false,
    scopeRelation: "expanded",
    sourceHashMatches: false,
    decisionsApproved: false,
    evidenceFormal: false,
  });
  assert.equal(blocked.workflow, "blocked");
  assert.equal(blocked.formalCompletionAllowed, false);
  assert.deepEqual(blocked.blockers, [
    "DECISION_STALE",
    "EVIDENCE_NOT_FORMAL",
    "POLICY_COVERAGE_MISSING",
    "SCOPE_EXPANDED",
    "SOURCE_HASH_STALE",
    "TASKS_INCOMPLETE",
    "TESTS_FAILED",
  ]);
});

test("REQ-009 VED frontmatter alone cannot bypass the completion audit", () => {
  const root = mkdtempSync(join(tmpdir(), "workflow-state-complete-"));
  try {
    const context = { feature: "alpha", docId: "alpha-change" };
    for (const suffix of ["PRD", "TSD", "TVD"]) {
      const path = artifactPath(root, { ...context, suffix });
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `---\ntitle: ${suffix}\nstatus: approved\nfeature: alpha\ndoc_id: alpha-change\n---\n# ${suffix}\n`, "utf8");
    }
    const sourceHash = computeUpstreamHash(root, context);
    const ted = artifactPath(root, { ...context, suffix: "TED" });
    mkdirSync(dirname(ted), { recursive: true });
    writeFileSync(ted, `---\ntitle: TED\nstatus: approved\nfeature: alpha\ndoc_id: alpha-change\nsource_hash: ${sourceHash}\n---\n# TED\n`, "utf8");
    const ved = artifactPath(root, { ...context, suffix: "VED" });
    mkdirSync(dirname(ved), { recursive: true });
    writeFileSync(ved, "---\ntitle: VED\nstatus: complete\nfeature: alpha\ndoc_id: alpha-change\n---\n# VED\n", "utf8");

    const pending = inspectDocumentChain(root, context);
    assert.equal(pending.state, "completion-pending");
    assert.equal(pending.next_skill, "verification-before-completion");

    const blocked = inspectDocumentChain(root, context, {
      completion: workflow.auditCompletion({
        tasksComplete: true,
        testsPassed: false,
        policyCoverageComplete: true,
        scopeRelation: "within-scope",
        sourceHashMatches: true,
        decisionsApproved: true,
        evidenceFormal: true,
      }),
    });
    assert.equal(blocked.state, "completion-blocked");
    assert.deepEqual(blocked.completion.blockers, ["TESTS_FAILED"]);

    const result = inspectDocumentChain(root, context, {
      completion: workflow.auditCompletion({
        tasksComplete: true,
        testsPassed: true,
        policyCoverageComplete: true,
        scopeRelation: "within-scope",
        sourceHashMatches: true,
        decisionsApproved: true,
        evidenceFormal: true,
      }),
    });
    assert.equal(result.state, "complete");
    assert.equal(result.next_skill, "verification-before-completion");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
