import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as taskStatus from "../../src/lib/workflow/task-status.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("REQ-002 task status exposes the single route decision used for its v1 projection", () => {
  const payload = taskStatus.buildTaskStatus({
    action: "status",
    root: repoRoot,
    intent: "分析数据库 schema 应该怎么实现",
  });

  assert.equal(payload.route_decision.schemaVersion, "2.0");
  assert.equal(payload.route_decision.flow, "inspect");
  assert.equal(payload.mode.mode, "analysis-only");
  assert.equal(payload.state, "analysis-only");
  assert.equal(payload.next_skill, "using-coding-plugins");
});

test("MIG-001 keeps the existing v1 task status fields while adding v2 context", () => {
  const payload = taskStatus.buildTaskStatus({
    action: "status",
    root: repoRoot,
    intent: "按钮问号文本改为 Icon",
  });

  assert.equal(payload.entrypoint, "coding-plugins task status");
  assert.equal(payload.conversation_judgment_allowed, false);
  assert.equal(payload.mode.mode, "tdd-only");
  assert.equal(payload.route_decision.flow, "change");
  assert.ok(Array.isArray(payload.allowed_actions));
  assert.ok(Array.isArray(payload.blocked_actions));
});

test("REQ-010 emits a compact v2 contract with one structured task command", () => {
  assert.equal(typeof taskStatus.buildTaskStatusV2, "function", "compact v2 projector is missing");
  const legacy = taskStatus.buildTaskStatus({
    action: "status",
    root: repoRoot,
    intent: "开始实现数据库 schema 迁移",
  });
  const payload = taskStatus.buildTaskStatusV2(legacy);

  assert.equal(payload.schemaVersion, "2.0");
  assert.equal(payload.flow, "governed-change");
  assert.equal(payload.next.command.name, "task");
  assert.equal(payload.next.command.args.includes("--contract-version"), true);
  assert.equal(JSON.stringify(payload).includes("node ./bin/coding-plugins.js"), false);
  assert.equal(Array.isArray(payload.blockers), true);
});

test("REQ-010 task CLI accepts contract version 2 without a business-repository bin fallback", () => {
  const result = spawnSync("node", [
    join(repoRoot, "src/cli/task.ts"),
    "status",
    "--root",
    repoRoot,
    "--intent",
    "分析这个项目",
    "--contract-version",
    "2",
    "--json",
  ], { cwd: repoRoot, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schemaVersion, "2.0");
  assert.equal(payload.flow, "inspect");
  assert.equal(payload.scope.knowledge, "unknown");
  assert.equal(payload.next.action, "answer-directly");
});

test("REQ-010 SessionStart recommends the v2 task facade through CP_CLI", () => {
  const hook = readFileSync(join(repoRoot, "hooks/session-start-codex"), "utf8");
  const skill = readFileSync(join(repoRoot, "skills/using-coding-plugins/SKILL.md"), "utf8");

  assert.match(hook, /\$\{CP_CLI\} task status --root \. --intent .* --contract-version 2 --json/);
  assert.match(skill, /\$\{CP_CLI\} task status --root \. --intent .* --contract-version 2 --json/);
  assert.doesNotMatch(skill, /node \.\/bin\/coding-plugins\.js task status/);
});

test("REQ-009 complete workflow reports completion without a plan or execution blocker", () => {
  const legacy = taskStatus.buildTaskStatus({
    action: "status",
    root: repoRoot,
    intent: "继续",
    feature: "workflow-runtime",
    docId: "workflow-simplification",
  });
  const payload = taskStatus.buildTaskStatusV2(legacy);

  assert.equal(payload.state, "complete");
  assert.equal(payload.next.action, "report-completion");
  assert.equal(payload.next.skill, "verification-before-completion");
  assert.equal(payload.next.command, undefined);
  assert.equal(payload.context.decisionPoint, "DP-6");
  assert.deepEqual(payload.blockers, []);
});
