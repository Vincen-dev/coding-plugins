import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ignoredDirectories = new Set([".git", "node_modules"]);
const repoFilePattern = /^\.?[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+)*$/;
const conventionalNames = new Set([
  "CASE-INDEX.md",
  "CODE_OF_CONDUCT.md",
  "GEMINI.md",
  "INDEX.md",
  "INSTALL.md",
  "LICENSE",
  "README.md",
  "RELEASE-NOTES.md",
  "SECURITY.md",
  "SKILL.md",
]);
const artifactDocumentPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*-(?:PRD|TSD|TVD|TED|VED)\.md$/;
const placeholderPattern = /^test-pressure-\d+\.md$/;
const rolePromptPattern = /(?:^|-)reviewer\.md$|^implementer\.md$/;
const snakeCaseTestPattern = /^test_[a-z0-9_]+\.mjs$/;

function walkEntries(dir) {
  const paths = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      paths.push(path, ...walkEntries(path));
    } else if (entry.isFile()) {
      paths.push(path);
    }
  }
  return paths.sort();
}

function isAllowedPathName(path) {
  const name = basename(path);
  const relativePath = relative(repoRoot, path);
  if (conventionalNames.has(name) || artifactDocumentPattern.test(name)) {
    return true;
  }
  if (relativePath.startsWith("tests/ts/") && snakeCaseTestPattern.test(name)) {
    return false;
  }
  if (placeholderPattern.test(name) || rolePromptPattern.test(name)) {
    return false;
  }
  return repoFilePattern.test(name);
}

test("repository paths use kebab-case names except platform and document-contract conventions", () => {
  const offenders = [];

  for (const path of walkEntries(repoRoot)) {
    if (!isAllowedPathName(path)) {
      offenders.push(relative(repoRoot, path));
    }
  }

  assert.deepEqual(offenders, []);
});
