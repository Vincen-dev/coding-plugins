import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const entry = readFileSync(resolve(repoRoot, "skills/using-coding-plugins/SKILL.md"), "utf8");

function walk(path) {
  const full = join(repoRoot, path);
  if (statSync(full).isFile()) return [path];
  return readdirSync(full, { withFileTypes: true }).flatMap((item) => {
    const child = relative(repoRoot, join(full, item.name)).replaceAll("\\", "/");
    return item.isDirectory() ? walk(child) : [child];
  });
}

test("VC-003/004 workflow entry defines five risk profiles and one next skill", () => {
  for (const profile of ["Inspect", "Quick Change", "Standard Change", "Governed Change", "Critical Change"]) {
    assert.match(entry, new RegExp(`\\b${profile}\\b`));
  }
  assert.match(entry, /Inspect[\s\S]*no artifact/i);
  assert.match(entry, /Quick Change[\s\S]*no artifact/i);
  assert.match(entry, /Standard Change[\s\S]*change\.md/i);
  assert.match(entry, /Governed Change[\s\S]*change\.md[\s\S]*plan\.md[\s\S]*evidence\.md/i);
  assert.match(entry, /Critical Change[\s\S]*design\.md[\s\S]*tests\.md/i);
  assert.match(entry, /uncertain[\s\S]*higher-risk profile/i);
  assert.match(entry, /Quick Change[\s\S]*test-driven-development/i);
  assert.match(entry, /Standard Change[\s\S]*change-capsule/i);
});

test("VC-004 workflow entry has no runtime routing dependency", () => {
  assert.doesNotMatch(entry, /CP_CLI|coding-plugins\s+(?:task|start|state|dp|workflow-)|conversation_judgment_allowed|contract-version/i);
});

test("VC-002/003/004 retained skills preserve discipline without retired dependencies", () => {
  const files = walk("skills").filter((path) => /\.(?:md|yaml)$/.test(path));
  const forbidden = /\$\{CP_CLI\}|\bCP_CLI\b|\bcoding-plugins\s+(?:task|start|state|dp|validate|workflow-|doctor|cli|release|commit-guard|scope-check|preflight)\b|\b(?:spec-driven-development|document-metadata|writing-requirements|writing-technicals|writing-test-cases|writing-plans)\b/i;
  const offenders = files.filter((path) => forbidden.test(readFileSync(join(repoRoot, path), "utf8")));
  assert.deepEqual(offenders, [], `retired workflow references remain in: ${offenders.join(", ")}`);

  const tdd = readFileSync(join(repoRoot, "skills/test-driven-development/SKILL.md"), "utf8");
  assert.match(tdd, /RED[\s\S]*GREEN[\s\S]*REFACTOR/);
  const verify = readFileSync(join(repoRoot, "skills/verification-before-completion/SKILL.md"), "utf8");
  assert.match(verify, /fresh verification/i);
  const commit = readFileSync(join(repoRoot, "skills/using-git-commit/SKILL.md"), "utf8");
  assert.match(commit, /diff[\s\S]*sensitive[\s\S]*author/i);
});
