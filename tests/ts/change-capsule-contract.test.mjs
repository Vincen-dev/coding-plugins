import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const capsuleRoot = join(repoRoot, "skills/change-capsule");

function read(path) {
  return readFileSync(join(capsuleRoot, path), "utf8");
}

test("VC-004 change-capsule exposes 0/0/1/3/optional artifact profiles", () => {
  assert.equal(existsSync(join(capsuleRoot, "SKILL.md")), true, "change-capsule skill is missing");
  const skill = read("SKILL.md");
  assert.match(skill, /Inspect[^\n]*0 artifacts/i);
  assert.match(skill, /Quick Change[^\n]*0 artifacts/i);
  assert.match(skill, /Standard Change[^\n]*1 artifact[^\n]*change\.md/i);
  assert.match(skill, /Governed Change[^\n]*3 artifacts[^\n]*change\.md[^\n]*plan\.md[^\n]*evidence\.md/i);
  assert.match(skill, /Critical Change[^\n]*optional[^\n]*design\.md[^\n]*tests\.md/i);
});

test("VC-001/004 change-capsule templates have the minimal contract sections", () => {
  const expected = {
    "templates/change.md": ["意图", "风险", "范围", "假设与待决事项", "可验证契约", "产物", "批准记录", "当前任务", "决策", "完成情况"],
    "templates/plan.md": ["设计", "测试策略", "任务", "回滚", "验证"],
    "templates/evidence.md": ["测试驱动证据", "最终验证", "剩余风险"],
    "templates/design.md": ["上下文", "决策", "接口", "风险"],
    "templates/tests.md": ["测试矩阵", "测试数据", "断言", "人工检查"],
  };
  for (const [path, sections] of Object.entries(expected)) {
    const text = read(path);
    for (const section of sections) assert.match(text, new RegExp(`^## ${section}$`, "m"), `${path} missing ${section}`);
    assert.doesNotMatch(text, /\bPRD\b|\bTSD\b|\bTVD\b|\bTED\b|\bVED\b|CP_CLI|coding-plugins\s+task/i);
  }
});
