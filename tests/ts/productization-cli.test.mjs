import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const bin = join(repoRoot, "bin/coding-plugins.js");
const fixtureRoot = join(repoRoot, "tests/fixtures/formal-feature-chain");
const packageVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;
const npmCacheDir = join(tmpdir(), "codex-npm-cache");

function npmCacheEnv() {
  return { ...process.env, NPM_CONFIG_CACHE: npmCacheDir, npm_config_cache: npmCacheDir };
}

function run(args, options = {}) {
  return spawnSync("node", [bin, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: npmCacheEnv(),
    ...options,
  });
}

function json(args, options = {}) {
  const result = run(args, options);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function writeWorkflowDoc(root, feature, directory, docId, suffix, body, options = {}) {
  const dir = join(root, "docs/coding-plugins/features", feature, directory);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${docId}-${suffix}.md`),
    [
      "---",
      `title: ${docId} ${suffix}`,
      `status: ${options.status ?? "approved"}`,
      ...(options.frontmatter ?? []),
      `feature: ${feature}`,
      `doc_id: ${docId}`,
      "created: 2026-07-04",
      "updated: 2026-07-04",
      "---",
      `# ${docId} ${suffix}`,
      "",
      body,
      "",
    ].join("\n"),
    "utf8",
  );
}

function writeArtifactMode(root, payload) {
  writeFileSync(join(root, ".coding-plugins-artifacts.json"), JSON.stringify(payload, null, 2), "utf8");
}

