import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const py = "py";
const pySuffix = "." + py;
const pyCommand = py + "thon3";
const pyTest = py + "test";
const disallowed = new RegExp(`${pyCommand}|setup-${py}|${py} -|${pyTest}|scripts\\/[A-Za-z0-9_\\/-]+\\${pySuffix}|\\${pySuffix}\\b`);
const scannedRoots = [
  ".github",
  "bin",
  "docs",
  "hooks",
  "scripts",
  "skills",
  "src",
  "tests",
  "README.md",
  "INSTALL.md",
  "SECURITY.md",
  "GEMINI.md",
  "RELEASE-NOTES.md",
];
const ignoredDirs = new Set([".git", "node_modules", `.${pyTest}_cache`, `__${py}cache__`]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf"]);

function walk(entry) {
  const fullPath = join(repoRoot, entry);
  const stats = statSync(fullPath, { throwIfNoEntry: false });
  if (!stats) return [];
  if (stats.isFile()) return [entry];
  if (!stats.isDirectory() || ignoredDirs.has(entry.split("/").at(-1))) return [];
  const files = [];
  for (const child of readdirSync(fullPath).sort()) {
    const childRel = relative(repoRoot, join(fullPath, child)).replaceAll("\\", "/");
    if (ignoredDirs.has(child)) continue;
    files.push(...walk(childRel));
  }
  return files;
}

test("repository uses TypeScript runtime without legacy source files", () => {
  const files = scannedRoots.flatMap(walk).sort();
  const legacyFiles = files.filter((file) => file.endsWith(pySuffix));
  assert.deepEqual(legacyFiles, []);
});

test("repository text no longer points agents at legacy entrypoints", () => {
  const files = scannedRoots.flatMap(walk).sort();
  const offenders = [];
  for (const file of files) {
    if (binaryExtensions.has(extname(file).toLowerCase())) continue;
    const text = readFileSync(join(repoRoot, file), "utf8");
    const normalized = text.replaceAll(`!**/*${pySuffix}`, "").replaceAll(`!**/*${pySuffix}c`, "");
    if (disallowed.test(normalized)) {
      offenders.push(file);
    }
  }
  assert.deepEqual(offenders, []);
});
