import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function json(path) {
  return JSON.parse(readFileSync(join(repoRoot, path), "utf8"));
}

function walk(path) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [path];
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const child = relative(repoRoot, join(full, entry.name)).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(child) : [child];
  });
}

test("VC-004 package and manifests declare a minimal Skills-only distribution", () => {
  const packageJson = json("package.json");
  assert.equal(packageJson.private, true);
  for (const field of ["main", "types", "bin", "exports", "files", "publishConfig", "engines"]) {
    assert.equal(Object.hasOwn(packageJson, field), false, `package.json must not expose ${field}`);
  }
  assert.deepEqual(packageJson.scripts, { test: "node --test tests/ts/*.test.mjs" });
  assert.deepEqual(packageJson.devDependencies ?? {}, {});

  const codex = json(".codex-plugin/plugin.json");
  assert.equal(codex.skills, "./skills/");
  assert.equal(Object.hasOwn(codex, "hooks"), false);
});

test("VC-004 final repository has no executable workflow surface", () => {
  for (const path of ["bin", "src", "dist", "hooks"]) {
    assert.equal(existsSync(join(repoRoot, path)), false, `${path} must not exist in the 2.0 workflow-only repository`);
  }

  const surfaces = ["README.md", "INSTALL.md", "GEMINI.md", ...walk("skills").filter((path) => /\.(?:md|yaml)$/.test(path))];
  const forbidden = /\$\{CP_CLI\}|\bCP_CLI\b|\bcoding-plugins\s+(?:task|start|state|dp|validate|workflow-|doctor|cli|release|commit-guard|scope-check|preflight)\b/i;
  const offenders = surfaces.filter((path) => forbidden.test(readFileSync(join(repoRoot, path), "utf8")));
  assert.deepEqual(offenders, [], `CLI references remain in: ${offenders.join(", ")}`);
});
