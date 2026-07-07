import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { auditPackedFilePaths } from "../../src/lib/release/package-policy.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const py = "py";
const pySuffix = "." + py;
const pyCommand = py + "thon3";
const npmCacheDir = join(tmpdir(), "codex-npm-cache");

function npmCacheEnv() {
  return { ...process.env, NPM_CONFIG_CACHE: npmCacheDir, npm_config_cache: npmCacheDir };
}

test("npm package tests and release audit use cross-platform npm cache paths", () => {
  const forbiddenCachePath = "/private/tmp/" + "codex-npm-cache";
  const checkedFiles = [
    "tests/ts/npm-package.test.mjs",
    "tests/ts/productization-cli.test.mjs",
    "tests/ts/preflight-cli.test.mjs",
    "src/cli/release/security-audit.ts",
  ];
  const offenders = checkedFiles.filter((file) => readFileSync(resolve(repoRoot, file), "utf8").includes(forbiddenCachePath));
  assert.deepEqual(offenders, []);
});

function packFiles() {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: npmCacheEnv(),
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.length, 1);
  return payload[0].files.map((file) => file.path);
}

test("npm package includes runtime entrypoints and excludes generated caches", () => {
  const files = packFiles();

  for (const required of [
    "package.json",
    "bin/coding-plugins.js",
    "dist/index.js",
    "dist/index.d.ts",
    "dist/src/cli/start.js",
    "dist/src/cli/workflow/start.js",
    "dist/src/cli/doctor.js",
    "dist/src/cli/documents/doctor.js",
    "dist/skills/using-coding-plugins/scripts/workflow-mode.js",
    "dist/src/cli/bump-version.js",
    "dist/src/cli/release/bump-version.js",
    "dist/src/cli/preflight.js",
    "dist/src/cli/release/preflight.js",
    "dist/src/cli/prepare-release.js",
    "dist/src/cli/release/prepare-release.js",
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    "plugin.json",
    "README.md",
    "INSTALL.md",
    "SECURITY.md",
  ]) {
    assert.ok(files.includes(required), `missing package file: ${required}`);
  }

  assert.ok(
    files.some((path) => path.startsWith("skills/spec-driven-development/")),
    "expected packaged skills",
  );
  assert.ok(
    files.every((path) => !path.includes("__pycache__") && !path.endsWith(".pyc")),
    "package must not include generated Python cache files",
  );
});

test("npm pack output satisfies release package policy", () => {
  const files = packFiles();
  const issues = auditPackedFilePaths(files);
  assert.deepEqual(issues, []);
});

test("release package policy does not publish broad source or internal docs directories", () => {
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
  const manifestChecks = readFileSync(resolve(repoRoot, "src/lib/release/manifest-checks.ts"), "utf8");
  const forbiddenPackageEntries = ["src/", "docs/", "tests/"];

  for (const entry of forbiddenPackageEntries) {
    assert.ok(!packageJson.files.includes(entry), `package.json files must not include broad development entry: ${entry}`);
    assert.ok(
      !manifestChecks.includes(`"${entry}"`),
      `manifest package policy must not require broad development entry: ${entry}`,
    );
  }
});

test("npm package and workflows use TypeScript runtime without Python", () => {
  const files = packFiles();
  assert.ok(files.every((path) => !path.endsWith(pySuffix)), "npm package must not include Python source files");
  assert.ok(files.includes("dist/src/cli/preflight.js"), "npm package must include compiled preflight runtime");
  assert.ok(!files.includes(`scripts/preflight${pySuffix}`), "npm package must not include Python preflight");

  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
  assert.equal(packageJson.scripts.preflight, "node src/cli/preflight.ts");
  assert.ok(!packageJson.scripts.build.includes("scripts/"), "packaged build script must not reference excluded scripts directory");
  assert.ok(!packageJson.files.includes("scripts/"), "npm package files must not include Python scripts directory");
  assert.ok(files.includes(".agents/skills"), "npm package must include local skills client entrypoint");

  for (const workflow of [".github/workflows/ci.yml", ".github/workflows/release.yml"]) {
    const text = readFileSync(resolve(repoRoot, workflow), "utf8");
    assert.ok(!text.includes(`setup-${py}`), `${workflow} must not set up Python`);
    assert.ok(!text.includes(`${pyCommand} `), `${workflow} must not run ${pyCommand}`);
    assert.match(text, /npm ci\b/, `${workflow} must install npm dependencies before preflight`);
    assert.ok(text.includes("npm run preflight"), `${workflow} must run npm preflight`);
  }

  const preflight = readFileSync(resolve(repoRoot, "src/cli/release/preflight.ts"), "utf8");
  assert.ok(!preflight.includes(`scripts/preflight${pySuffix}`), "TypeScript preflight must not delegate to Python preflight");
  assert.ok(!preflight.includes("External reference checks are not required"), "preflight must not no-op external reference checks");

  const bin = readFileSync(resolve(repoRoot, "bin/coding-plugins.js"), "utf8");
  assert.ok(bin.includes('resolve(root, "dist", path.replace(/\\.ts$/, ".js"))'), "bin must prefer compiled dist JavaScript runtime");
});