function writeTddEvidence(path, overrides = {}) {
  const fields = {
    source: "REQ-001 is covered by this evidence.",
    redTest: "`tests/ts/productization-cli.test.mjs`",
    redCommand: "`node --test tests/ts/productization-cli.test.mjs`",
    redFailure: "The new assertion failed before implementation.",
    greenChange: "Implemented the required behavior.",
    greenCommand: "`node --test tests/ts/productization-cli.test.mjs`",
    refactorCommand: "`npm run typecheck`",
    finalVerification: "`npm run preflight` PASS.",
    ...overrides,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    [
      "---",
      "title: Evidence",
      "status: approved",
      "feature: alpha",
      "doc_id: alpha-login",
      "created: 2026-07-06",
      "updated: 2026-07-06",
      "---",
      "# Evidence",
      "",
      "## TDD 证据",
      "",
      `- **规格/缺陷/验收:** ${fields.source}`,
      "- **测试类型:** `contract`",
      `- **RED 测试:** ${fields.redTest}`,
      `- **RED 命令:** ${fields.redCommand}`,
      `- **RED 失败:** ${fields.redFailure}`,
      `- **GREEN 变更:** ${fields.greenChange}`,
      `- **GREEN 命令:** ${fields.greenCommand}`,
      `- **REFACTOR 命令:** ${fields.refactorCommand}`,
      `- **最终验证:** ${fields.finalVerification}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

function approvedChainBodies() {
  return {
    PRD: "## 成功指标\n\nREQ-001 has measurable success.\n\n## 假设与依赖\n\nREQ-001 depends on stable fixtures.\n\n## 开放问题\n\nNo open questions.\n\n## 需求总览\n\nREQ-001 must be traceable.\n\n## 追踪矩阵\n\nREQ-001 is covered.",
    TSD: "## 备选方案\n\nREQ-001 uses the current fixture design.\n\n## 规格到设计映射\n\nREQ-001 maps to TD-001.\n\n## 非功能设计\n\nREQ-001 remains maintainable.\n\n## 上线 / 回滚\n\nREQ-001 rolls back by reverting the fixture.\n\n## 测试策略\n\nREQ-001 uses contract tests.",
    TVD: "## 风险到测试映射\n\nREQ-001 maps to TC-001.\n\n## 测试环境与数据\n\nTC-001 uses local fixtures.\n\n## 测试用例总览\n\nTC-001 covers REQ-001.\n\n## 通过 / 失败标准\n\nTC-001 must pass.\n\n## 自动化状态\n\nTC-001 is automated.",
    TED: "## 执行锁定区\n\n- **Intent Lock:** Execute REQ-001.\n- **Scope Fence:** Only REQ-001.\n- **Required Spec IDs:** REQ-001\n- **Required Tests:** TC-001\n- **Review Gates:** review\n- **Rewind Triggers:** upstream change\n\n## 执行简报\n\nExecute TASK-001.\n\n## 任务总览\n\nTASK-001 covers REQ-001.\n\n## 任务依赖与并行性\n\nTASK-001 has no dependencies.\n\n## 完成任务（TASK-001 / REQ-001）\n\nDo it.\n\n## 中止条件\n\nStop when REQ-001 changes.",
    VED: "## TDD 证据\n\nRED 命令 covers REQ-001.",
  };
}

test("state CLI initializes, checks, transitions, and audits .coding-plugins.yaml", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-state-"));
  try {
    const init = json(["state", "init", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--state", "requirements-draft", "--json"]);
    assert.equal(init.state, "requirements-draft");
    assert.equal(init.feature, "alpha");
    assert.ok(existsSync(join(root, ".coding-plugins.yaml")));
    const stateText = readFileSync(join(root, ".coding-plugins.yaml"), "utf8");
    assert.match(stateText, /^schema_version: 2$/m);
    assert.match(stateText, /^active:$/m);
    assert.match(stateText, /^workflows:$/m);
    assert.ok(!stateText.trimStart().startsWith("{"), ".coding-plugins.yaml must be YAML, not JSON");

    const checked = json(["state", "check", "--root", root, "--json"]);
    assert.equal(checked.doc_id, "alpha-login");
    assert.equal(checked.valid, true);

    const transitioned = json(["state", "transition", "ready-for-technicals", "--root", root, "--reason", "PRD approved", "--json"]);
    assert.equal(transitioned.state, "ready-for-technicals");
    assert.equal(transitioned.transitions.length, 1);

    const audit = json(["state", "audit", "--root", root, "--json"]);
    assert.equal(audit.valid, true);
    assert.ok(audit.findings.some((finding) => finding.includes("transition")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("start uses active .coding-plugins.yaml workflow when feature and doc id are omitted", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-start-state-"));
  try {
    json(["state", "init", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--state", "ready-for-execution", "--json"]);

    const payload = json(["start", "--root", root, "--intent", "继续执行", "--json"]);
    assert.equal(payload.state.feature, "alpha");
    assert.equal(payload.state.doc_id, "alpha-login");
    assert.equal(payload.state.state, "not-started");
    assert.equal(payload.next_command, null);
    assert.equal(payload.next_skill, "spec-driven-development");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("start reports active project state mismatch against the inspected document chain", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-start-mismatch-"));
  try {
    json(["state", "init", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--state", "ready-for-execution", "--json"]);

    const payload = json(["start", "--root", root, "--intent", "继续执行", "--json"]);
    assert.equal(payload.project_state.state, "ready-for-execution");
    assert.equal(payload.state.state, "not-started");
    assert.equal(payload.state_mismatch, true);
    assert.ok(payload.warnings.some((warning) => warning.includes("project state")));
    assert.equal(payload.next_command, null);
    assert.equal(payload.next_skill, "spec-driven-development");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("state CLI keeps multiple workflow records and transitions a selected record", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-state-multi-"));
  try {
    json(["state", "init", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--state", "requirements-draft", "--json"]);
    json(["state", "init", "--root", root, "--feature", "beta", "--doc-id", "beta-sync", "--state", "ready-for-plan", "--json"]);

    const checked = json(["state", "check", "--root", root, "--json"]);
    assert.equal(checked.feature, "beta");
    assert.equal(checked.doc_id, "beta-sync");
    assert.equal(checked.workflows.length, 2);
    assert.ok(checked.workflows.some((workflow) => workflow.feature === "alpha" && workflow.doc_id === "alpha-login"));

    const transitioned = json([
      "state",
      "transition",
      "ready-for-execution",
      "--root",
      root,
      "--feature",
      "alpha",
      "--doc-id",
      "alpha-login",
      "--from",
      "requirements-draft",
      "--reason",
      "alpha chain approved",
      "--json",
    ]);
    assert.equal(transitioned.feature, "alpha");
    assert.equal(transitioned.doc_id, "alpha-login");
    assert.equal(transitioned.state, "ready-for-execution");

    const rechecked = json(["state", "check", "--root", root, "--json"]);
    assert.equal(rechecked.feature, "alpha");
    assert.equal(rechecked.doc_id, "alpha-login");
    assert.equal(rechecked.workflows.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("start is the unified entrypoint and disables pure conversation-only routing for document work", () => {
  const payload = json([
    "start",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--intent",
    "开始执行这个 TED",
    "--json",
  ]);

  assert.equal(payload.entrypoint, "coding-plugins start");
  assert.equal(payload.conversation_judgment_allowed, false);
  assert.equal(payload.state.state, "ready-for-execution");
  assert.equal(
    payload.next_command,
    `coding-plugins workflow-guard check --root ${fixtureRoot} --feature routing-fixture --doc-id routing-login --target execute`,
  );
  assert.deepEqual(payload.next_args, [
    "workflow-guard",
    "check",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--target",
    "execute",
  ]);
});

test("start keeps analysis-only requests out of document scaffolding", () => {
  const payload = json(["start", "--root", fixtureRoot, "--intent", "解释一下这个项目", "--json"]);

  assert.equal(payload.entrypoint, "coding-plugins start");
  assert.equal(payload.conversation_judgment_allowed, false);
  assert.equal(payload.mode.mode, "analysis-only");
  assert.equal(payload.next_skill, "using-coding-plugins");
  assert.equal(payload.next_command, null);
  assert.deepEqual(payload.next_args, []);
});

test("task status is the unified workflow entrypoint for executable document work", () => {
  const payload = json([
    "task",
    "status",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--intent",
    "开始执行这个 TED",
    "--json",
  ]);

  assert.equal(payload.entrypoint, "coding-plugins task status");
  assert.equal(payload.action, "status");
  assert.equal(payload.conversation_judgment_allowed, false);
  assert.equal(payload.feature, "routing-fixture");
  assert.equal(payload.doc_id, "routing-login");
  assert.equal(payload.state, "ready-for-execution");
  assert.equal(payload.decision_point, "DP-4");
  assert.equal(payload.decision_status.required_decision, "DP-4");
  assert.equal(payload.decision_status.approved, false);
  assert.equal(payload.next_skill, "using-git-worktrees");
  assert.ok(payload.allowed_actions.includes("request-decision:DP-4"));
  assert.ok(payload.blocked_actions.includes("workflow-guard:execute"));
  assert.ok(payload.blocked_actions.includes("execute-ted"));
  assert.equal(payload.guard.pass, true);
  assert.equal(payload.brief, null);
  assert.equal(
    payload.next_command,
    `coding-plugins dp request --root ${fixtureRoot} --feature routing-fixture --doc-id routing-login --id DP-4`,
  );
  assert.deepEqual(payload.next_args, [
    "dp",
    "request",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--id",
    "DP-4",
  ]);
});

test("task brief returns required skills, a unique next step, blockers, and verification requirements", () => {
  const payload = json([
    "task",
    "brief",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--intent",
    "继续执行",
    "--json",
  ]);

  assert.equal(payload.action, "brief");
  assert.equal(payload.task_brief.current_status.state, "ready-for-execution");
  assert.equal(payload.task_brief.unique_next_step, true);
  assert.equal(
    payload.task_brief.unique_next_command,
    `coding-plugins dp request --root ${fixtureRoot} --feature routing-fixture --doc-id routing-login --id DP-4`,
  );
  assert.deepEqual(payload.task_brief.required_skills, ["using-coding-plugins", "using-git-worktrees"]);
  assert.ok(payload.task_brief.blockers.some((blocker) => blocker.includes("DP-4")));
  assert.ok(payload.task_brief.verification_requirements.includes("run-next-command-before-continuing"));
  assert.ok(payload.task_brief.verification_requirements.includes("record-tdd-evidence-or-exception"));
});

test("dp CLI requests, approves, audits, and unblocks executable task status", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-dp-"));
  try {
    const pending = json(["dp", "status", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-4", "--json"]);
    assert.equal(pending.id, "DP-4");
    assert.equal(pending.approved, false);
    assert.ok(pending.blocked_actions.includes("execute"));

    const requested = json(["dp", "request", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-4", "--reason", "TED ready", "--json"]);
    assert.equal(requested.status, "requested");
    assert.equal(requested.approved, false);

    const failedAudit = run(["dp", "audit", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--target", "execute", "--json"]);
    assert.equal(failedAudit.status, 1);
    const failedPayload = JSON.parse(failedAudit.stdout);
    assert.equal(failedPayload.ok, false);
    assert.ok(failedPayload.blocked_actions.includes("execute"));

    const approved = json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-4", "--reason", "Approved", "--json"]);
    assert.equal(approved.status, "approved");
    assert.equal(approved.approved, true);

    const passedAudit = json(["dp", "audit", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--target", "execute", "--json"]);
    assert.equal(passedAudit.ok, true);
    assert.deepEqual(passedAudit.blocked_actions, []);

    const task = json([
      "task",
      "status",
      "--root",
      fixtureRoot,
      "--feature",
      "routing-fixture",
      "--doc-id",
      "routing-login",
      "--intent",
      "开始执行这个 TED",
      "--json",
    ]);
    assert.equal(task.decision_status.approved, false, "fixture root is independent and remains blocked without a DP-4 approval");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("dp audit blocks commit and release targets until DP-6 and DP-7 are approved", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-dp-release-"));
  try {
    json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-6", "--reason", "Verified", "--json"]);

    const commitAudit = run(["dp", "audit", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--target", "commit", "--json"]);
    assert.equal(commitAudit.status, 1);
    const commitPayload = JSON.parse(commitAudit.stdout);
    assert.equal(commitPayload.ok, false);
    assert.deepEqual(commitPayload.missing_decisions, ["DP-7"]);
    assert.ok(commitPayload.blocked_actions.includes("commit"));

    json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-7", "--reason", "Commit approved", "--json"]);
    const releaseAudit = json(["dp", "audit", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--target", "release", "--json"]);
    assert.equal(releaseAudit.ok, true);
    assert.deepEqual(releaseAudit.blocked_actions, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("task start blocks execution when a document chain has not been started", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-task-not-started-"));
  try {
    const payload = json([
      "task",
      "start",
      "--root",
      root,
      "--feature",
      "alpha",
      "--doc-id",
      "alpha-login",
      "--intent",
      "开始执行 alpha-login",
      "--json",
    ]);

    assert.equal(payload.entrypoint, "coding-plugins task start");
    assert.equal(payload.action, "start");
    assert.equal(payload.feature, "alpha");
    assert.equal(payload.doc_id, "alpha-login");
    assert.equal(payload.state, "not-started");
    assert.equal(payload.decision_point, "DP-0");
    assert.equal(payload.next_skill, "spec-driven-development");
    assert.ok(payload.allowed_actions.includes("scaffold-feature-docs"));
    assert.ok(payload.allowed_actions.includes("write-requirements"));
    assert.ok(payload.blocked_actions.includes("workflow-guard:execute"));
    assert.equal(payload.guard.pass, false);
    assert.equal(payload.brief, null);
    assert.match(payload.next_command, /scaffold-feature-docs alpha/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("workflow mode routes dependency SDK release work to the maintenance chain", () => {
  const payload = json([
    "workflow-mode",
    "--intent",
    "bump dependency range for SDK release compatibility window",
    "--json",
  ]);

  assert.equal(payload.mode, "maintenance-chain");
  assert.match(payload.reason, /dependency|SDK|release|compatibility/i);
});

test("scope-check allows docs-only work when actual files stay within docs", () => {
  const payload = json([
    "scope-check",
    "--mode",
    "docs-only",
    "--intent",
    "更新 README 和 TODO 说明",
    "--planned-files",
    "README.md,todo.md",
    "--actual-files",
    "README.md,todo.md",
    "--task-count",
    "1",
    "--feature-count",
    "1",
    "--json",
  ]);

  assert.equal(payload.ok, true);
  assert.deepEqual(payload.violations, []);
  assert.equal(payload.required_action, "continue");
});

test("scope-check blocks docs-only work that expands into source, tests, or tools", () => {
  const result = run([
    "scope-check",
    "--mode",
    "docs-only",
    "--intent",
    "更新 README 说明",
    "--planned-files",
    "README.md",
    "--actual-files",
    "README.md,src/cli/doctor.ts,tests/ts/productization-cli.test.mjs",
    "--task-count",
    "1",
    "--feature-count",
    "1",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.required_action, "reroute-workflow");
  assert.ok(payload.violations.some((violation) => violation.id === "docs-only-scope-expanded"));
  assert.ok(payload.blocked_actions.includes("continue-with-current-mode"));
});

test("scope-check requires task splitting when one task expands into multiple features", () => {
  const result = run([
    "scope-check",
    "--mode",
    "tdd-only",
    "--intent",
    "实现一个明确修复",
    "--planned-files",
    "src/lib/alpha.ts",
    "--actual-files",
    "src/lib/alpha.ts,src/lib/beta.ts",
    "--task-count",
    "1",
    "--feature-count",
    "2",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.required_action, "split-task");
  assert.ok(payload.violations.some((violation) => violation.id === "multiple-features-detected"));
});

test("scope-check upgrades README TODO work that expands into release actions", () => {
  const result = run([
    "scope-check",
    "--mode",
    "docs-only",
    "--intent",
    "补充 README 和 TODO",
    "--planned-files",
    "README.md,todo.md",
    "--actual-files",
    "README.md,todo.md,src/cli/release/prepare-release.ts",
    "--actions",
    "tag,publish",
    "--task-count",
    "1",
    "--feature-count",
    "1",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.recommended_mode, "maintenance-chain");
  assert.equal(payload.required_action, "upgrade-to-maintenance-chain");
  assert.ok(payload.violations.some((violation) => violation.id === "release-scope-expanded"));
  assert.ok(payload.blocked_actions.includes("tag"));
  assert.ok(payload.blocked_actions.includes("publish"));
});

test("release plan records completion standards and package dependency order", () => {
  const payload = json([
    "release",
    "plan",
    "--version",
    "1.2.3",
    "--package-order",
    "runtime,generator",
    "--json",
  ]);

  assert.equal(payload.ok, true);
  assert.equal(payload.version, "1.2.3");
  assert.deepEqual(payload.package_order, ["runtime", "generator"]);
  for (const standard of [
    "release_commit_pushed",
    "tag_pushed",
    "github_actions_success",
    "release_target_visible",
    "dependency_resolution_passed",
  ]) {
    assert.ok(payload.completion_standards.includes(standard));
  }
});

test("release plan rejects multi-package releases without dependency order", () => {
  const result = run([
    "release",
    "plan",
    "--version",
    "1.2.3",
    "--packages",
    "runtime,generator",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.missing_standards.includes("package_dependency_order"));
});

test("release verify blocks tag-pushed-only completion claims", () => {
  const result = run([
    "release",
    "verify",
    "--tag-pushed",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.ok(payload.missing_standards.includes("release_commit_pushed"));
  assert.ok(payload.missing_standards.includes("github_actions_success"));
  assert.ok(payload.missing_standards.includes("release_target_visible"));
  assert.ok(payload.missing_standards.includes("dependency_resolution_passed"));
  assert.ok(payload.violations.some((violation) => violation.id === "tag-pushed-is-not-release-complete"));
  assert.ok(payload.blocked_actions.includes("declare-release-complete"));
});

test("release guard passes only when all release completion standards are met", () => {
  const payload = json([
    "release",
    "guard",
    "--commit-pushed",
    "--tag-pushed",
    "--workflow-ok",
    "--release-visible",
    "--dependency-resolved",
    "--json",
  ]);

  assert.equal(payload.ok, true);
  assert.deepEqual(payload.missing_standards, []);
  assert.deepEqual(payload.blocked_actions, []);
});

test("commit-guard blocks missing language confirmation, sensitive files, and missing DP-7", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-commit-guard-"));
  try {
    const result = run([
      "commit-guard",
      "--root",
      root,
      "--feature",
      "alpha",
      "--doc-id",
      "alpha-login",
      "--author-name",
      "Vincen",
      "--author-email",
      "hx001007@gmail.com",
      "--branch",
      "main",
      "--changed-files",
      "src/index.ts,.env",
      "--json",
    ]);

    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.ok(payload.violations.some((violation) => violation.id === "commit-language-unconfirmed"));
    assert.ok(payload.violations.some((violation) => violation.id === "sensitive-file-staged"));
    assert.ok(payload.violations.some((violation) => violation.id === "main-branch-direct-commit"));
    assert.ok(payload.violations.some((violation) => violation.id === "dp7-not-approved"));
    assert.ok(payload.blocked_actions.includes("commit"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("commit-guard detects sensitive files from the staged git diff by default", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-commit-guard-staged-"));
  try {
    assert.equal(spawnSync("git", ["init"], { cwd: root, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.name", "Vincen"], { cwd: root, encoding: "utf8" }).status, 0);
    assert.equal(spawnSync("git", ["config", "user.email", "hx001007@gmail.com"], { cwd: root, encoding: "utf8" }).status, 0);
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "src/index.ts"), "export const ok = true;\n", "utf8");
    writeFileSync(join(root, ".env"), "TOKEN=redacted\n", "utf8");
    assert.equal(spawnSync("git", ["add", "src/index.ts", ".env"], { cwd: root, encoding: "utf8" }).status, 0);
    json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-6", "--reason", "Verified", "--json"]);
    json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-7", "--reason", "Commit approved", "--json"]);

    const result = run([
      "commit-guard",
      "--root",
      root,
      "--feature",
      "alpha",
      "--doc-id",
      "alpha-login",
      "--language",
      "zh",
      "--author-name",
      "Vincen",
      "--author-email",
      "hx001007@gmail.com",
      "--json",
    ]);

    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.deepEqual(payload.changed_files, [".env", "src/index.ts"]);
    assert.ok(payload.violations.some((violation) => violation.id === "sensitive-file-staged"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("commit-guard passes after language and DP-7 are explicitly approved", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-commit-guard-pass-"));
  try {
    json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-6", "--reason", "Verified", "--json"]);
    json(["dp", "approve", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--id", "DP-7", "--reason", "Commit approved", "--json"]);

    const payload = json([
      "commit-guard",
      "--root",
      root,
      "--feature",
      "alpha",
      "--doc-id",
      "alpha-login",
      "--language",
      "zh",
      "--author-name",
      "Vincen",
      "--author-email",
      "hx001007@gmail.com",
      "--branch",
      "codex/scope-check",
      "--changed-files",
      "src/index.ts,tests/ts/productization-cli.test.mjs",
      "--json",
    ]);

    assert.equal(payload.ok, true);
    assert.equal(payload.language_confirmed, true);
    assert.equal(payload.decision_status.ok, true);
    assert.deepEqual(payload.violations, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("completion report separates implementation, verification, commit, and release evidence", () => {
  const payload = json([
    "report",
    "completion",
    "--kind",
    "release",
    "--implemented",
    "release guard,session lock",
    "--verified",
    "npm run preflight=PASS,node --test tests/ts/productization-cli.test.mjs=PASS",
    "--unverified",
    "none",
    "--local-only",
    "npm run preflight",
    "--committed",
    "a8fa26b",
    "--published",
    "GitHub Release",
    "--workflow-run",
    "https://github.com/Vincen-dev/coding-plugins/actions/runs/1",
    "--remote-tag",
    "v1.0.18",
    "--package-visible",
    "https://github.com/Vincen-dev/coding-plugins/releases/tag/v1.0.18",
    "--commit-pushed",
    "--dependency-resolved",
    "--json",
  ]);

  assert.equal(payload.kind, "release");
  assert.deepEqual(payload.implemented, ["release guard", "session lock"]);
  assert.deepEqual(payload.unverified, []);
  assert.equal(payload.verified[0].command, "npm run preflight");
  assert.equal(payload.verified[0].status, "PASS");
  assert.deepEqual(payload.local_only_verification, ["npm run preflight"]);
  assert.deepEqual(payload.commits, ["a8fa26b"]);
  assert.equal(payload.release_evidence.workflow_run, "https://github.com/Vincen-dev/coding-plugins/actions/runs/1");
  assert.equal(payload.release_evidence.remote_tag, "v1.0.18");
  assert.equal(payload.release_evidence.package_visible, "https://github.com/Vincen-dev/coding-plugins/releases/tag/v1.0.18");
  assert.equal(payload.release_evidence.complete, true);
  assert.equal(payload.sections.includes("已实现"), true);
  assert.equal(payload.sections.includes("已发布"), true);
});

test("completion report uses the release completion standards before declaring release complete", () => {
  const result = run([
    "report",
    "completion",
    "--kind",
    "release",
    "--workflow-run",
    "https://github.com/Vincen-dev/coding-plugins/actions/runs/1",
    "--remote-tag",
    "v1.0.18",
    "--package-visible",
    "https://github.com/Vincen-dev/coding-plugins/releases/tag/v1.0.18",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.release_evidence.complete, false);
  assert.ok(payload.release_evidence.missing.includes("release_commit_pushed"));
  assert.ok(payload.release_evidence.missing.includes("dependency_resolution_passed"));
});

test("commit-guard rejects AI-like author identities", () => {
  const result = run([
    "commit-guard",
    "--language",
    "en",
    "--author-name",
    "Codex Bot",
    "--author-email",
    "bot@example.com",
    "--branch",
    "codex/test",
    "--changed-files",
    "src/index.ts",
    "--json",
  ]);

  assert.equal(result.status, 1);
  const payload = JSON.parse(result.stdout);
  assert.ok(payload.violations.some((violation) => violation.id === "invalid-author-identity"));
});

test("execution-contract generates a deterministic contract from the approved document chain", () => {
  const payload = json([
    "execution-contract",
    "generate",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--format",
    "json",
  ]);

  assert.equal(payload.contract.feature, "routing-fixture");
  assert.equal(payload.contract.doc_id, "routing-login");
  assert.match(payload.contract.source_hash, /^sha256:/);
  assert.ok(payload.contract.required_artifacts.includes("plans/routing-login-TED.md"));
  assert.ok(payload.contract.required_tests.length > 0);
  assert.equal(payload.failures.length, 0);
});

test("subagent prompt builder rejects stale expected source hashes", () => {
  const result = run([
    "subagent-prompt-builder",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--task",
    "TASK-001",
    "--kind",
    "implementer",
    "--expected-source-hash",
    "sha256:stale",
    "--json",
  ]);

  assert.equal(result.status, 1);
  assert.ok(result.stdout.includes("expected source_hash mismatch"));
});

test("subagent prompt builder requires an explicit expected source hash for implementation prompts", () => {
  const result = run([
    "subagent-prompt-builder",
    "--root",
    fixtureRoot,
    "--feature",
    "routing-fixture",
    "--doc-id",
    "routing-login",
    "--task",
    "TASK-001",
    "--kind",
    "implementer",
    "--json",
  ]);

  assert.equal(result.status, 1);
  assert.ok(result.stdout.includes("--expected-source-hash is required"));
});

test("schema validate/list/doctor/inject CLIs support arbitrary project roots", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-user-root-"));
  try {
    const fixtureCopy = join(root, "formal-feature-chain");
    cpSync(fixtureRoot, fixtureCopy, { recursive: true });
    rmSync(join(fixtureCopy, ".coding-plugins"), { recursive: true, force: true });

    const validation = json(["validate", "--root", fixtureCopy, "--format", "json"]);
    assert.equal(validation.ok, true);
    assert.ok(validation.documents.some((document) => document.kind === "PRD"));
    assert.ok(validation.documents.every((document) => Array.isArray(document.headings)));
    assert.ok(validation.documents.every((document) => Array.isArray(document.section_names)));
    assert.ok(validation.documents.every((document) => document.section_hashes && typeof document.section_hashes === "object"));
    assert.ok(validation.documents.every((document) => !("sections" in document)), "validate JSON should not include full section bodies by default");
    assert.ok(validation.chains.some((chain) => chain.feature === "routing-fixture" && chain.doc_id === "routing-login" && chain.ok));

    const validationWithSections = json(["validate", "--root", fixtureCopy, "--format", "json", "--include-sections"]);
    assert.ok(validationWithSections.documents.some((document) => document.sections && Object.keys(document.sections).length > 0));

    const strictFixtureValidation = json(["validate", "--root", fixtureCopy, "--format", "json", "--strict-chain"]);
    assert.equal(strictFixtureValidation.ok, true);

    const listed = json(["list", "--root", fixtureCopy, "--format", "json"]);
    assert.ok(listed.features.some((feature) => feature.feature === "routing-fixture" && feature.doc_ids.includes("routing-login")));

    const doctor = json(["doctor", "--root", fixtureCopy, "--format", "json"]);
    assert.equal(doctor.ok, true);
    assert.ok(doctor.checks.some((check) => check.name === "project-root"));

    const dryRun = json(["inject", "--root", root, "--platform", "cursor", "--dry-run", "--format", "json"]);
    assert.equal(dryRun.dry_run, true);
    assert.ok(dryRun.files.some((file) => file.endsWith(".cursor/rules/coding-plugins.mdc")));
    assert.equal(existsSync(join(root, ".cursor/rules/coding-plugins.mdc")), false);

    const injected = json(["inject", "--root", root, "--platform", "copilot", "--format", "json"]);
    assert.equal(injected.platform, "copilot");
    assert.ok(existsSync(join(root, ".github/copilot-instructions.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate fails evidence-only chains by default and only allows them when explicitly requested", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-evidence-only-chain-"));
  try {
    writeWorkflowDoc(root, "alpha", "evidences", "alpha-login", "VED", "## TDD 证据\n\nRED 命令 covers validation evidence.");

    const defaultResult = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(defaultResult.status, 1);
    const defaultPayload = JSON.parse(defaultResult.stdout);
    assert.equal(defaultPayload.ok, false);
    assert.ok(defaultPayload.chain_errors.some((error) => error.includes("missing artifacts: PRD, TSD, TVD, TED")));

    const evidenceOnly = json(["validate", "--root", root, "--format", "json", "--allow-evidence-only"]);
    assert.equal(evidenceOnly.ok, true);
    const chain = evidenceOnly.chains.find((item) => item.feature === "alpha");
    assert.equal(chain.chain_type, "evidence-only");
    assert.deepEqual(chain.missing_artifacts, ["PRD", "TSD", "TVD", "TED"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate reports artifact mode and rejects tracked docs ignored by gitignore", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-artifact-mode-"));
  try {
    writeFileSync(join(root, ".gitignore"), "docs/coding-plugins/\n", "utf8");

    const inferredLocal = json(["validate", "--root", root, "--format", "json"]);
    assert.equal(inferredLocal.artifact_mode.mode, "local");
    assert.equal(inferredLocal.artifact_mode.formal_evidence_allowed, false);

    writeArtifactMode(root, { mode: "tracked" });
    const tracked = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(tracked.status, 1);
    const trackedPayload = JSON.parse(tracked.stdout);
    assert.equal(trackedPayload.artifact_mode.mode, "tracked");
    assert.ok(trackedPayload.errors.some((error) => error.includes("tracked artifact mode")));
    assert.ok(trackedPayload.errors.some((error) => error.includes(".gitignore")));

    writeArtifactMode(root, { mode: "external" });
    const external = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(external.status, 1);
    const externalPayload = JSON.parse(external.stdout);
    assert.equal(externalPayload.artifact_mode.mode, "external");
    assert.ok(externalPayload.errors.some((error) => error.includes("external_reference")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("validate-tdd-evidence enforces formal evidence rules by artifact mode", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-evidence-mode-"));
  try {
    mkdirSync(join(root, "tests/ts"), { recursive: true });
    writeFileSync(join(root, "tests/ts/productization-cli.test.mjs"), "import test from 'node:test';\n", "utf8");
    const evidence = join(root, "docs/coding-plugins/features/alpha/evidences/alpha-login-VED.md");
    writeTddEvidence(evidence, { source: "General cleanup without a formal spec id." });

    const trackedMissingSpec = run(["validate-tdd-evidence", "--root", root, "--artifact-mode", "tracked", "--strict", "--format", "json", evidence]);
    assert.equal(trackedMissingSpec.status, 1);
    assert.ok(JSON.parse(trackedMissingSpec.stdout).results[0].errors.some((error) => error.includes("Spec ID")));

    const localMissingSpec = json(["validate-tdd-evidence", "--root", root, "--artifact-mode", "local", "--strict", "--format", "json", evidence]);
    assert.equal(localMissingSpec.ok, true);

    writeFileSync(join(root, ".gitignore"), "docs/coding-plugins/\n", "utf8");
    writeTddEvidence(evidence);
    const ignoredTracked = run(["validate-tdd-evidence", "--root", root, "--artifact-mode", "tracked", "--strict", "--format", "json", evidence]);
    assert.equal(ignoredTracked.status, 1);
    assert.ok(JSON.parse(ignoredTracked.stdout).results[0].errors.some((error) => error.includes("ignored evidence")));

    writeFileSync(join(root, ".gitignore"), "", "utf8");
    writeTddEvidence(evidence, {
      redTest: "`tests/ts/missing-productization.test.mjs`",
      redCommand: "`node --test tests/ts/missing-productization.test.mjs`",
    });
    const missingReference = run(["validate-tdd-evidence", "--root", root, "--artifact-mode", "tracked", "--strict", "--format", "json", evidence]);
    assert.equal(missingReference.status, 1);
    assert.ok(JSON.parse(missingReference.stdout).results[0].errors.some((error) => error.includes("referenced path does not exist")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("doctor audits plugin repository wiring and detects stale Codex cache versions", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "coding-plugins-codex-home-"));
  try {
    const repositoryDoctor = json(["doctor", "--root", repoRoot, "--format", "json"]);
    assert.equal(repositoryDoctor.ok, true);
    for (const expected of [
      "manifest-versions",
      "package-lock-version",
      "dist-entrypoints",
      "codex-hook-config",
      "platform-summary",
      "local-skills-entrypoint",
      "workflow-state-source",
      "cursor-inject-dry-run",
      "copilot-inject-dry-run",
      "path",
      "artifact-mode",
      "cli-status",
      "session-lock",
      "env-fvm-dart-cache",
      "env-build-runner",
      "env-github-auth",
      "env-pub-auth",
      "env-ssh-host-key",
    ]) {
      assert.ok(repositoryDoctor.checks.some((check) => check.name === expected && check.ok), `missing ok doctor check: ${expected}`);
    }
    const artifactMode = repositoryDoctor.checks.find((check) => check.name === "artifact-mode");
    assert.ok(artifactMode.message.includes("mode=tracked"));
    const pathCheck = repositoryDoctor.checks.find((check) => check.name === "path");
    assert.ok(pathCheck.message.includes("PATH="));

    const staleManifest = join(codexHome, "plugins/cache/personal/coding-plugins/1.0.12/.codex-plugin");
    mkdirSync(staleManifest, { recursive: true });
    writeFileSync(join(staleManifest, "plugin.json"), JSON.stringify({ name: "coding-plugins", version: "1.0.12" }, null, 2), "utf8");

    const stale = run(["doctor", "--root", repoRoot, "--codex-home", codexHome, "--format", "json"]);
    assert.equal(stale.status, 1);
    const payload = JSON.parse(stale.stdout);
    const platformSummary = payload.checks.find((check) => check.name === "platform-summary");
    assert.equal(platformSummary.ok, false);
    assert.ok(platformSummary.message.includes("codex=stale"));
    assert.ok(platformSummary.message.includes("cursor=dry-run-ok"));
    assert.ok(platformSummary.message.includes("copilot=dry-run-ok"));
    assert.ok(platformSummary.message.includes("claude=ok"));
    assert.ok(platformSummary.message.includes("gemini=ok"));
    assert.ok(platformSummary.message.includes("local-skills=ok"));
    const cacheCheck = payload.checks.find((check) => check.name === "codex-cache-version");
    assert.equal(cacheCheck.ok, false);
    assert.ok(cacheCheck.message.includes(`repository=${packageVersion}`));
    assert.ok(cacheCheck.message.includes("cache=1.0.12"));

    const currentManifest = join(codexHome, `plugins/cache/personal/coding-plugins/${packageVersion}/.codex-plugin`);
    mkdirSync(currentManifest, { recursive: true });
    writeFileSync(join(currentManifest, "plugin.json"), JSON.stringify({ name: "coding-plugins", version: packageVersion }, null, 2), "utf8");
    const mixed = run(["doctor", "--root", repoRoot, "--codex-home", codexHome, "--format", "json"]);
    assert.equal(mixed.status, 1);
    const mixedPayload = JSON.parse(mixed.stdout);
    const mixedCacheCheck = mixedPayload.checks.find((check) => check.name === "codex-cache-version");
    assert.equal(mixedCacheCheck.ok, false);
    assert.ok(mixedCacheCheck.message.includes("mixed cache versions"));
    assert.ok(mixedCacheCheck.message.includes("cache_manifest="));
  } finally {
    rmSync(codexHome, { recursive: true, force: true });
  }
});

test("doctor can promote required environment diagnostics to blocking checks", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-required-env-"));
  const home = mkdtempSync(join(tmpdir(), "coding-plugins-required-home-"));
  try {
    writeFileSync(join(root, "pubspec.yaml"), "dev_dependencies:\n  build_runner: ^2.4.0\n", "utf8");

    const result = run([
      "doctor",
      "--root",
      root,
      "--require-env",
      "github-auth,pub-auth,ssh-host-key,build-runner",
      "--format",
      "json",
    ], {
      env: { ...npmCacheEnv(), HOME: home, GH_TOKEN: "", GITHUB_TOKEN: "" },
    });

    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    for (const expected of ["env-github-auth", "env-pub-auth", "env-ssh-host-key", "env-build-runner"]) {
      const check = payload.checks.find((item) => item.name === expected);
      assert.equal(check.ok, false, `${expected} should block when required inputs are missing`);
      assert.match(check.message, /required=true/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  }
});

test("doctor requires build_runner to be resolved in package_config when requested", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-build-runner-env-"));
  try {
    mkdirSync(join(root, ".dart_tool"), { recursive: true });
    writeFileSync(join(root, "pubspec.yaml"), "dev_dependencies:\n  build_runner: ^2.4.0\n", "utf8");
    writeFileSync(
      join(root, ".dart_tool/package_config.json"),
      JSON.stringify({ configVersion: 2, packages: [{ name: "test", rootUri: "../.pub-cache/test" }] }, null, 2),
      "utf8",
    );

    const unresolved = run([
      "doctor",
      "--root",
      root,
      "--require-env",
      "build-runner",
      "--format",
      "json",
    ]);

    assert.equal(unresolved.status, 1);
    const unresolvedPayload = JSON.parse(unresolved.stdout);
    const unresolvedCheck = unresolvedPayload.checks.find((item) => item.name === "env-build-runner");
    assert.equal(unresolvedCheck.ok, false);
    assert.match(unresolvedCheck.message, /package_config=missing-build_runner/);

    writeFileSync(
      join(root, ".dart_tool/package_config.json"),
      JSON.stringify({ configVersion: 2, packages: [{ name: "build_runner", rootUri: "../.pub-cache/build_runner" }] }, null, 2),
      "utf8",
    );

    const resolved = run([
      "doctor",
      "--root",
      root,
      "--require-env",
      "build-runner",
      "--format",
      "json",
    ]);
    const resolvedPayload = JSON.parse(resolved.stdout);
    const resolvedCheck = resolvedPayload.checks.find((item) => item.name === "env-build-runner");
    assert.equal(resolvedCheck.ok, true);
    assert.match(resolvedCheck.message, /package_config=build_runner/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("migration guide documents lightweight/full-chain routing and artifact mode boundaries", () => {
  const guide = readFileSync(join(repoRoot, "docs/migration-guide.md"), "utf8");
  for (const expected of [
    "lightweight TDD",
    "full-chain",
    "maintenance-chain",
    "tracked",
    "local",
    "external",
    "docs/coding-plugins/",
    "commit, tag, release",
  ]) {
    assert.ok(guide.includes(expected), `migration guide must mention ${expected}`);
  }
});

test("runtime command surfaces provide CP_CLI fallback when coding-plugins is not on PATH", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(packageJson.scripts.test, "npm run preflight");

  for (const relativePath of [
    "README.md",
    "INSTALL.md",
    "skills/using-coding-plugins/SKILL.md",
    "skills/test-driven-development/SKILL.md",
    "src/lib/platform/project-install.ts",
  ]) {
    const text = readFileSync(join(repoRoot, relativePath), "utf8");
    assert.ok(text.includes("CP_CLI"), `${relativePath} must document the SessionStart CLI fallback`);
  }
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  const install = readFileSync(join(repoRoot, "INSTALL.md"), "utf8");
  assert.ok(readme.includes("cli status --format json"));
  assert.ok(readme.includes("cli install --scope user"));
  assert.ok(install.includes("cli status --format json"));
  assert.ok(install.includes("cli install --scope user"));
});

test("cli status reports fallback command when coding-plugins is not on PATH", () => {
  const targetRoot = mkdtempSync(join(tmpdir(), "coding-plugins-cli-status-"));
  try {
    const target = join(targetRoot, "bin", "coding-plugins");
    const payload = json(["cli", "status", "--root", targetRoot, "--target", target, "--thread-id", "thread-a", "--format", "json"], {
      env: { ...npmCacheEnv(), PATH: dirname(process.execPath) },
    });

    assert.equal(payload.cli_on_path, false);
    assert.equal(payload.shim_target, target);
    assert.equal(payload.shim_exists, false);
    assert.equal(payload.fallback_argv[0], process.execPath);
    assert.equal(payload.fallback_argv[1], bin);
    assert.ok(payload.fallback_command.includes("bin/coding-plugins.js"));
    assert.equal(payload.recommended_action, "install-cli-shim-or-use-fallback");
    assert.equal(payload.session_lock.ok, true);
    assert.equal(payload.session_lock.lock.thread_id, "thread-a");
    assert.equal(payload.session_lock.lock.plugin_version, packageVersion);
    assert.equal(existsSync(join(targetRoot, ".coding-plugins/session-lock.json")), true);
  } finally {
    rmSync(targetRoot, { recursive: true, force: true });
  }
});

test("cli status reuses session lock and reports mixed plugin versions", () => {
  const targetRoot = mkdtempSync(join(tmpdir(), "coding-plugins-session-lock-"));
  try {
    const lockDirectory = join(targetRoot, ".coding-plugins");
    mkdirSync(lockDirectory, { recursive: true });
    const lockedCli = join(targetRoot, "locked-cache/bin/coding-plugins.js");
    writeFileSync(
      join(lockDirectory, "session-lock.json"),
      JSON.stringify(
        {
          schema_version: 1,
          plugin_version: "1.0.0",
          plugin_root: join(targetRoot, "locked-cache"),
          cli_path: lockedCli,
          thread_id: "thread-a",
          created_at: "2026-07-06T00:00:00.000Z",
        },
        null,
        2,
      ),
      "utf8",
    );

    const payload = json(["cli", "status", "--root", targetRoot, "--thread-id", "thread-a", "--format", "json"], {
      env: { ...npmCacheEnv(), PATH: dirname(process.execPath) },
    });

    assert.equal(payload.session_lock.ok, false);
    assert.ok(payload.session_lock.errors.some((error) => error.includes("plugin_version")));
    assert.ok(payload.session_lock.errors.some((error) => error.includes("cli_path is not available")));
    assert.deepEqual(payload.fallback_argv, []);
    assert.equal(payload.fallback_command, "");
    assert.equal(payload.recommended_action, "repair-session-lock");
  } finally {
    rmSync(targetRoot, { recursive: true, force: true });
  }
});

test("cli install creates a user shim that runs the packaged CLI", () => {
  const targetRoot = mkdtempSync(join(tmpdir(), "coding-plugins-cli-install-"));
  try {
    const target = join(targetRoot, "bin", "coding-plugins");
    const installed = json(["cli", "install", "--target", target, "--format", "json"], {
      env: npmCacheEnv(),
    });

    assert.equal(installed.installed, true);
    assert.equal(installed.target, target);
    assert.equal(installed.scope, "user");
    assert.ok(existsSync(target));

    const shimText = readFileSync(target, "utf8");
    assert.ok(shimText.includes(bin));
    assert.ok(shimText.includes('exec "'));

    const help = spawnSync(target, ["--help"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: npmCacheEnv(),
    });
    assert.equal(help.status, 0, help.stderr);
    assert.ok(help.stdout.includes("Usage: coding-plugins <command> [args]"));

    const status = json(["cli", "status", "--root", targetRoot, "--target", target, "--format", "json"], {
      env: { ...npmCacheEnv(), PATH: `${join(targetRoot, "bin")}:${dirname(process.execPath)}` },
    });
    assert.equal(status.cli_on_path, true);
    assert.equal(status.shim_exists, true);
    assert.equal(status.shim_points_to_current_cli, true);
    assert.equal(status.recommended_action, "none");
  } finally {
    rmSync(targetRoot, { recursive: true, force: true });
  }
});

test("cli uninstall removes only the current coding-plugins shim", () => {
  const targetRoot = mkdtempSync(join(tmpdir(), "coding-plugins-cli-uninstall-"));
  try {
    const target = join(targetRoot, "bin", "coding-plugins");
    json(["cli", "install", "--target", target, "--format", "json"]);
    assert.ok(existsSync(target));

    const removed = json(["cli", "uninstall", "--target", target, "--format", "json"]);
    assert.equal(removed.removed, true);
    assert.equal(removed.target, target);
    assert.equal(existsSync(target), false);

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, "#!/usr/bin/env sh\nexit 0\n", "utf8");
    chmodSync(target, 0o755);
    const refused = run(["cli", "uninstall", "--target", target, "--format", "json"]);
    assert.equal(refused.status, 1);
    assert.ok(refused.stderr.includes("refusing to remove non-coding-plugins shim"));
    assert.ok(existsSync(target));
  } finally {
    rmSync(targetRoot, { recursive: true, force: true });
  }
});

test("doctor checks active Codex plugin enablement from codex plugin list json", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "coding-plugins-codex-enabled-"));
  const fakeBin = mkdtempSync(join(tmpdir(), "coding-plugins-fake-bin-"));
  try {
    const manifest = join(codexHome, `plugins/cache/personal/coding-plugins/${packageVersion}/.codex-plugin`);
    mkdirSync(manifest, { recursive: true });
    writeFileSync(join(manifest, "plugin.json"), JSON.stringify({ name: "coding-plugins", version: packageVersion }, null, 2), "utf8");
    const codex = join(fakeBin, "codex");
    writeFileSync(
      codex,
      [
        "#!/bin/sh",
        "if [ \"$1\" = \"plugin\" ] && [ \"$2\" = \"list\" ] && [ \"$3\" = \"--json\" ]; then",
        `  printf '%s\\n' '[{"pluginId":"coding-plugins@personal","version":"${packageVersion}","installed":true,"enabled":true}]'`,
        "  exit 0",
        "fi",
        "exit 1",
        "",
      ].join("\n"),
      "utf8",
    );
    chmodSync(codex, 0o755);

    const payload = json(["doctor", "--root", repoRoot, "--codex-home", codexHome, "--format", "json"], {
      env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ""}` },
    });
    const enabled = payload.checks.find((check) => check.name === "codex-plugin-enabled");
    assert.equal(enabled.ok, true);
    assert.ok(enabled.message.includes("enabled=true"));
  } finally {
    rmSync(codexHome, { recursive: true, force: true });
    rmSync(fakeBin, { recursive: true, force: true });
  }
});

