import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const root = join(repoRoot, "skills/change-capsule/templates");
const read = (name) => readFileSync(join(root, name), "utf8");

test("VC-004 change.md is the only capsule-wide state source", () => {
  const change = read("change.md");
  for (const field of ["phase", "risk", "current_task", "completion_status"]) {
    assert.match(change, new RegExp(`^${field}:`, "m"));
  }
  assert.match(change, /^## 批准记录$/m);

  for (const attachment of ["plan.md", "evidence.md", "design.md", "tests.md"]) {
    assert.doesNotMatch(read(attachment), /^(?:phase|risk|approvals|current_task|completion_status):/m, `${attachment} duplicates change state`);
  }
});

test("VC-003/004 capsule resumes systematically without runtime state", () => {
  const skill = readFileSync(join(repoRoot, "skills/change-capsule/SKILL.md"), "utf8");
  assert.match(skill, /docs\/coding-plugins\/changes\/\*\/change\.md/);
  assert.match(skill, /more than one[\s\S]*ask/i);
  assert.doesNotMatch(skill, /\.coding-plugins\.yaml|runtime-state|decisions\.json|source_hash|CP_CLI/i);
});
