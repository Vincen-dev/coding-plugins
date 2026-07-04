import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { renderArtifactIndex, writeArtifactIndex, checkArtifactIndexCoversDocuments } from "../../src/lib/docs-index.ts";

function writeFeatureReadme(featureDir, updated = "2026-06-29", tag = "search") {
  writeFileSync(
    join(featureDir, "README.md"),
    "---\n" +
      "title: 搜索\n" +
      "status: approved\n" +
      "feature: search\n" +
      `updated: ${updated}\n` +
      "tags:\n" +
      `  - ${tag}\n` +
      "---\n" +
      "# Search\n",
    "utf8",
  );
}

test("TypeScript docs index renders feature-first artifact rows", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-docs-index-"));
  try {
    const featureDir = join(root, "docs/coding-plugins/features/search");
    mkdirSync(join(featureDir, "requirements"), { recursive: true });
    mkdirSync(join(featureDir, "test-cases"), { recursive: true });
    writeFeatureReadme(featureDir);
    writeFileSync(join(featureDir, "requirements/search-PRD.md"), "---\nupdated: 2026-06-29\n---\n# Feature\n", "utf8");
    writeFileSync(join(featureDir, "test-cases/search-TCD.md"), "---\nupdated: 2026-06-29\n---\n# Test cases\n", "utf8");

    const rendered = renderArtifactIndex(root);

    assert.ok(rendered.includes("`docs/coding-plugins/features/search`"));
    assert.ok(rendered.includes("`docs/coding-plugins/features/search/requirements/search-PRD.md`"));
    assert.ok(rendered.includes("`docs/coding-plugins/features/search/test-cases/search-TCD.md`"));
    assert.ok(rendered.includes("| Feature | Doc ID | 功能根目录 |"));
    assert.ok(rendered.includes("| search | search | `docs/coding-plugins/features/search` |"));
    assert.ok(rendered.includes("| search | 2026-06-29 |"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript docs index renders one row per doc id and validates generated index", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-docs-index-multi-"));
  try {
    const featureDir = join(root, "docs/coding-plugins/features/search");
    mkdirSync(join(featureDir, "requirements"), { recursive: true });
    mkdirSync(join(featureDir, "technicals"), { recursive: true });
    writeFeatureReadme(featureDir, "2026-07-01");
    writeFileSync(join(featureDir, "requirements/search-basic-PRD.md"), "---\nupdated: 2026-07-01\n---\n# Basic\n", "utf8");
    writeFileSync(join(featureDir, "requirements/search-advanced-PRD.md"), "---\nupdated: 2026-07-02\n---\n# Advanced\n", "utf8");
    writeFileSync(join(featureDir, "technicals/search-basic-TDD.md"), "---\nupdated: 2026-07-03\n---\n# Basic TDD\n", "utf8");

    const rendered = renderArtifactIndex(root);

    assert.ok(
      rendered.includes(
        "| search | search-basic | `docs/coding-plugins/features/search` | " +
          "`docs/coding-plugins/features/search/requirements/search-basic-PRD.md` | " +
          "`docs/coding-plugins/features/search/technicals/search-basic-TDD.md` |",
      ),
    );
    assert.ok(
      rendered.includes(
        "| search | search-advanced | `docs/coding-plugins/features/search` | " +
          "`docs/coding-plugins/features/search/requirements/search-advanced-PRD.md` | - |",
      ),
    );

    writeArtifactIndex(root);
    checkArtifactIndexCoversDocuments(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
