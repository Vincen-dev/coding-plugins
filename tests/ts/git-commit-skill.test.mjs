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

  assert.match(skill, /^## 提交语言$/m);
  assert.match(skill, /提交信息可以使用中文或英文，必须由用户决定/);
  assert.match(skill, /当前对话持续使用中文或英文，且用户直接要求提交时，可视为该语言偏好/);
  assert.match(skill, /如果用户没有明确语言偏好，提交前先询问用户/);
  assert.match(skill, /`type` 和 `scope` 保持英文 Conventional Commit 标识/);
  assert.match(skill, /description、body、footer 中给人阅读的说明文字必须和用户选择的语言一致/);
  assert.match(skill, /不得把中文或英文写成硬性默认值/);
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
