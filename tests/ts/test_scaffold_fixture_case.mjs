import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { scaffoldFixtureCase } from "../../src/lib/scaffold-fixture-case.ts";
import { inspectDocumentChain } from "../../src/lib/workflow-state.ts";

function scaffold(root, overrides = {}) {
  return scaffoldFixtureCase(root, {
    feature: "cache-fixture",
    docId: "cache-refresh",
    title: "缓存刷新",
    caseId: "CASE-CACHE-999",
    sourceType: "release_regression",
    sourceReference: "coding-plugins cache refresh",
    optimizationTarget: "验证缓存刷新链路闭环",
    coveredRisk: "缓存未刷新导致 Codex 使用旧链路",
    currentDate: "2026-07-02",
    ...overrides,
  });
}

test("TypeScript scaffold creates case index and valid document chain", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-scaffold-fixture-"));
  try {
    scaffold(root);
    const featureRoot = join(root, "docs/coding-plugins/features/cache-fixture");

    for (const path of [
      "CASE-INDEX.md",
      "docs/coding-plugins/features/cache-fixture/README.md",
      "docs/coding-plugins/features/cache-fixture/requirements/cache-refresh-PRD.md",
      "docs/coding-plugins/features/cache-fixture/technicals/cache-refresh-TDD.md",
      "docs/coding-plugins/features/cache-fixture/technicals/cache-refresh-TID.md",
      "docs/coding-plugins/features/cache-fixture/test-cases/cache-refresh-TCD.md",
      "docs/coding-plugins/features/cache-fixture/plans/cache-refresh-IPD.md",
      "docs/coding-plugins/features/cache-fixture/evidences/cache-refresh-TED.md",
    ]) {
      assert.equal(existsSync(join(root, path)), true, `missing ${path}`);
    }

    const caseIndex = readFileSync(join(root, "CASE-INDEX.md"), "utf8");
    assert.ok(caseIndex.includes("## cache-fixture"));
    assert.ok(caseIndex.includes("case_id: CASE-CACHE-999"));

    const ipdText = readFileSync(join(featureRoot, "plans/cache-refresh-IPD.md"), "utf8");
    assert.ok(ipdText.includes("source_hash: sha256:"));
    assert.ok(ipdText.includes("## 执行锁定区"));
    assert.ok(ipdText.includes("## 执行简报"));
    assert.ok(ipdText.includes("## 任务总览"));
    assert.ok(ipdText.includes("## 缓存刷新（TASK-001 / REQ-001）"));

    const state = inspectDocumentChain(root, { feature: "cache-fixture", docId: "cache-refresh" });
    assert.equal(state.state, "ready-for-execution");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript scaffold rejects nested feature or doc id", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-scaffold-fixture-invalid-"));
  try {
    assert.throws(() => scaffold(root, { feature: "area/cache" }), /feature must be a flat slug/);
    assert.throws(() => scaffold(root, { docId: "cache/refresh" }), /doc_id must be a flat slug/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
