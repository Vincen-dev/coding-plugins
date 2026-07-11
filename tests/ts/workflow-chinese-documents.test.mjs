import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

function walk(path) {
  const full = join(repoRoot, path);
  if (statSync(full).isFile()) return [path];
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const child = relative(repoRoot, join(full, entry.name)).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(child) : [child];
  });
}

const expectedHeadings = {
  "skills/change-capsule/templates/change.md": ["意图", "风险", "范围", "假设与待决事项", "可验证契约", "产物", "批准记录", "当前任务", "决策", "完成情况"],
  "skills/change-capsule/templates/plan.md": ["设计", "测试策略", "任务", "回滚", "验证"],
  "skills/change-capsule/templates/evidence.md": ["测试驱动证据", "最终验证", "剩余风险"],
  "skills/change-capsule/templates/design.md": ["上下文", "决策", "接口", "风险"],
  "skills/change-capsule/templates/tests.md": ["测试矩阵", "测试数据", "断言", "人工检查"],
};

test("VC-001 五个生成模板使用简体中文", () => {
  const actualTemplates = walk("skills")
    .filter((path) => path.includes("/templates/") && path.endsWith(".md"))
    .sort();
  assert.deepEqual(actualTemplates, Object.keys(expectedHeadings).sort(), "生成模板必须只有 Change Capsule 的五个中文模板");
  for (const [path, headings] of Object.entries(expectedHeadings)) {
    const text = read(path);
    for (const heading of headings) assert.match(text, new RegExp(`^## ${heading}$`, "m"), `${path} 缺少 ${heading}`);
    assert.match(text, /[\u3400-\u9fff]/, `${path} 没有中文内容`);
  }
});

test("VC-002 生成规则强制中文并保留稳定机器字段", () => {
  const skill = read("skills/change-capsule/SKILL.md");
  assert.match(skill, /generated documents[\s\S]*Simplified Chinese/i);
  assert.match(skill, /frontmatter keys[\s\S]*file names[\s\S]*VC-\*/i);
  const tdd = read("skills/test-driven-development/SKILL.md");
  assert.match(tdd, /## 任务 N：<标题>[\s\S]*### 测试驱动证据/);
  const entry = read("skills/using-coding-plugins/SKILL.md");
  assert.match(entry, /Quick Change completion report[\s\S]*可验证契约[\s\S]*测试先行证据[\s\S]*最终验证[\s\S]*剩余风险/i);
});

test("VC-003 所有活跃 Capsule 标题和叙述正文使用中文", () => {
  const files = walk("docs/coding-plugins/changes").filter((path) => path.endsWith(".md"));
  for (const path of files) {
    const text = read(path);
    const body = text.replace(/^---[\s\S]*?---\s*/m, "");
    const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]);
    assert.ok(headings.length > 0, `${path} 没有标题`);
    for (const heading of headings) assert.match(heading, /[\u3400-\u9fff]/, `${path} 存在非中文标题：${heading}`);
    const han = (body.match(/[\u3400-\u9fff]/g) ?? []).length;
    const latin = (body.replace(/`[^`]+`/g, "").match(/[A-Za-z]/g) ?? []).length;
    assert.ok(han > latin, `${path} 的叙述正文不是以中文为主：中文=${han}, 拉丁字符=${latin}`);
  }
});
