import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const checkedRoots = [
  "README.md",
  "docs",
  "skills",
  "src",
].map((path) => join(repoRoot, path));
const textExtensions = new Set([".md", ".yaml", ".yml", ".json"]);
const disallowedPatterns = [
  /\bTDD\/TID\b/,
  /\bTDD\/TID\/TCD\/IPD\b/,
  /\bTID\b/,
  /-TDD\.md\b/,
  /-TID\.md\b/,
  /\bTCD\b/,
  /\bIPD\b/,
  /-TCD\.md\b/,
  /-IPD\.md\b/,
  /evidences\/[^`\s]+-TED\.md/,
  /\brelated_specs\b/,
  /\brelated_technical\b/,
  /\brelated_test_cases\b/,
  /\brelated_plans\b/,
  /\brelated_evidence\b/,
  /Implementation Procedure Document/,
];
const allowedMigrationFiles = new Set([
  "docs/coding-plugins/document-contract-migration.md",
  "src/lib/document-contract-migration.ts",
  "tests/ts/document-contract-migration.test.mjs",
]);

function walk(dir) {
  if (statSync(dir).isFile()) {
    return textExtensions.has(extname(dir)) ? [dir] : [];
  }
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (entry.isFile() && textExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files.sort();
}

test("formal plugin surfaces document only the current PRD/TSD/TVD/TED/VED contract", () => {
  const offenders = [];
  for (const checkedRoot of checkedRoots) {
    assert.ok(statSync(checkedRoot));
  }
  for (const file of checkedRoots.flatMap((root) => walk(root))) {
    const relativePath = relative(repoRoot, file);
    if (allowedMigrationFiles.has(relativePath)) {
      continue;
    }
    const text = readFileSync(file, "utf8");
    for (const pattern of disallowedPatterns) {
      if (pattern.test(text)) {
        offenders.push(`${relativePath} matches ${pattern}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
