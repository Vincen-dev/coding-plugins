import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { scaffoldFeature } from "../../src/lib/scaffold-feature-docs.ts";
import { splitFrontmatter } from "../../src/lib/document-metadata.ts";

test("feature scaffold PRD stays narrative-first", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-scaffold-feature-"));
  try {
    scaffoldFeature(root, "cache-quality", "缓存质量", {
      docId: "cache-quality",
      currentDate: "2026-07-04",
    });

    const prdText = readFileSync(
      join(root, "docs/coding-plugins/features/cache-quality/requirements/cache-quality-PRD.md"),
      "utf8",
    );
    const [, body] = splitFrontmatter(prdText);
    const tableCount = body.split(/\r?\n/).filter((line) => /^\|\s*:?-{3,}/.test(line.trim())).length;

    assert.ok(body.includes("## 目标"));
    assert.ok(body.includes("## 成功指标"));
    assert.ok(body.includes("## 假设与依赖"));
    assert.ok(body.includes("## 开放问题"));
    assert.ok(body.includes("## 需求总览"));
    assert.ok(body.includes("## 追踪矩阵"));
    assert.equal(body.includes("docs/coding-plugins/features/cache-quality"), false);
    assert.ok(tableCount <= 4, `expected no more than 4 markdown tables, got ${tableCount}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
