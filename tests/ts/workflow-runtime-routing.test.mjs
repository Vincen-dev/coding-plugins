import assert from "node:assert/strict";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

const fixtures = [
  {
    id: "019f47d0-1d4d-7dc1-893f-79330c11743c",
    intent: "分析 SDK 云端配置怎么实现，不改代码",
    flow: "inspect",
  },
  {
    id: "019f4581-bf54-74b0-8ef2-bc79bdbd6656",
    intent: "继续优化 UI，把按钮问号文本改为 Icon",
    flow: "change",
  },
  {
    id: "019f4168-691f-7c60-9aea-a0151a730775",
    intent: "开始实现数据库 schema、protobuf 与云端兼容迁移",
    flow: "governed-change",
  },
  {
    id: "019f3fca-b130-7e80-9603-4853b17f68ed",
    intent: "比较 OpenSpec 与 Coding Plugins 的流程差异",
    flow: "inspect",
  },
];

test("REQ-001 routes real conversation intents to one user-visible flow", () => {
  assert.equal(typeof workflow.classifyIntent, "function", "classifyIntent contract is missing");
  assert.equal(typeof workflow.decideRoute, "function", "decideRoute contract is missing");

  for (const fixture of fixtures) {
    const classification = workflow.classifyIntent(fixture.intent);
    const first = workflow.decideRoute(classification);
    const second = workflow.decideRoute(workflow.classifyIntent(fixture.intent));

    assert.equal(first.flow, fixture.flow, fixture.id);
    assert.deepEqual(second, first, `${fixture.id} must be deterministic`);
    assert.equal(typeof first.next.action, "string");
    assert.ok(first.next.action.length > 0);
  }
});

test("REQ-001 distinguishes analysis about implementation from an implementation command", () => {
  assert.equal(typeof workflow.classifyIntent, "function", "classifyIntent contract is missing");
  assert.equal(typeof workflow.decideRoute, "function", "decideRoute contract is missing");

  const inspect = workflow.decideRoute(workflow.classifyIntent("分析数据库 schema 应该怎么实现"));
  const execute = workflow.decideRoute(workflow.classifyIntent("开始实现数据库 schema 迁移"));

  assert.equal(inspect.flow, "inspect");
  assert.equal(execute.flow, "governed-change");
});
