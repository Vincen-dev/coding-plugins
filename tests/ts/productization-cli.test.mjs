import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const bin = join(repoRoot, "bin/coding-plugins.js");
const fixtureRoot = join(repoRoot, "tests/fixtures/formal-feature-chain");

function run(args, options = {}) {
  return spawnSync("node", [bin, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: "/private/tmp/codex-npm-cache", npm_config_cache: "/private/tmp/codex-npm-cache" },
    ...options,
  });
}

function json(args, options = {}) {
  const result = run(args, options);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function writeWorkflowDoc(root, feature, directory, docId, suffix, body) {
  const dir = join(root, "docs/coding-plugins/features", feature, directory);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${docId}-${suffix}.md`),
    [
      "---",
      `title: ${docId} ${suffix}`,
      "status: approved",
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

test("state CLI initializes, checks, transitions, and audits .coding-plugins.yaml", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-state-"));
  try {
    const init = json(["state", "init", "--root", root, "--feature", "alpha", "--doc-id", "alpha-login", "--state", "requirements-draft", "--json"]);
    assert.equal(init.state, "requirements-draft");
    assert.equal(init.feature, "alpha");
    assert.ok(existsSync(join(root, ".coding-plugins.yaml")));

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

test("schema validate/list/doctor/inject CLIs support arbitrary project roots", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-user-root-"));
  try {
    const validation = json(["validate", "--root", fixtureRoot, "--format", "json"]);
    assert.equal(validation.ok, true);
    assert.ok(validation.documents.some((document) => document.kind === "PRD"));
    assert.ok(validation.documents.every((document) => Array.isArray(document.headings)));
    assert.ok(validation.chains.some((chain) => chain.feature === "routing-fixture" && chain.doc_id === "routing-login" && chain.ok));

    const listed = json(["list", "--root", fixtureRoot, "--format", "json"]);
    assert.ok(listed.features.some((feature) => feature.feature === "routing-fixture" && feature.doc_ids.includes("routing-login")));

    const doctor = json(["doctor", "--root", fixtureRoot, "--format", "json"]);
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

test("Cursor/Copilot install commands smoke-test real file writes", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-install-"));
  try {
    const cursor = json(["install-cursor", "--root", root, "--format", "json"]);
    assert.equal(cursor.platform, "cursor");
    const cursorFile = join(root, ".cursor/rules/coding-plugins.mdc");
    assert.ok(existsSync(cursorFile));
    writeFileSync(cursorFile, "existing cursor rules\n", "utf8");
    const duplicateCursor = run(["install-cursor", "--root", root, "--format", "json"]);
    assert.equal(duplicateCursor.status, 1);
    assert.equal(readFileSync(cursorFile, "utf8"), "existing cursor rules\n");
    const forcedCursor = json(["install-cursor", "--root", root, "--force", "--format", "json"]);
    assert.equal(forcedCursor.overwritten, true);

    const copilot = json(["install-copilot", "--root", root, "--format", "json"]);
    assert.equal(copilot.platform, "copilot");
    assert.ok(existsSync(join(root, ".github/copilot-instructions.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("build emits dist JavaScript and types for package consumers", async () => {
  const result = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: "/private/tmp/codex-npm-cache", npm_config_cache: "/private/tmp/codex-npm-cache" },
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
