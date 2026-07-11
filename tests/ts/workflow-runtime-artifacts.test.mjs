import assert from "node:assert/strict";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

test("REQ-004 selects zero, one, or governed document profiles", () => {
  assert.equal(typeof workflow.selectArtifactProfile, "function", "artifact profile selector is missing");

  assert.equal(workflow.selectArtifactProfile({ flow: "inspect" }), "none");
  assert.equal(workflow.selectArtifactProfile({ flow: "change", multiTurn: false }), "quick");
  assert.equal(workflow.selectArtifactProfile({ flow: "change", multiTurn: true }), "standard");
  assert.equal(workflow.selectArtifactProfile({ flow: "governed-change" }), "governed");
});

test("REQ-004 standard change is one document with the required sections", () => {
  assert.equal(typeof workflow.renderStandardChangeDocument, "function", "standard change renderer is missing");
  assert.equal(typeof workflow.validateStandardChangeDocument, "function", "standard change validator is missing");

  const text = workflow.renderStandardChangeDocument({
    schemaVersion: 1,
    id: "ui-refresh",
    flow: "change",
    intentFingerprint: "sha256:intent",
    scope: { summary: "refresh button UI" },
    state: "drafting",
    updatedAt: "2026-07-11T00:00:00.000Z",
  });

  assert.deepEqual(workflow.validateStandardChangeDocument(text), []);
  for (const heading of ["Intent", "Acceptance", "Scope", "Tasks", "Decisions", "Evidence", "Completion"]) {
    assert.match(text, new RegExp(`^## ${heading}$`, "m"));
  }
});
