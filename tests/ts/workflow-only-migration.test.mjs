import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");
const json = (path) => JSON.parse(read(path));

test("VC-001/004 current release metadata stays synchronized after the 2.0.0 migration", () => {
  const currentVersion = json("package.json").version;
  assert.match(currentVersion, /^\d+\.\d+\.\d+$/);
  assert.ok(Number(currentVersion.split(".")[0]) >= 2, "workflow-only releases must remain on major version 2 or later");

  for (const path of [
    ".codex-plugin/plugin.json",
    ".claude-plugin/plugin.json",
    "plugin.json",
    "gemini-extension.json",
    ".version-bump.json",
  ]) assert.equal(json(path).version, currentVersion, `${path} version mismatch`);

  const lock = json("package-lock.json");
  assert.equal(lock.version, currentVersion);
  assert.equal(lock.packages[""].version, currentVersion);
  assert.equal(Object.hasOwn(lock.packages[""], "bin"), false);
  assert.equal(Object.hasOwn(lock.packages[""], "devDependencies"), false);
});

test("VC-001/004 migration docs explain the retired boundary and new contract", () => {
  for (const path of ["README.md", "INSTALL.md", "GEMINI.md", "RELEASE-NOTES.md", "docs/migration-guide.md"]) {
    assert.match(read(path), /2\.0\.0/,
      `${path} must identify the breaking version`);
  }
  const migration = read("docs/migration-guide.md");
  assert.match(migration, /CLI removed/i);
  assert.match(migration, /state files (?:are )?no longer read/i);
  assert.match(migration, /retired document designs remain available in Git history/i);
  for (const replacement of ["using-coding-plugins", "change-capsule", "verification-before-completion", "using-git-commit"]) {
    assert.match(migration, new RegExp(replacement));
  }
});
