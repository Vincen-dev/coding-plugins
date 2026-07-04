import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const preflightEntrypoint = join(repoRoot, "src/cli/preflight.ts");
const preflightImplementation = join(repoRoot, "src/cli/release/preflight.ts");
const pySuffix = "." + "py";
const pyCommand = "py" + "thon3";
const npmCacheDir = join(tmpdir(), "codex-npm-cache");

function run(script, args) {
  return spawnSync(script.command, [...script.prefix, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

function scripts() {
  return {
    typescript: { command: "node", prefix: [preflightEntrypoint] },
  };
}

test("TypeScript preflight CLI rejects unknown arguments without legacy delegation", () => {
  const { typescript } = scripts();
  const ts = run(typescript, ["--unknown"]);

  assert.equal(ts.status, 2);
  assert.equal(ts.stdout, "");
  assert.equal(ts.stderr, "Usage: coding-plugins preflight [--write-index] [--check-external-references]\n");
});

test("TypeScript preflight source stays self-contained", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", preflightImplementation], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(!source.stdout.includes(`scripts/preflight${pySuffix}`));
  assert.ok(!source.stdout.includes(pyCommand));
});

test("TypeScript preflight runs package typecheck", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", preflightImplementation], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(source.stdout.includes('"npm", ["run", "typecheck"]'));
});

test("TypeScript preflight runs scenario routing contract checks", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", preflightImplementation], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(source.stdout.includes("collectTypeScriptTestFiles"));
  assert.ok(source.stdout.includes('entry.name.endsWith(".test.mjs")'));
});

test("TypeScript preflight discovers TypeScript test files instead of hard-coding the suite", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", preflightImplementation], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(source.stdout.includes("collectTypeScriptTestFiles"));
  assert.equal(source.stdout.includes('"tests/ts/scenario-routing-contract.test.mjs"'), false);
  assert.equal(source.stdout.includes('"tests/ts/scaffold-feature-docs.test.mjs"'), false);
});

test("TypeScript preflight fails missing local external references", () => {
  const featureRoot = join(repoRoot, "docs/coding-plugins/features/preflight-external-reference-test");
  try {
    mkdirSync(featureRoot, { recursive: true });
    writeFileSync(
      join(featureRoot, "README.md"),
      [
        "---",
        "title: External Reference Test",
        "status: draft",
        "feature: preflight-external-reference-test",
        "updated: 2026-07-04",
        "external_references:",
        "  - missing-local-file.md",
        "---",
        "# External Reference Test",
        "",
      ].join("\n"),
      "utf8",
    );

    const result = spawnSync("node", [preflightEntrypoint, "--check-external-references"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, NPM_CONFIG_CACHE: npmCacheDir, npm_config_cache: npmCacheDir },
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /External reference checks failed/);
    assert.match(result.stderr, /missing-local-file\.md/);
  } finally {
    rmSync(featureRoot, { recursive: true, force: true });
  }
});

test("TypeScript preflight runs external reference checks by default", () => {
  const source = spawnSync("node", ["-e", "process.stdout.write(require('node:fs').readFileSync(process.argv[1], 'utf8'))", preflightImplementation], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(source.status, 0, source.stderr);
  assert.ok(source.stdout.includes("checkExternalReferences();"), "default preflight must run external reference checks");
  assert.ok(!source.stdout.includes('args.includes("--check-external-references")'), "external reference checks must not be optional only");
});
