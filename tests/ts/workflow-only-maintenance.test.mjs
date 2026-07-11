import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const expectedTests = [
  "change-capsule-contract.test.mjs",
  "change-capsule-state.test.mjs",
  "workflow-chinese-documents.test.mjs",
  "workflow-only-approval.test.mjs",
  "workflow-only-distribution.test.mjs",
  "workflow-only-maintenance.test.mjs",
  "workflow-only-migration.test.mjs",
  "workflow-only-routing.test.mjs",
  "workflow-philosophy.test.mjs",
];
const expectedSkills = [
  "brainstorming",
  "change-capsule",
  "dispatching-parallel-agents",
  "executing-plans",
  "finishing-a-development-branch",
  "receiving-code-review",
  "requesting-code-review",
  "subagent-driven-development",
  "systematic-debugging",
  "test-driven-development",
  "using-coding-plugins",
  "using-git-commit",
  "using-git-worktrees",
  "verification-before-completion",
  "writing-skills",
];

test("VC-004 maintenance suite has no production runtime dependency", () => {
  const tests = readdirSync(join(repoRoot, "tests/ts")).filter((name) => name.endsWith(".test.mjs")).sort();
  assert.deepEqual(tests, expectedTests);
  for (const name of tests) {
    const text = readFileSync(join(repoRoot, "tests/ts", name), "utf8");
    assert.doesNotMatch(text, /\.\.\/\.\.\/src|src\/cli|src\/lib|bin\/coding-plugins|spawnSync\(/, `${name} depends on the removed runtime`);
  }
  for (const path of ["tsconfig.json", "tsconfig.build.json", "coding-plugins.policies.yaml", ".coding-plugins-decisions.json"]) {
    assert.equal(existsSync(join(repoRoot, path)), false, `${path} is a retired runtime artifact`);
  }
});

test("VC-003/004 workflow-only skill inventory is minimal and discoverable", () => {
  const skills = readdirSync(join(repoRoot, "skills"), { withFileTypes: true })
    .filter((item) => item.isDirectory() && existsSync(join(repoRoot, "skills", item.name, "SKILL.md")))
    .map((item) => item.name)
    .sort();
  assert.deepEqual(skills, expectedSkills);

  const retiredScripts = [];
  for (const skill of skills) {
    const scripts = join(repoRoot, "skills", skill, "scripts");
    if (!existsSync(scripts)) continue;
    for (const name of readdirSync(scripts)) if (name.endsWith(".ts")) retiredScripts.push(`${skill}/scripts/${name}`);
  }
  assert.deepEqual(retiredScripts, []);
});

test("VC-004 platform manifests point only at existing static workflow surfaces", () => {
  const codex = JSON.parse(readFileSync(join(repoRoot, ".codex-plugin/plugin.json"), "utf8"));
  const generic = JSON.parse(readFileSync(join(repoRoot, "plugin.json"), "utf8"));
  const gemini = JSON.parse(readFileSync(join(repoRoot, "gemini-extension.json"), "utf8"));
  assert.equal(codex.skills, "./skills/");
  assert.equal(generic.skills, "skills/");
  assert.equal(gemini.contextFileName, "GEMINI.md");
  for (const path of ["skills", "GEMINI.md", "assets/coding-plugins.svg"]) assert.equal(existsSync(join(repoRoot, path)), true);
});