test("published text files do not document Python entrypoints", () => {
  const files = packFiles();
  const offenders = [];
  for (const path of files) {
    if (path === "package.json" || path.endsWith(".png")) {
      continue;
    }
    const fullPath = resolve(repoRoot, path);
    const text = readFileSync(fullPath, "utf8");
    if (new RegExp(`${pyCommand}|scripts\\/[A-Za-z0-9_]+\\${pySuffix}|\\${pySuffix}\\b`).test(text)) {
      offenders.push(path);
    }
  }
  assert.deepEqual(offenders, []);
});

test("local skills client docs describe the packaged .agents skills text fallback", () => {
  const files = packFiles();
  const agentsSkills = readFileSync(resolve(repoRoot, ".agents/skills"), "utf8").trim();
  assert.equal(agentsSkills, "../skills");
  assert.ok(files.includes(".agents/skills"), "npm package must include .agents/skills text fallback");

  const install = readFileSync(resolve(repoRoot, "INSTALL.md"), "utf8");
  const readme = readFileSync(resolve(repoRoot, "README.md"), "utf8");
  assert.ok(
    install.includes("`.agents/skills` 文本入口"),
    "INSTALL.md must describe the repository packaged .agents/skills text fallback",
  );
  assert.ok(
    readme.includes("`.agents/skills` 文本入口"),
    "README.md must describe the repository packaged .agents/skills text fallback",
  );
  assert.ok(
    !install.includes("本仓库自身提供 `.agents/skills -> ../skills`"),
    "INSTALL.md must not describe the packaged text fallback as an actual symlink",
  );
});

test("published docs describe runtime and release distribution boundaries", () => {
  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
  const install = readFileSync(resolve(repoRoot, "INSTALL.md"), "utf8");
  const readme = readFileSync(resolve(repoRoot, "README.md"), "utf8");
  const releaseWorkflow = readFileSync(resolve(repoRoot, ".github/workflows/release.yml"), "utf8");

  assert.equal(packageJson.engines.node, ">=22.6");
  assert.ok(install.includes("Node.js >=22.6"), "INSTALL.md must document the Node runtime floor");
  assert.ok(readme.includes("Node.js >=22.6"), "README.md must document the Node runtime floor");
  assert.ok(
    install.includes("不执行 `npm publish`"),
    "INSTALL.md must state that the current release workflow does not publish to npm",
  );
  assert.ok(!releaseWorkflow.includes("npm publish"), "release workflow must stay aligned with the documented non-npm-publish boundary");
});

test("published docs include a team release checklist instead of local-only release memory", () => {
  const install = readFileSync(resolve(repoRoot, "INSTALL.md"), "utf8");
  for (const expected of [
    "团队发布 checklist",
    "release branch 或 PR",
    "npm run security-audit:ts -- --root . --strict-release --format json",
    "npm run preflight -- --write-index",
    "git tag -a v<version>",
    "npm run remote-audit:ts -- --owner Vincen-dev --repo coding-plugins --tag v<version> --expected-pusher Vincen-dev",
    "codex plugin add coding-plugins@personal",
    "coding-plugins doctor --root . --codex-home ~/.codex --format json",
  ]) {
    assert.ok(install.includes(expected), `INSTALL.md release checklist must include: ${expected}`);
  }
});

test("agent pressure fixture includes long-session, stale TED, and platform-unavailable command evidence", () => {
  const manifest = JSON.parse(readFileSync(resolve(repoRoot, "tests/fixtures/formal-feature-chain/agent-pressure-results.json"), "utf8"));
  assert.ok(manifest.case_count >= 27);
  const cases = manifest.case_files.map((file) =>
    JSON.parse(readFileSync(resolve(repoRoot, "tests/fixtures/formal-feature-chain", manifest.cases_dir, file), "utf8")),
  );
  for (const behavior of [
    "kept_task_scope_after_long_session_pressure",
    "rejected_stale_ted_after_upstream_change",
    "reported_platform_installation_summary_with_unavailable_codex",
  ]) {
    const caseData = cases.find((item) => item.observed_behaviors.includes(behavior));
    assert.ok(caseData, `missing agent pressure behavior: ${behavior}`);
    assert.ok(caseData.execution_evidence.some((evidence) => evidence.proves === behavior));
    assert.equal(caseData.transcript.source, "command_log");
  }
});

