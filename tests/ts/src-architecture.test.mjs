import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const domainFiles = [
  "src/lib/agents/agent-pressure-harness.ts",
  "src/lib/documents/document-metadata.ts",
  "src/lib/platform/project-install.ts",
  "src/lib/release/manifest-checks.ts",
  "src/lib/runtime/repository-root.ts",
  "src/lib/workflow/workflow-state.ts",
];

const compatibilityFiles = [
  "src/lib/agent-pressure-harness.ts",
  "src/lib/document-metadata.ts",
  "src/lib/project-install.ts",
  "src/lib/manifest-checks.ts",
  "src/lib/workflow-state.ts",
];

const cliDomainFiles = [
  "src/cli/agents/agent-pressure-harness.ts",
  "src/cli/documents/doctor.ts",
  "src/cli/release/build-dist.ts",
  "src/cli/platform/inject.ts",
  "src/cli/release/preflight.ts",
  "src/cli/workflow/start.ts",
];

const cliCompatibilityFiles = [
  "src/cli/agent-pressure-harness.ts",
  "src/cli/doctor.ts",
  "src/cli/inject.ts",
  "src/cli/preflight.ts",
  "src/cli/start.ts",
];

test("src/lib is organized by domain with thin compatibility re-export files", () => {
  for (const path of domainFiles) {
    assert.ok(existsSync(join(repoRoot, path)), `missing domain file: ${path}`);
  }

  for (const path of compatibilityFiles) {
    const text = readFileSync(join(repoRoot, path), "utf8").trim();
    assert.match(text, /^export \* from "\.\/[a-z-]+\/[a-z-]+\.ts";$/m, `${path} must stay a thin compatibility export`);
    assert.ok(text.split(/\r?\n/).length <= 2, `${path} must not contain implementation logic`);
  }
});

test("src/cli command implementations are organized by domain with thin top-level entrypoints", () => {
  for (const path of cliDomainFiles) {
    assert.ok(existsSync(join(repoRoot, path)), `missing CLI domain file: ${path}`);
  }

  for (const path of cliCompatibilityFiles) {
    const text = readFileSync(join(repoRoot, path), "utf8").trim();
    assert.match(text, /^#!\/usr\/bin\/env node\nimport "\.\/[a-z-]+\/[a-z-]+\.ts";$/m, `${path} must stay a thin compatibility entrypoint`);
    assert.ok(text.split(/\r?\n/).length <= 2, `${path} must not contain command implementation logic`);
  }
});

test("runtime root discovery is shared instead of duplicated in CLI and agent code", () => {
  const runtimeSource = readFileSync(join(repoRoot, "src/lib/runtime/repository-root.ts"), "utf8");
  const preflightSource = readFileSync(join(repoRoot, "src/cli/release/preflight.ts"), "utf8");
  const promptBuilderSource = readFileSync(join(repoRoot, "src/lib/agents/subagent-prompt-builder.ts"), "utf8");

  assert.ok(runtimeSource.includes("export function findRepositoryRoot"));
  assert.ok(preflightSource.includes("../../lib/runtime/repository-root.ts"));
  assert.ok(promptBuilderSource.includes("../runtime/repository-root.ts"));
  assert.equal(preflightSource.includes("function findRepositoryRoot"), false);
  assert.equal(promptBuilderSource.includes("function findRepositoryRoot"), false);
});

test("build and preflight use the shared runtime lock instead of script-local lock helpers", () => {
  const buildSource = readFileSync(join(repoRoot, "src/cli/release/build-dist.ts"), "utf8");
  const preflightSource = readFileSync(join(repoRoot, "src/cli/release/preflight.ts"), "utf8");
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));

  assert.equal(packageJson.scripts.build, "node dist/src/cli/release/build-dist.js");
  assert.ok(buildSource.includes("../../lib/runtime/build-lock.ts"));
  assert.ok(preflightSource.includes("../../lib/runtime/build-lock.ts"));
  assert.equal(existsSync(join(repoRoot, "scripts/build-lock.mjs")), false);
  assert.equal(existsSync(join(repoRoot, "scripts/build-dist.mjs")), false);
});
