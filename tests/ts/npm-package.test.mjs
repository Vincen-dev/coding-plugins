import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const py = "py";
const pySuffix = "." + py;
const pyCommand = py + "thon3";

function packFiles() {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
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
    "src/cli/bump-version.ts",
    "src/cli/prepare-release.ts",
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

test("npm package and workflows use TypeScript runtime without Python", () => {
  const files = packFiles();
  assert.ok(files.every((path) => !path.endsWith(pySuffix)), "npm package must not include Python source files");
  assert.ok(files.includes("src/cli/preflight.ts"), "npm package must include TypeScript preflight");
  assert.ok(!files.includes(`scripts/preflight${pySuffix}`), "npm package must not include Python preflight");

  const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
  assert.equal(packageJson.scripts.preflight, "node src/cli/preflight.ts");
  assert.ok(!packageJson.files.includes("scripts/"), "npm package files must not include Python scripts directory");
  assert.ok(files.includes(".agents/skills"), "npm package must include local skills client entrypoint");

  for (const workflow of [".github/workflows/ci.yml", ".github/workflows/release.yml"]) {
    const text = readFileSync(resolve(repoRoot, workflow), "utf8");
    assert.ok(!text.includes(`setup-${py}`), `${workflow} must not set up Python`);
    assert.ok(!text.includes(`${pyCommand} `), `${workflow} must not run ${pyCommand}`);
    assert.match(text, /npm ci\b/, `${workflow} must install npm dependencies before preflight`);
    assert.ok(text.includes("npm run preflight"), `${workflow} must run npm preflight`);
  }

  const preflight = readFileSync(resolve(repoRoot, "src/cli/preflight.ts"), "utf8");
  assert.ok(!preflight.includes(`scripts/preflight${pySuffix}`), "TypeScript preflight must not delegate to Python preflight");
  assert.ok(!preflight.includes("External reference checks are not required"), "preflight must not no-op external reference checks");
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