test("repository enables Dependabot for npm packages and GitHub Actions", () => {
  const dependabot = readFileSync(resolve(repoRoot, ".github/dependabot.yml"), "utf8");
  assert.match(dependabot, /^version:\s*2$/m);
  assert.match(dependabot, /package-ecosystem:\s*"npm"[\s\S]*directory:\s*"\/"[\s\S]*interval:\s*"weekly"/);
  assert.match(
    dependabot,
    /package-ecosystem:\s*"github-actions"[\s\S]*directory:\s*"\/"[\s\S]*interval:\s*"weekly"/,
  );
  assert.match(dependabot, /timezone:\s*"Asia\/Shanghai"/);
  assert.match(dependabot, /open-pull-requests-limit:\s*5/);
});

test("security audit exposes a strict release mode that runs build and preflight", () => {
  const source = readFileSync(resolve(repoRoot, "src/cli/release/security-audit.ts"), "utf8");
  const preflight = readFileSync(resolve(repoRoot, "src/cli/release/preflight.ts"), "utf8");
  const build = readFileSync(resolve(repoRoot, "src/cli/release/build-dist.ts"), "utf8");
  assert.ok(source.includes("--strict-release"), "security audit must expose --strict-release");
  assert.ok(source.includes('"npm", ["run", "build"]'), "strict release audit must run build");
  assert.ok(source.includes('"npm", ["run", "preflight"]'), "strict release audit must run preflight");
  assert.ok(source.includes("withBuildLock"), "strict release audit must serialize build/preflight operations");
  assert.ok(preflight.includes("withBuildLock"), "preflight must participate in the same build/preflight lock");
  assert.ok(build.includes("../../lib/runtime/build-lock.ts"), "build script must import the shared build/preflight lock helper");
  assert.ok(!build.includes("function withBuildLock"), "build script must not duplicate the lock implementation");
});

test("security audit scans common package secret formats", () => {
  const source = readFileSync(resolve(repoRoot, "src/cli/release/security-audit.ts"), "utf8");
  for (const expected of ["gho_", "ghu_", "ghs_", "ghr_", "xoxb-", "sk_live_", "AIza"]) {
    assert.ok(source.includes(expected), `security audit secret scanner must include ${expected}`);
  }
  assert.ok(source.includes("client_secret"), "security audit must scan generic secret assignments");
});

