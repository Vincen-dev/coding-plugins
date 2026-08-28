import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

test("VC-DOC-001 implementation profiles perform a four-state Documentation Impact Check", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");

  assert.match(entry, /Documentation Impact Check/i);
  for (const state of ["none", "update-existing", "create-module-doc", "external-doc"]) {
    assert.match(entry, new RegExp(`\\b${state}\\b`, "i"));
  }
  assert.match(entry, /new module|material(?:ly)? changes?[^\n]*module boundary/i);
  assert.match(entry, /Inspect[\s\S]*does not[\s\S]*(?:create|update)[\s\S]*module documentation/i);
  assert.match(entry, /Quick Change[\s\S]*(?:only|unless)[\s\S]*(?:contract|module boundary)/i);
});

test("VC-DOC-002 Capsule records documentation impact without duplicating module state", () => {
  const skill = read("skills/change-capsule/SKILL.md");
  const changeTemplate = read("skills/change-capsule/templates/change.md");

  assert.match(skill, /module documentation[\s\S]*(?:living|long-lived|durable)/i);
  assert.match(skill, /separate from[\s\S]*Change Capsule/i);
  assert.match(skill, /do not[\s\S]*(?:duplicate|record)[\s\S]*(?:phase|approval|current task)/i);
  assert.match(changeTemplate, /^## 文档影响$/m);
  for (const field of ["类型", "目标", "原因", "验证"]) assert.match(changeTemplate, new RegExp(`^- ${field}：`, "m"));
});

test("VC-DOC-003 optional module documentation template is a delivery document, not a Capsule artifact", () => {
  const skill = read("skills/change-capsule/SKILL.md");
  const templatePath = join(repoRoot, "skills/change-capsule/templates/module-doc.md");

  assert.equal(existsSync(templatePath), true);
  const template = read("skills/change-capsule/templates/module-doc.md");
  for (const section of ["目标与非目标", "模块边界与所有权", "入口与目录结构", "核心流程", "数据与状态", "外部契约", "生命周期与错误恢复", "验证", "已知限制"]) {
    assert.match(template, new RegExp(`^## ${section}$`, "m"), `module-doc.md missing ${section}`);
  }
  assert.match(skill, /module-doc\.md[\s\S]*(?:optional|copy)[\s\S]*(?:product|architecture|external)/i);
  assert.match(skill, /does not count[\s\S]*artifact/i);
});

test("VC-DOC-004 execution and completion close every non-none documentation impact", () => {
  const execution = read("skills/executing-plans/SKILL.md");
  const subagent = read("skills/subagent-driven-development/SKILL.md");
  const implementer = read("skills/subagent-driven-development/implementer-prompt.md");
  const verification = read("skills/verification-before-completion/SKILL.md");

  assert.match(execution, /Documentation Impact[\s\S]*non-`?none`?/i);
  assert.match(execution, /create or update[\s\S]*module documentation/i);
  assert.match(`${subagent}\n${implementer}`, /Documentation Impact[\s\S]*module documentation/i);
  assert.match(verification, /Documentation Impact[\s\S]*non-`?none`?/i);
  assert.match(verification, /documentation[\s\S]*(?:code|API)[\s\S]*lifecycle[\s\S]*external boundar/i);
  assert.match(verification, /does not replace[\s\S]*(?:tests|runtime|external)/i);
});

test("VC-DOC-005 user documentation distinguishes change evidence from module delivery documentation", () => {
  const docs = `${read("README.md")}\n${read("docs/workflow-chain.md")}\n${read("RELEASE-NOTES.md")}`;

  assert.match(docs, /Documentation Impact Check/i);
  assert.match(docs, /Change Capsule[\s\S]*module documentation/i);
  assert.match(docs, /not[^\n]*(?:mandatory|required)[^\n]*every/i);
});
