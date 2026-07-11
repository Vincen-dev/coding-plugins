import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

function record(overrides = {}) {
  return {
    schemaVersion: 1,
    id: "ui-refresh",
    flow: "change",
    intentFingerprint: "sha256:intent",
    scope: {
      plannedFiles: ["src/ui/button.ts"],
      specIds: ["REQ-001"],
      summary: "refresh button UI",
    },
    state: "executing",
    updatedAt: "2026-07-11T00:00:00.000Z",
    ...overrides,
  };
}

test("REQ-003 restores an active change from cache and then from a formal change document", () => {
  assert.equal(typeof workflow.saveActiveChange, "function", "active change store is missing");
  assert.equal(typeof workflow.restoreActiveChange, "function", "active change recovery is missing");
  assert.equal(typeof workflow.writeStandardChangeDocument, "function", "standard change writer is missing");

  const root = mkdtempSync(join(tmpdir(), "workflow-active-change-"));
  try {
    workflow.saveActiveChange(root, record());
    const cached = workflow.restoreActiveChange(root);
    assert.equal(cached.source, "cache");
    assert.equal(cached.record.id, "ui-refresh");

    rmSync(join(root, ".coding-plugins/runtime-state.json"), { force: true });
    workflow.writeStandardChangeDocument(root, record());
    const reconstructed = workflow.restoreActiveChange(root);
    assert.equal(reconstructed.source, "standard-change");
    assert.equal(reconstructed.record.artifactRef, "docs/coding-plugins/changes/ui-refresh/change.md");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-003 blocks ambiguous document recovery", () => {
  assert.equal(typeof workflow.writeStandardChangeDocument, "function", "standard change writer is missing");
  assert.equal(typeof workflow.restoreActiveChange, "function", "active change recovery is missing");

  const root = mkdtempSync(join(tmpdir(), "workflow-active-ambiguous-"));
  try {
    workflow.writeStandardChangeDocument(root, record());
    workflow.writeStandardChangeDocument(root, record({ id: "second-change", intentFingerprint: "sha256:second" }));

    const result = workflow.restoreActiveChange(root);
    assert.equal(result.record, null);
    assert.deepEqual(result.diagnostics.map((item) => item.code), ["ACTIVE_CHANGE_AMBIGUOUS"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-003 classifies within-scope, expanded, new-change, and uncertain requests", () => {
  assert.equal(typeof workflow.classifyScopeRelation, "function", "scope drift classifier is missing");
  const active = record();

  assert.equal(workflow.classifyScopeRelation(active, {
    plannedFiles: ["src/ui/button.ts"],
    specIds: ["REQ-001"],
  }), "within-scope");
  assert.equal(workflow.classifyScopeRelation(active, {
    plannedFiles: ["src/ui/button.ts", "src/public-api.ts"],
    riskSignals: ["public-api"],
  }), "expanded");
  assert.equal(workflow.classifyScopeRelation(record({ state: "complete" }), {
    summary: "optimize database performance",
  }), "new-change");
  assert.equal(workflow.classifyScopeRelation(active, {}), "uncertain");
});