test("security audit fails real npm pack output that contains a secret-like token", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-secret-pack-"));
  try {
    mkdirSync(join(root, "dist"), { recursive: true });
    mkdirSync(join(root, ".github/workflows"), { recursive: true });
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "secret-pack-fixture",
          version: "1.0.0",
          type: "module",
          main: "./dist/index.js",
          types: "./dist/index.d.ts",
          files: ["dist/"],
          engines: { node: ">=22.6" },
          publishConfig: { access: "public", provenance: true },
        },
        null,
        2,
      ),
      "utf8",
    );
    writeFileSync(join(root, "dist/index.js"), "export const leaked = \"sk_live_1234567890abcdef\";\n", "utf8");
    writeFileSync(join(root, "dist/index.d.ts"), "export declare const leaked: string;\n", "utf8");
    writeFileSync(join(root, ".github/workflows/ci.yml"), "steps:\n  - run: npm ci\n  - run: npm run preflight\n", "utf8");
    writeFileSync(join(root, ".github/workflows/release.yml"), "steps:\n  - run: npm run preflight\n", "utf8");

    const result = spawnSync("node", [resolve(repoRoot, "src/cli/security-audit.ts"), "--root", root, "--format", "json"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: npmCacheEnv(),
    });
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    const secretCheck = payload.checks.find((check) => check.name === "pack-secrets");
    assert.equal(secretCheck.ok, false);
    assert.ok(secretCheck.message.includes("dist/index.js"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("security audit fails real npm pack output that contains internal development content", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-dev-content-pack-"));
  try {
    mkdirSync(join(root, "dist"), { recursive: true });
    mkdirSync(join(root, "docs/coding-plugins/features/release-cleanup"), { recursive: true });
    mkdirSync(join(root, ".github/workflows"), { recursive: true });
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify(
        {
          name: "dev-content-pack-fixture",
          version: "1.0.0",
          type: "module",
          main: "./dist/index.js",
          types: "./dist/index.d.ts",
          files: ["dist/", "docs/", "package.json", "README.md", "INSTALL.md", "SECURITY.md", "LICENSE", "RELEASE-NOTES.md"],
          engines: { node: ">=22.6" },
          publishConfig: { access: "public", provenance: true },
        },
        null,
        2,
      ),
      "utf8",
    );
    writeFileSync(join(root, "dist/index.js"), "export {};\n", "utf8");
    writeFileSync(join(root, "dist/index.d.ts"), "export {};\n", "utf8");
    writeFileSync(join(root, "docs/coding-plugins/features/release-cleanup/internal.md"), "# Internal\n", "utf8");
    for (const path of ["README.md", "INSTALL.md", "SECURITY.md", "LICENSE", "RELEASE-NOTES.md"]) {
      writeFileSync(join(root, path), "# User document\n", "utf8");
    }
    writeFileSync(join(root, ".github/workflows/ci.yml"), "steps:\n  - run: npm ci\n  - run: npm run preflight\n", "utf8");
    writeFileSync(join(root, ".github/workflows/release.yml"), "steps:\n  - run: npm run preflight\n", "utf8");

    const result = spawnSync("node", [resolve(repoRoot, "src/cli/security-audit.ts"), "--root", root, "--format", "json"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: npmCacheEnv(),
    });
    assert.equal(result.status, 1);
    const payload = JSON.parse(result.stdout);
    const packageCheck = payload.checks.find((check) => check.name === "pack-policy");
    assert.equal(packageCheck.ok, false);
    assert.ok(packageCheck.message.includes("denied_dev_content:docs/coding-plugins/features/release-cleanup/internal.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("packed npm artifact supports installed runtime commands without repository-only files", () => {
  const packageRoot = mkdtempSync(join(tmpdir(), "coding-plugins-installed-package-"));
  const packRoot = mkdtempSync(join(tmpdir(), "coding-plugins-pack-output-"));
  try {
    const packed = spawnSync("npm", ["pack", "--json", "--pack-destination", packRoot], {
      cwd: repoRoot,
      encoding: "utf8",
      env: npmCacheEnv(),
    });
    assert.equal(packed.status, 0, packed.stderr);
    const tarball = join(packRoot, JSON.parse(packed.stdout)[0].filename);

    writeFileSync(join(packageRoot, "package.json"), JSON.stringify({ type: "module", private: true }, null, 2), "utf8");
    const installed = spawnSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
      cwd: packageRoot,
      encoding: "utf8",
      env: npmCacheEnv(),
    });
    assert.equal(installed.status, 0, installed.stderr);

    const installedPackage = join(packageRoot, "node_modules/@vincen-dev/coding-plugins");
    assert.equal(existsSync(join(installedPackage, "tsconfig.build.json")), false, "published package should not rely on repository tsconfig");
    assert.equal(existsSync(join(installedPackage, "src")), false, "published package should not include source tree");
    assert.equal(existsSync(join(installedPackage, "tests")), false, "published package should not include test tree");
    assert.equal(existsSync(join(installedPackage, "docs/coding-plugins/features")), false, "published package should not include internal feature docs");
    assert.equal(existsSync(join(installedPackage, "skills/spec-driven-development/scripts/fixtures")), false, "published package should not include skill test fixtures");

    const help = spawnSync("node", [join(installedPackage, "bin/coding-plugins.js"), "--help"], {
      cwd: packageRoot,
      encoding: "utf8",
    });
    assert.equal(help.status, 0, help.stderr);
    assert.ok(help.stdout.includes("coding-plugins <command>"));

    const build = spawnSync("npm", ["run", "build"], {
      cwd: installedPackage,
      encoding: "utf8",
      env: npmCacheEnv(),
    });
    assert.equal(build.status, 0, build.stderr);
    assert.ok(build.stdout.includes("dist is already packaged"));

    const manifestCheck = spawnSync("node", [join(installedPackage, "bin/coding-plugins.js"), "manifest-check", "--root", installedPackage], {
      cwd: packageRoot,
      encoding: "utf8",
    });
    assert.equal(manifestCheck.status, 0, manifestCheck.stderr);
    assert.equal(manifestCheck.stdout, "Manifest checks passed\n");
  } finally {
    rmSync(packageRoot, { recursive: true, force: true });
    rmSync(packRoot, { recursive: true, force: true });
  }
});
