import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { migrateRoot } from "../../src/lib/document-contract-migration.ts";

function writeEvidence(root, text) {
  const evidenceDir = join(root, "docs/coding-plugins/features/demo-app/evidence");
  mkdirSync(evidenceDir, { recursive: true });
  const evidence = join(evidenceDir, "tdd-evidence.md");
  writeFileSync(evidence, text, "utf8");
  return evidence;
}

test("TypeScript document contract migration writes aliases and related spec ids", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-contract-migration-"));
  try {
    const evidence = writeEvidence(
      root,
      "---\n" +
        "feature: demo-app\n" +
        "status: 已实现\n" +
        "related_specs:\n" +
        "  - REQ-DEMO-009\n" +
        "  - docs/coding-plugins/features/demo-app/requirements/demo-app-PRD.md\n" +
        "related_technical:\n" +
        "  - docs/coding-plugins/features/demo-app/technicals/demo-app-TDD.md\n" +
        "---\n" +
        "# Evidence\n",
    );

    const changed = migrateRoot(root);
    const migrated = readFileSync(evidence, "utf8");

    assert.equal(changed, true);
    assert.ok(migrated.includes("status: covered"));
    assert.ok(migrated.includes("related_docs:"));
    assert.ok(migrated.includes("docs/coding-plugins/features/demo-app/requirements/demo-app-PRD.md"));
    assert.ok(migrated.includes("docs/coding-plugins/features/demo-app/technicals/demo-app-TDD.md"));
    assert.equal(migrated.includes("related_specs:"), false);
    assert.equal(migrated.includes("related_technical:"), false);
    assert.ok(migrated.includes("related_spec_ids:"));
    assert.ok(migrated.includes("REQ-DEMO-009"));
    assert.ok(migrated.includes("title: demo-app TDD Evidence"));
    assert.ok(migrated.includes("created:"));
    assert.ok(migrated.includes("updated:"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript document contract migration dry-run reports without writing", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-contract-migration-dry-"));
  try {
    const original = "---\nfeature: demo-app\nstatus: 已实现\n---\n# Evidence\n";
    const evidence = writeEvidence(root, original);

    assert.equal(migrateRoot(root, { dryRun: true }), true);
    assert.equal(readFileSync(evidence, "utf8"), original);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