test("doctor times out Codex plugin list and falls back to config enabled state", () => {
  const codexHome = mkdtempSync(join(tmpdir(), "coding-plugins-codex-timeout-"));
  const fakeBin = mkdtempSync(join(tmpdir(), "coding-plugins-fake-bin-timeout-"));
  try {
    const manifest = join(codexHome, `plugins/cache/personal/coding-plugins/${packageVersion}/.codex-plugin`);
    mkdirSync(manifest, { recursive: true });
    writeFileSync(join(manifest, "plugin.json"), JSON.stringify({ name: "coding-plugins", version: packageVersion }, null, 2), "utf8");
    writeFileSync(join(codexHome, "config.toml"), "[plugins.\"coding-plugins@personal\"]\nenabled = true\n", "utf8");
    const codex = join(fakeBin, "codex");
    writeFileSync(codex, "#!/bin/sh\nsleep 5\n", "utf8");
    chmodSync(codex, 0o755);

    const started = Date.now();
    const payload = json(["doctor", "--root", repoRoot, "--codex-home", codexHome, "--format", "json"], {
      env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ""}` },
    });
    const elapsed = Date.now() - started;
    const enabled = payload.checks.find((check) => check.name === "codex-plugin-enabled");
    assert.equal(enabled.ok, true);
    assert.ok(enabled.message.includes("config.toml fallback"));
    assert.ok(elapsed < 2500, `doctor should not wait for a hanging codex command, elapsed=${elapsed}`);
  } finally {
    rmSync(codexHome, { recursive: true, force: true });
    rmSync(fakeBin, { recursive: true, force: true });
  }
});

test("state source uses a lock and atomic rename when mutating .coding-plugins.yaml", () => {
  const source = readFileSync(join(repoRoot, "src/lib/workflow/project-state.ts"), "utf8");
  assert.ok(source.includes("withStateFileLock"), "state mutations must be serialized with a lock");
  assert.ok(source.includes("renameSync"), "state writes must atomically rename a temp file into place");
  assert.ok(source.includes(".tmp-"), "state writes must use a temporary file before replacement");
});

test("state check rejects unsupported hand-edited YAML instead of silently falling back", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-state-invalid-yaml-"));
  try {
    writeFileSync(
      join(root, ".coding-plugins.yaml"),
      [
        "schema_version: 2",
        "active:",
        "  feature: alpha",
        "  doc_id: alpha-login",
        "workflows:",
        "  - schema_version: 1",
        "    workflow: full-chain",
        "    feature: alpha",
        "    doc_id: alpha-login",
        "    state: ready-for-plan",
        "    updated_at: |",
        "      2026-07-04T00:00:00.000Z",
        "    artifacts_hash: sha256:abc",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = run(["state", "check", "--root", root, "--json"]);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("Unsupported .coding-plugins.yaml syntax"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("state check rejects unknown YAML keys in workflow records", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-state-unknown-yaml-"));
  try {
    writeFileSync(
      join(root, ".coding-plugins.yaml"),
      [
        "schema_version: 2",
        "active:",
        "  feature: alpha",
        "  doc_id: alpha-login",
        "workflows:",
        "  - schema_version: 1",
        "    workflow: full-chain",
        "    feature: alpha",
        "    doc_id: alpha-login",
        "    state: ready-for-plan",
        "    updated_at: 2026-07-04T00:00:00.000Z",
        "    artifacts_hash: sha256:abc",
        "    unexpected_key: should-fail",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = run(["state", "check", "--root", root, "--json"]);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("Unsupported .coding-plugins.yaml key"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate rejects incomplete PRD/TSD/TVD/TED/VED chains even when individual docs parse", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-invalid-chain-"));
  try {
    writeWorkflowDoc(root, "alpha", "requirements", "alpha-login", "PRD", "REQ-001 must be traceable.");
    writeWorkflowDoc(root, "alpha", "technicals", "alpha-login", "TSD", "REQ-001 maps to TD-001.");
    writeWorkflowDoc(root, "alpha", "plans", "alpha-login", "TED", "TASK-001 covers REQ-001.");
    writeWorkflowDoc(root, "alpha", "evidences", "alpha-login", "VED", "Evidence for REQ-001.");

    const result = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.ok(payload.chain_errors.some((error) => error.includes("alpha/alpha-login missing artifacts: TVD")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate reports workflow violations when formal execution artifacts are not approved", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-unapproved-chain-"));
  const bodies = approvedChainBodies();
  try {
    writeWorkflowDoc(root, "alpha", "requirements", "alpha-login", "PRD", bodies.PRD);
    writeWorkflowDoc(root, "alpha", "technicals", "alpha-login", "TSD", bodies.TSD, { status: "draft" });
    writeWorkflowDoc(root, "alpha", "test-cases", "alpha-login", "TVD", bodies.TVD);
    writeWorkflowDoc(root, "alpha", "plans", "alpha-login", "TED", bodies.TED);
    writeWorkflowDoc(root, "alpha", "evidences", "alpha-login", "VED", bodies.VED);

    const result = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    const chain = payload.chains.find((item) => item.feature === "alpha" && item.doc_id === "alpha-login");
    assert.equal(chain.ok, false);
    assert.ok(chain.workflow_violations.some((violation) => violation.includes("TSD status 'draft' is not approved")));
    assert.ok(payload.chain_errors.some((error) => error.includes("workflow violation")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate reports workflow violations when implementation is marked before downstream planning is approved", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-implemented-before-plan-"));
  const bodies = approvedChainBodies();
  try {
    writeWorkflowDoc(root, "alpha", "requirements", "alpha-login", "PRD", bodies.PRD);
    writeWorkflowDoc(root, "alpha", "technicals", "alpha-login", "TSD", bodies.TSD, {
      frontmatter: [
        "lifecycle_status: implemented",
        "implemented_commits:",
        "  - 5c105ee",
        "validated_by: npm run preflight",
      ],
    });
    writeWorkflowDoc(root, "alpha", "evidences", "alpha-login", "VED", bodies.VED);

    const result = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    const chain = payload.chains.find((item) => item.feature === "alpha" && item.doc_id === "alpha-login");
    assert.equal(chain.ok, false);
    assert.ok(chain.workflow_violations.some((violation) => violation.includes("TSD is marked implemented before TVD, TED are approved")));
    assert.ok(payload.chain_errors.some((error) => error.includes("workflow violation")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate rejects shallow documents that miss semantic IDs and execution sections", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-shallow-chain-"));
  try {
    writeWorkflowDoc(root, "alpha", "requirements", "alpha-login", "PRD", "No stable requirement id is documented.");
    writeWorkflowDoc(root, "alpha", "technicals", "alpha-login", "TSD", "No implementation mapping is documented.");
    writeWorkflowDoc(root, "alpha", "test-cases", "alpha-login", "TVD", "No TC id is documented.");
    writeWorkflowDoc(root, "alpha", "plans", "alpha-login", "TED", "No task id or execution lock is documented.");
    writeWorkflowDoc(root, "alpha", "evidences", "alpha-login", "VED", "No evidence block is documented.");

    const result = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, false);
    assert.ok(payload.errors.some((error) => error.includes("PRD must declare at least one REQ id")));
    assert.ok(payload.errors.some((error) => error.includes("TVD must declare at least one TC id")));
    assert.ok(payload.errors.some((error) => error.includes("TED must declare at least one TASK id")));
    assert.ok(payload.errors.some((error) => error.includes("TED execution lock section is missing")));
    assert.ok(payload.errors.some((error) => error.includes("VED must include TDD evidence or validation evidence")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("schema validate rejects documents that have IDs but miss required structured sections", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-missing-sections-"));
  try {
    writeWorkflowDoc(root, "alpha", "requirements", "alpha-login", "PRD", "REQ-001 must be traceable.");
    writeWorkflowDoc(root, "alpha", "technicals", "alpha-login", "TSD", "REQ-001 maps to TD-001.");
    writeWorkflowDoc(root, "alpha", "test-cases", "alpha-login", "TVD", "TC-001 covers REQ-001.");
    writeWorkflowDoc(
      root,
      "alpha",
      "plans",
      "alpha-login",
      "TED",
      [
        "## 执行锁定区",
        "TASK-001 covers REQ-001.",
        "## 执行简报",
        "TASK-001 brief.",
        "## 任务总览",
        "TASK-001 summary.",
      ].join("\n"),
    );
    writeWorkflowDoc(root, "alpha", "evidences", "alpha-login", "VED", "## TDD 证据\n\nRED 命令 covers REQ-001.");

    const result = run(["validate", "--root", root, "--format", "json"]);
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    assert.ok(payload.errors.some((error) => error.includes("PRD is missing required sections")));
    assert.ok(payload.errors.some((error) => error.includes("成功指标")));
    assert.ok(payload.errors.some((error) => error.includes("假设与依赖")));
    assert.ok(payload.errors.some((error) => error.includes("开放问题")));
    assert.ok(payload.errors.some((error) => error.includes("TSD is missing required sections")));
    assert.ok(payload.errors.some((error) => error.includes("备选方案")));
    assert.ok(payload.errors.some((error) => error.includes("非功能设计")));
    assert.ok(payload.errors.some((error) => error.includes("上线 / 回滚")));
    assert.ok(payload.errors.some((error) => error.includes("TVD is missing required sections")));
    assert.ok(payload.errors.some((error) => error.includes("风险到测试映射")));
    assert.ok(payload.errors.some((error) => error.includes("测试环境与数据")));
    assert.ok(payload.errors.some((error) => error.includes("通过 / 失败标准")));
    assert.ok(payload.errors.some((error) => error.includes("自动化状态")));
    assert.ok(payload.errors.some((error) => error.includes("TED is missing required sections")));
    assert.ok(payload.errors.some((error) => error.includes("任务依赖与并行性")));
    assert.ok(payload.errors.some((error) => error.includes("中止条件")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("Cursor/Copilot install commands smoke-test real file writes", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-install-"));
  try {
    writeFileSync(join(root, ".gitignore"), "node_modules/\n", "utf8");
    const cursor = json(["install-cursor", "--root", root, "--format", "json"]);
    assert.equal(cursor.platform, "cursor");
    assert.ok(cursor.files.includes(".gitignore"));
    const cursorFile = join(root, ".cursor/rules/coding-plugins.mdc");
    assert.ok(existsSync(cursorFile));
    const gitignoreFile = join(root, ".gitignore");
    assert.equal(readFileSync(gitignoreFile, "utf8"), "node_modules/\n\ndocs/coding-plugins/\n");
    writeFileSync(cursorFile, "existing cursor rules\n", "utf8");
    const duplicateCursor = run(["install-cursor", "--root", root, "--format", "json"]);
    assert.equal(duplicateCursor.status, 1);
    assert.equal(readFileSync(cursorFile, "utf8"), "existing cursor rules\n");
    const forcedCursor = json(["install-cursor", "--root", root, "--force", "--format", "json"]);
    assert.equal(forcedCursor.overwritten, true);
    const forcedCursorText = readFileSync(cursorFile, "utf8");
    assert.ok(forcedCursorText.includes("alwaysApply: true"));
    assert.ok(forcedCursorText.includes("globs: **/*"));

    const copilot = json(["install-copilot", "--root", root, "--format", "json"]);
    assert.equal(copilot.platform, "copilot");
    const copilotFile = join(root, ".github/copilot-instructions.md");
    assert.ok(existsSync(copilotFile));
    assert.ok(readFileSync(copilotFile, "utf8").includes("apply to every coding task"));
    assert.equal(readFileSync(gitignoreFile, "utf8"), "node_modules/\n\ndocs/coding-plugins/\n");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("build emits dist JavaScript and types for package consumers", async () => {
  const result = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: npmCacheEnv(),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(repoRoot, "dist/index.js")));
  assert.ok(existsSync(join(repoRoot, "dist/index.d.ts")));
  const module = await import(`${join(repoRoot, "dist/index.js")}?cache=${Date.now()}`);
  assert.equal(typeof module.validateDocumentSchemas, "function");
  assert.equal(typeof module.buildExecutionContract, "function");

  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  assert.equal(packageJson.main, "./dist/index.js");
  assert.equal(packageJson.types, "./dist/index.d.ts");
});

test("library schema validation can return section summaries without full markdown bodies", async () => {
  const result = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: npmCacheEnv(),
  });
  assert.equal(result.status, 0, result.stderr);

  const module = await import(`${join(repoRoot, "dist/index.js")}?summary=${Date.now()}`);
  const defaultValidation = module.validateDocumentSchemas(fixtureRoot);
  assert.equal(defaultValidation.ok, true);
  assert.ok(defaultValidation.documents.length > 0);
  assert.ok(defaultValidation.documents.every((document) => !("sections" in document)));

  const validation = module.validateDocumentSchemas(fixtureRoot, { includeSections: false });
  assert.equal(validation.ok, true);
  assert.ok(validation.documents.length > 0);
  assert.ok(validation.documents.every((document) => !("sections" in document)));
  assert.ok(validation.documents.every((document) => Array.isArray(document.section_names)));
  assert.ok(validation.documents.every((document) => document.section_hashes && typeof document.section_hashes === "object"));
});
