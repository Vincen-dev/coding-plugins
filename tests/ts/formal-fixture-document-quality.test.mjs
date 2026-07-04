import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { documentSuffix, splitFrontmatter } from "../../src/lib/document-metadata.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDocsRoot = join(repoRoot, "tests/fixtures/formal-feature-chain/docs/coding-plugins/features");
const artifactSuffixes = new Set(["PRD", "TSD", "TVD", "TED", "VED"]);
const pathInBodyRe = /docs\/coding-plugins\/features\/[^`\s)]+\/(?:requirements|technicals|test-cases|plans|evidences)\/[^`\s)]+-(?:PRD|TSD|TVD|TED|VED)\.md/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      files.push(path);
    }
  }
  return files.sort();
}

test("formal feature chain fixture bodies stay readable and metadata-first", () => {
  const offenders = [];
  for (const path of walk(fixtureDocsRoot)) {
    if (!statSync(path).isFile()) {
      continue;
    }
    const suffix = documentSuffix(path);
    if (!suffix || !artifactSuffixes.has(suffix)) {
      continue;
    }
    const [, body] = splitFrontmatter(readFileSync(path, "utf8"));
    const relativePath = relative(repoRoot, path);
    if (!body.includes("## 阅读摘要")) {
      offenders.push(`${relativePath} missing 阅读摘要`);
    }
    if (pathInBodyRe.test(body)) {
      offenders.push(`${relativePath} repeats full document path in body`);
    }
  }

  assert.deepEqual(offenders, []);
});
