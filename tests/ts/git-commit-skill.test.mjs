import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const skillPath = join(repoRoot, "skills/git-commit/SKILL.md");
const languageContractFiles = [
  "README.md",
  "docs/workflow-chain.md",
  "hooks/session-start-codex",
  "skills/git-commit/SKILL.md",
  "skills/git-commit/agents/openai.yaml",
  "skills/subagent-driven-development/SKILL.md",
  "skills/subagent-driven-development/implementer-prompt.md",
  "skills/finishing-a-development-branch/SKILL.md",
  "tests/fixtures/formal-feature-chain/CASE-INDEX.md",
].map((path) => join(repoRoot, path));

test("git-commit skill makes user-selected commit language rules unambiguous", () => {
  const skill = readFileSync(skillPath, "utf8");

  assert.match(skill, /^## Commit Language Resolution$/m);
  assert.match(skill, /Explicit user choice/);
  assert.match(skill, /Recent repository commit history/);
  assert.match(skill, /Ask the user if ambiguous/);
  assert.match(skill, /Current conversation language only as a fallback/);
  assert.match(skill, /Do not hard-code Chinese or English as a universal rule/);
  assert.match(skill, /Conventional Commit/);
  assert.match(skill, /Authored-by/);
});

test("git-commit language contract surfaces do not force Chinese commit messages", () => {
  const bannedHardRules = [
    /提交信息必须中文/,
    /默认使用中文提交信息/,
    /生成中文 Conventional Commit/,
    /中文 Conventional Commit/,
    /中文提交/,
    /提交必须使用中文/,
  ];

  const offenders = [];
  for (const file of languageContractFiles) {
    const text = readFileSync(file, "utf8");
    for (const pattern of bannedHardRules) {
      if (pattern.test(text)) {
        offenders.push(`${file.replace(`${repoRoot}/`, "")} matches ${pattern}`);
      }
    }
  }

  assert.deepEqual(offenders, []);
});
