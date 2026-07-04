import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("workflow-state reuses document metadata frontmatter helpers", () => {
  const source = readFileSync(join(repoRoot, "src/lib/workflow-state.ts"), "utf8");

  assert.ok(source.includes("parseFrontmatter as parseDocumentFrontmatter"));
  assert.equal(source.includes("export function splitFrontmatter"), false);
  assert.equal(source.includes("function splitFrontmatter"), false);
  assert.equal(source.includes("for (const line of lines)"), false);
});
