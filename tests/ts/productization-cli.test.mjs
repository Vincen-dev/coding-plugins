import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const bin = join(repoRoot, "bin/coding-plugins.js");
const fixtureRoot = join(repoRoot, "tests/fixtures/formal-feature-chain");
const packageVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;

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
    const validation = json(["validate", "--root", fixtureRoot, "--format", "json"]);
    assert.equal(validation.ok, true);
    assert.ok(validation.documents.some((document) => document.kind === "PRD"));
    assert.ok(validation.documents.every((document) => Array.isArray(document.headings)));
    assert.ok(validation.documents.every((document) => Array.isArray(document.section_names)));
    assert.ok(validation.documents.every((document) => document.section_hashes && typeof document.section_hashes === "object"));
    assert.ok(validation.documents.every((document) => !("sections" in document)), "validate JSON should not include full section bodies by default");
    assert.ok(validation.chains.some((chain) => chain.feature === "routing-fixture" && chain.doc_id === "routing-login" && chain.ok));

    const validationWithSections = json(["validate", "--root", fixtureRoot, "--format", "json", "--include-sections"]);
    assert.ok(validationWithSections.documents.some((document) => document.sections && Object.keys(document.sections).length > 0));

    const strictFixtureValidation = json(["validate", "--root", fixtureRoot, "--format", "json", "--strict-chain"]);
    assert.equal(strictFixtureValidation.ok, true);

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
      "local-skills-entrypoint",
      "workflow-state-source",
      "cursor-inject-dry-run",
      "copilot-inject-dry-run",
    ]) {
      assert.ok(repositoryDoctor.checks.some((check) => check.name === expected && check.ok), `missing ok doctor check: ${expected}`);
    }

    const staleManifest = join(codexHome, "plugins/cache/personal/coding-plugins/1.0.12/.codex-plugin");
    mkdirSync(staleManifest, { recursive: true });
    writeFileSync(join(staleManifest, "plugin.json"), JSON.stringify({ name: "coding-plugins", version: "1.0.12" }, null, 2), "utf8");

    const stale = run(["doctor", "--root", repoRoot, "--codex-home", codexHome, "--format", "json"]);
    assert.equal(stale.status, 1);
    const payload = JSON.parse(stale.stdout);
    const cacheCheck = payload.checks.find((check) => check.name === "codex-cache-version");
    assert.equal(cacheCheck.ok, false);
    assert.ok(cacheCheck.message.includes(`repository=${packageVersion}`));
    assert.ok(cacheCheck.message.includes("cache=1.0.12"));
  } finally {
    rmSync(codexHome, { recursive: true, force: true });
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
    assert.ok(payload.errors.some((error) => error.includes("TSD is missing required sections")));
    assert.ok(payload.errors.some((error) => error.includes("TVD is missing required sections")));
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
    const forcedCursorText = readFileSync(cursorFile, "utf8");
    assert.ok(forcedCursorText.includes("alwaysApply: true"));
    assert.ok(forcedCursorText.includes("globs: **/*"));

    const copilot = json(["install-copilot", "--root", root, "--format", "json"]);
    assert.equal(copilot.platform, "copilot");
    const copilotFile = join(root, ".github/copilot-instructions.md");
    assert.ok(existsSync(copilotFile));
    assert.ok(readFileSync(copilotFile, "utf8").includes("apply to every coding task"));
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

test("library schema validation can return section summaries without full markdown bodies", async () => {
  const result = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_CACHE: "/private/tmp/codex-npm-cache", npm_config_cache: "/private/tmp/codex-npm-cache" },
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
