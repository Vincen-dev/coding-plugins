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
  assert.match(skill, /提交信息可以使用中文或英文，不得硬编码为单一语言/);
  assert.match(skill, /如果用户已经明确要求中文或英文，直接使用该语言/);
  assert.match(skill, /检查最近提交信息，优先沿用历史提交中占主导且一致的语言作为默认值/);
  assert.match(skill, /历史提交缺失、语言混合或无法判断时，先询问用户确认中文还是英文/);
  assert.match(skill, /当前对话持续使用中文或英文，只能作为最后兜底/);
  assert.match(skill, /`type` 和 `scope` 保持英文 Conventional Commit 标识/);
  assert.match(skill, /description、body、footer 中给人阅读的说明文字必须和确定后的语言一致/);
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
