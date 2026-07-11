import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import * as catalog from "../../src/lib/decision-points.ts";
import * as state from "../../src/lib/workflow/decision-state.ts";

const bundle = (overrides = {}) => ({
  artifacts: { PRD: "status: approved\nREQ-001", TSD: "status: review-ready\nTD-001" },
  requiredPolicies: [{ id: "POL-001", version: "1", source: "policies/base.md" }],
  requiredSkills: [{ name: "test-driven-development", version: "1.1.1", portable: true }],
  advisorySkills: [{ name: "personal-helper", path: "/Users/example/skill" }],
  approvedWaivers: [],
  ...overrides,
});

test("REQ-005 keeps governed-v1 semantics and exposes a separate governed-v2 catalog", () => {
  assert.equal(typeof catalog.getDecisionCatalog, "function", "versioned decision catalog is missing");

  assert.equal(catalog.getDecisionPoint("DP-2").name, "技术方案批准");
  assert.equal(catalog.getDecisionPoint("DP-3").name, "测试用例批准");
  assert.equal(catalog.getDecisionPoint("DP-4").name, "执行计划批准");

  const v2 = catalog.getDecisionCatalog("governed-v2");
  assert.deepEqual(v2.map((point) => point.id), ["DP-1", "DP-2", "DP-3"]);
  assert.equal(v2[0].name, "范围批准");
  assert.equal(v2[1].name, "技术批准");
  assert.equal(v2[2].name, "执行批准");
});

test("REQ-005 hashes semantic required approval inputs and excludes advisory changes", () => {
  assert.equal(typeof state.computeDecisionBundleHash, "function", "decision bundle hash is missing");

  const first = state.computeDecisionBundleHash(bundle());
  const advisoryChanged = state.computeDecisionBundleHash(bundle({
    advisorySkills: [{ name: "another-personal-helper", path: "/tmp/skill" }],
  }));
  const requiredChanged = state.computeDecisionBundleHash(bundle({
    requiredPolicies: [{ id: "POL-001", version: "2", source: "policies/base.md" }],
  }));
  const displayOnlyChanged = state.computeDecisionBundleHash(bundle({
    artifacts: { PRD: "updated: 2026-07-12\nstatus: approved\nREQ-001", TSD: "status: review-ready\nTD-001" },
  }));

  assert.equal(advisoryChanged, first);
  assert.equal(displayOnlyChanged, first);
  assert.notEqual(requiredChanged, first);
});

test("REQ-005 enforces v2 approval order and marks changed bundles stale", () => {
  assert.equal(typeof state.approveDecisionV2, "function", "v2 approval API is missing");
  assert.equal(typeof state.auditDecisionV2, "function", "v2 audit API is missing");

  const root = mkdtempSync(join(tmpdir(), "workflow-decisions-v2-"));
  try {
    assert.throws(() => state.approveDecisionV2(root, {
      feature: "alpha",
      docId: "alpha-change",
      id: "DP-2",
      bundle: bundle(),
      reason: "too early",
    }), /DP-1/);

    state.approveDecisionV2(root, { feature: "alpha", docId: "alpha-change", id: "DP-1", bundle: bundle(), reason: "scope approved" });
    state.approveDecisionV2(root, { feature: "alpha", docId: "alpha-change", id: "DP-2", bundle: bundle(), reason: "technical approved" });
    state.approveDecisionV2(root, { feature: "alpha", docId: "alpha-change", id: "DP-3", bundle: bundle(), reason: "execution approved" });

    const current = state.auditDecisionV2(root, {
      feature: "alpha",
      docId: "alpha-change",
      id: "DP-2",
      bundle: bundle({ advisorySkills: [{ name: "changed-advisory" }] }),
    });
    assert.equal(current.approved, true);
    assert.equal(current.status, "approved");

    const stale = state.auditDecisionV2(root, {
      feature: "alpha",
      docId: "alpha-change",
      id: "DP-2",
      bundle: bundle({ requiredPolicies: [{ id: "POL-001", version: "2", source: "policies/base.md" }] }),
    });
    assert.equal(stale.approved, false);
    assert.equal(stale.status, "stale");
    assert.match(stale.stale_reason, /bundle hash changed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
