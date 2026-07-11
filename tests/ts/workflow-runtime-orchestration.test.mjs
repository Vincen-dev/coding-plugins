import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { artifactPath, computeUpstreamHash } from "../../src/lib/workflow/workflow-state.ts";
import { checkCommitGuard } from "../../src/lib/git/commit-guard.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const taskCli = join(repoRoot, "src/cli/task.ts");

function writeArtifact(root, context, suffix, status, body = "") {
  const path = artifactPath(root, { ...context, suffix });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, [
    "---",
    `title: ${suffix}`,
    `status: ${status}`,
    "workflow_schema: governed-v2",
    `feature: ${context.feature}`,
    `doc_id: ${context.docId}`,
    "---",
    `# ${suffix}`,
    body,
    "",
  ].join("\n"), "utf8");
  return path;
}

function runTask(root, args) {
  return spawnSync("node", [taskCli, ...args, "--root", root, "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

test("REQ-005/007/010 task approve drives the governed-v2 approval chain", () => {
  const root = mkdtempSync(join(tmpdir(), "workflow-task-approve-v2-"));
  const context = { feature: "alpha", docId: "alpha-change" };
  try {
    writeArtifact(root, context, "PRD", "approved", "REQ-001");
    writeArtifact(root, context, "TSD", "review-ready", "## Policy-to-Design Mapping");
    writeArtifact(root, context, "TVD", "review-ready", "## Policy Verification");
    const premature = runTask(root, [
      "approve", "--feature", context.feature, "--doc-id", context.docId,
      "--id", "DP-2", "--reason", "too early", "--contract-version", "2",
    ]);
    assert.equal(premature.status, 1);
    assert.match(readFileSync(artifactPath(root, { ...context, suffix: "TSD" }), "utf8"), /^status: review-ready$/m);

    for (const id of ["DP-1", "DP-2"]) {
      const result = runTask(root, [
        "approve",
        "--feature", context.feature,
        "--doc-id", context.docId,
        "--id", id,
        "--reason", `${id} approved`,
        "--contract-version", "2",
      ]);
      assert.equal(result.status, 0, result.stderr);
      const payload = JSON.parse(result.stdout);
      assert.equal(payload.id, id);
      assert.equal(payload.catalog_version, "governed-v2");
      assert.equal(payload.approved, true);
    }

    const sourceHash = computeUpstreamHash(root, context);
    const ted = writeArtifact(root, context, "TED", "approved", "## Rollback\n\n## Verification Gates");
    writeFileSync(ted, readFileSync(ted, "utf8").replace("---\n# TED", `source_hash: ${sourceHash}\n---\n# TED`), "utf8");
    const execution = runTask(root, [
      "approve", "--feature", context.feature, "--doc-id", context.docId,
      "--id", "DP-3", "--reason", "DP-3 approved", "--contract-version", "2",
    ]);
    assert.equal(execution.status, 0, execution.stderr);
    assert.equal(JSON.parse(execution.stdout).approved, true);

    const decisions = JSON.parse(readFileSync(join(root, ".coding-plugins-decisions.json"), "utf8"));
    assert.deepEqual(decisions.decisions.map((item) => item.id).sort(), ["DP-1", "DP-2", "DP-3"]);

    const status = runTask(root, [
      "status", "--intent", "继续", "--feature", context.feature, "--doc-id", context.docId, "--contract-version", "2",
    ]);
    assert.equal(status.status, 0, status.stderr);
    const statusPayload = JSON.parse(status.stdout);
    assert.equal(statusPayload.state, "ready-for-execution");
    assert.equal(statusPayload.next.action, "execute-approved-plan");
    assert.equal(JSON.stringify(statusPayload).includes("DP-4"), false);

    const commitGuard = checkCommitGuard({
      root,
      feature: context.feature,
      docId: context.docId,
      language: "zh",
      authorName: "Vincen",
      authorEmail: "hx001007@gmail.com",
      branch: "main",
      allowMain: true,
      changedFiles: ["src/example.ts"],
    });
    assert.equal(commitGuard.ok, false);
    assert.equal(commitGuard.violations.some((item) => item.id === "dp7-not-approved"), false);
    assert.equal(commitGuard.violations.some((item) => item.id === "completion-not-approved"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-003/004 task start persists Standard Change and continue detects governed scope expansion", () => {
  const root = mkdtempSync(join(tmpdir(), "workflow-task-active-change-"));
  try {
    const started = runTask(root, [
      "start",
      "--intent", "修改按钮图标",
      "--change-id", "ui-refresh",
      "--planned-file", "src/ui/button.ts",
      "--contract-version", "2",
    ]);
    assert.equal(started.status, 0, started.stderr);
    assert.equal(existsSync(join(root, ".coding-plugins/runtime-state.json")), true);
    assert.equal(existsSync(join(root, "docs/coding-plugins/changes/ui-refresh/change.md")), true);

    const continued = runTask(root, [
      "continue",
      "--intent", "新增 public API",
      "--change-id", "ui-refresh",
      "--planned-file", "src/public-api.ts",
      "--contract-version", "2",
    ]);
    assert.equal(continued.status, 0, continued.stderr);
    const payload = JSON.parse(continued.stdout);
    assert.equal(payload.flow, "governed-change");
    assert.equal(payload.state, "needs-rescope");
    assert.equal(payload.scope.relation, "expanded");
    assert.ok(payload.blockedActions.includes("execute-change"));

    const active = JSON.parse(readFileSync(join(root, ".coding-plugins/runtime-state.json"), "utf8"));
    assert.equal(active.state, "needs-rescope");
    assert.deepEqual(active.scope.plannedFiles, ["src/ui/button.ts"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-007 DP-2 does not accept a Policy ID mentioned outside the required mapping section", () => {
  const root = mkdtempSync(join(tmpdir(), "workflow-task-policy-section-"));
  const context = { feature: "alpha", docId: "alpha-change" };
  try {
    mkdirSync(join(root, "policies"), { recursive: true });
    writeFileSync(join(root, "policies/base.md"), "# Base policy\n", "utf8");
    writeFileSync(join(root, "coding-plugins.policies.yaml"), JSON.stringify({
      schemaVersion: 1,
      policies: [{
        id: "POL-BASE-001",
        version: "1",
        level: "required",
        source: { kind: "repository", ref: "policies/base.md" },
        verification: [{ kind: "test", ref: "node --test" }],
      }],
    }), "utf8");
    writeArtifact(root, context, "PRD", "approved", "REQ-001");
    writeArtifact(root, context, "TSD", "review-ready", [
      "## Engineering Profile",
      "POL-BASE-001 is required.",
      "## Policy-to-Design Mapping",
      "No mapping was provided.",
    ].join("\n"));
    writeArtifact(root, context, "TVD", "review-ready", [
      "## Engineering Policy 测试",
      "TC-POL-001 / POL-BASE-001",
    ].join("\n"));

    const scope = runTask(root, ["approve", "--feature", context.feature, "--doc-id", context.docId, "--id", "DP-1", "--reason", "scope"]);
    assert.equal(scope.status, 0, scope.stderr);
    const technical = runTask(root, ["approve", "--feature", context.feature, "--doc-id", context.docId, "--id", "DP-2", "--reason", "technical"]);
    assert.equal(technical.status, 1, technical.stderr);
    const payload = JSON.parse(technical.stdout);
    assert.ok(payload.blockers.includes("POLICY_DESIGN_MISSING:POL-BASE-001"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-009/010 task complete rejects a complete VED without valid formal evidence", () => {
  const root = mkdtempSync(join(tmpdir(), "workflow-task-complete-v2-"));
  const context = { feature: "alpha", docId: "alpha-change" };
  try {
    writeArtifact(root, context, "PRD", "approved", "REQ-001");
    writeArtifact(root, context, "TSD", "approved", "POL-ARCH-001");
    writeArtifact(root, context, "TVD", "approved", "POL-ARCH-001");
    const hash = computeUpstreamHash(root, context);
    const ted = writeArtifact(root, context, "TED", "approved", "POL-ARCH-001");
    const tedText = readFileSync(ted, "utf8").replace("---\n# TED", `source_hash: ${hash}\n---\n# TED`);
    writeFileSync(ted, tedText, "utf8");
    writeArtifact(root, context, "VED", "complete", "No TDD evidence here.");

    for (const id of ["DP-1", "DP-2", "DP-3"]) {
      const approved = runTask(root, ["approve", "--feature", context.feature, "--doc-id", context.docId, "--id", id, "--reason", id]);
      assert.equal(approved.status, 0, approved.stderr);
    }

    const result = runTask(root, ["complete", "--feature", context.feature, "--doc-id", context.docId]);
    assert.equal(result.status, 1, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.formalCompletionAllowed, false);
    assert.ok(payload.blockers.includes("EVIDENCE_NOT_FORMAL"));

    const status = runTask(root, ["status", "--intent", "继续", "--feature", context.feature, "--doc-id", context.docId, "--contract-version", "2"]);
    assert.equal(status.status, 0, status.stderr);
    const statusPayload = JSON.parse(status.stdout);
    assert.equal(statusPayload.state, "completion-blocked");
    assert.ok(statusPayload.blockers.includes("EVIDENCE_NOT_FORMAL"));
    assert.equal(statusPayload.next.action, "resolve-completion-blockers");
    assert.equal(statusPayload.next.command.name, "task");
    assert.equal(statusPayload.next.command.args[0], "complete");
    assert.ok(statusPayload.blockedActions.includes("commit"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
