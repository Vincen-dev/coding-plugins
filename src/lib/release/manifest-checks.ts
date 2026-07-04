import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export class ManifestCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestCheckError";
  }
}

type JsonObject = Record<string, unknown>;

const PY_SOURCE_EXCLUSION = `!**/*.${"py"}`;

const REQUIRED_PLUGIN_FILES = [
  "plugin.json",
  "gemini-extension.json",
  "GEMINI.md",
  "INSTALL.md",
  "SECURITY.md",
  "package.json",
  "bin/coding-plugins.js",
  "dist/index.d.ts",
  "dist/index.js",
  "src/cli/bump-version.ts",
  "src/cli/preflight.ts",
  "src/cli/prepare-release.ts",
  "tests/ts/no-python-source.test.mjs",
  "tests/ts/preflight-cli.test.mjs",
  "tests/ts/npm-package.test.mjs",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".agents/skills",
  "skills",
  "README.md",
];

const REQUIRED_PACKAGE_FILES = new Set([
  "bin/",
  "dist/",
  "src/",
  "skills/",
  "hooks/",
  "assets/",
  "docs/",
  ".codex-plugin/",
  ".claude-plugin/",
  ".opencode/",
  ".agents/skills",
  "plugin.json",
  "gemini-extension.json",
  "GEMINI.md",
  "INSTALL.md",
  "SECURITY.md",
  "README.md",
  "LICENSE",
  "RELEASE-NOTES.md",
  "!**/__pycache__/",
  PY_SOURCE_EXCLUSION,
  "!**/*.pyc",
]);

export function readJson(path: string): JsonObject {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new ManifestCheckError(`Missing manifest file: ${path}.`);
    }
    throw error;
  }
}

function exists(path: string): boolean {
  return existsSync(path);
}

function isDirectory(path: string): boolean {
  return exists(path) && statSync(path).isDirectory();
}

function isFile(path: string): boolean {
  return exists(path) && statSync(path).isFile();
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function objectValue(value: unknown): JsonObject | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as JsonObject;
}

export function checkRequiredPluginFiles(root: string): void {
  const missing = REQUIRED_PLUGIN_FILES
    .map((path) => join(root, path))
    .filter((path) => !exists(path))
    .map((path) => relative(root, path));

  if (missing.length > 0) {
    throw new ManifestCheckError(`Missing required plugin file(s): ${missing.join(", ")}.`);
  }
}

export function checkManifestVersions(root: string): void {
  const versions = new Map<string, unknown>([
    [".codex-plugin/plugin.json", readJson(join(root, ".codex-plugin/plugin.json")).version],
    [".claude-plugin/plugin.json", readJson(join(root, ".claude-plugin/plugin.json")).version],
    ["plugin.json", readJson(join(root, "plugin.json")).version],
    ["gemini-extension.json", readJson(join(root, "gemini-extension.json")).version],
    ["package.json", readJson(join(root, "package.json")).version],
  ]);

  const missing = [...versions.entries()].filter(([, version]) => !version).map(([path]) => path);
  if (missing.length > 0) {
    throw new ManifestCheckError(`Plugin manifests must define a version: ${missing.join(", ")}.`);
  }

  const uniqueVersions = [...new Set([...versions.values()].map(String))].sort();
  if (uniqueVersions.length !== 1) {
    const detail = [...versions.entries()].map(([path, version]) => `${path}=${String(version)}`).join(", ");
    throw new ManifestCheckError(`Manifest versions differ: ${detail}.`);
  }
}

export function currentManifestVersion(root: string): string {
  const version = readJson(join(root, ".codex-plugin/plugin.json")).version;
  if (!stringValue(version)) {
    throw new ManifestCheckError("Codex manifest must define a version.");
  }
  return version as string;
}

export function checkCodexHookConfigDeclared(root: string): void {
  const codexManifest = readJson(join(root, ".codex-plugin/plugin.json"));
  if (codexManifest.hooks !== "./hooks/hooks-codex.json") {
    throw new ManifestCheckError("Codex manifest must declare hooks: ./hooks/hooks-codex.json.");
  }
}

export function checkPlatformEntrypoints(root: string): void {
  const rootManifest = readJson(join(root, "plugin.json"));
  const skillsPath = rootManifest.skills;
  if (skillsPath !== "skills/") {
    throw new ManifestCheckError("Root plugin manifest must declare skills: skills/.");
  }
  if (!exists(join(root, skillsPath))) {
    throw new ManifestCheckError(`Root plugin skills path does not exist: ${skillsPath}.`);
  }

  const geminiManifest = readJson(join(root, "gemini-extension.json"));
  const contextFileName = stringValue(geminiManifest.contextFileName);
  if (!contextFileName) {
    throw new ManifestCheckError("Gemini extension must declare contextFileName.");
  }
  if (!exists(join(root, contextFileName))) {
    throw new ManifestCheckError(`Gemini context file does not exist: ${contextFileName}.`);
  }

  const agentsSkills = join(root, ".agents/skills");
  if (!exists(agentsSkills)) {
    throw new ManifestCheckError(".agents/skills must exist for local skills clients.");
  }
  if (isDirectory(agentsSkills)) {
    return;
  }
  if (isFile(agentsSkills)) {
    const symlinkTarget = readFileSync(agentsSkills, "utf8").trim();
    if (symlinkTarget === "../skills" && isDirectory(join(root, "skills"))) {
      return;
    }
  }
  throw new ManifestCheckError(".agents/skills must resolve to a directory or contain ../skills symlink target.");
}

export function checkNpmPackageManifest(root: string): void {
  const packageManifest = readJson(join(root, "package.json"));
  if (packageManifest.name !== "@vincen-dev/coding-plugins") {
    throw new ManifestCheckError("NPM package name must be @vincen-dev/coding-plugins.");
  }
  if (packageManifest.type !== "module") {
    throw new ManifestCheckError("NPM package must declare type: module.");
  }

  const binConfig = objectValue(packageManifest.bin);
  if (!binConfig || binConfig["coding-plugins"] !== "./bin/coding-plugins.js") {
    throw new ManifestCheckError("NPM package must expose bin.coding-plugins: ./bin/coding-plugins.js.");
  }

  if (packageManifest.main !== "./dist/index.js") {
    throw new ManifestCheckError("NPM package must expose main: ./dist/index.js.");
  }
  if (packageManifest.types !== "./dist/index.d.ts") {
    throw new ManifestCheckError("NPM package must expose types: ./dist/index.d.ts.");
  }
  if (!exists(join(root, "dist/index.js")) || !exists(join(root, "dist/index.d.ts"))) {
    throw new ManifestCheckError("NPM package must include built dist/index.js and dist/index.d.ts.");
  }
  if (!exists(join(root, "bin/coding-plugins.js"))) {
    throw new ManifestCheckError("NPM bin entry does not exist: bin/coding-plugins.js.");
  }

  const scripts = objectValue(packageManifest.scripts);
  if (!scripts || String(scripts["test:ts"] ?? "") !== "npm run preflight") {
    throw new ManifestCheckError("NPM package must define scripts.test:ts for TypeScript runtime preflight.");
  }
  if (String(scripts["typecheck"] ?? "") !== "tsc --noEmit") {
    throw new ManifestCheckError("NPM package must define scripts.typecheck for TypeScript compiler validation.");
  }
  if (String(scripts["preflight"] ?? "") !== "node src/cli/preflight.ts") {
    throw new ManifestCheckError("NPM package must define scripts.preflight for TypeScript preflight.");
  }
  if (String(scripts["build"] ?? "") !== "node dist/src/cli/release/build-dist.js") {
    throw new ManifestCheckError("NPM package must define scripts.build for dist/types output.");
  }

  const devDependencies = objectValue(packageManifest.devDependencies);
  if (!devDependencies || typeof devDependencies.typescript !== "string") {
    throw new ManifestCheckError("NPM package must declare devDependencies.typescript.");
  }
  if (typeof devDependencies["@types/node"] !== "string") {
    throw new ManifestCheckError("NPM package must declare devDependencies.@types/node.");
  }

  const publishConfig = objectValue(packageManifest.publishConfig);
  if (!publishConfig) {
    throw new ManifestCheckError("NPM package must define publishConfig.");
  }
  if (publishConfig.access !== "public") {
    throw new ManifestCheckError("NPM package publishConfig.access must be public.");
  }
  if (publishConfig.provenance !== true) {
    throw new ManifestCheckError("NPM package publishConfig.provenance must be true.");
  }

  if (!Array.isArray(packageManifest.files)) {
    throw new ManifestCheckError("NPM package must define files array.");
  }
  const actualFiles = new Set(packageManifest.files.filter((item): item is string => typeof item === "string"));
  if (actualFiles.has("scripts/")) {
    throw new ManifestCheckError("NPM package files array must not include scripts/ in the TypeScript runtime package.");
  }
  const missing = [...REQUIRED_PACKAGE_FILES].filter((item) => !actualFiles.has(item)).sort();
  if (missing.length > 0) {
    throw new ManifestCheckError(`NPM package files array is missing: ${missing.join(", ")}.`);
  }
}

export function normalizeManifestAssetPath(rawPath: unknown): string | undefined {
  if (typeof rawPath !== "string" || !rawPath.trim()) {
    return undefined;
  }
  return rawPath.startsWith("./") ? rawPath.slice(2) : rawPath;
}

export function checkManifestAssetPaths(root: string): void {
  const codexManifest = readJson(join(root, ".codex-plugin/plugin.json"));
  const interfaceConfig = objectValue(codexManifest.interface);
  if (!interfaceConfig) {
    return;
  }

  const assetRefs: Array<[string, string]> = [];
  for (const field of ["composerIcon", "logo", "logoDark"]) {
    const normalized = normalizeManifestAssetPath(interfaceConfig[field]);
    if (normalized) {
      assetRefs.push([`interface.${field}`, normalized]);
    }
  }

  if (Array.isArray(interfaceConfig.screenshots)) {
    interfaceConfig.screenshots.forEach((item, index) => {
      const normalized = normalizeManifestAssetPath(item);
      if (normalized) {
        assetRefs.push([`interface.screenshots[${index}]`, normalized]);
      }
    });
  }

  const missing = assetRefs
    .filter(([, path]) => !exists(join(root, path)))
    .map(([field, path]) => `${field} -> ${path}`);
  if (missing.length > 0) {
    throw new ManifestCheckError(`Manifest asset path does not exist: ${missing.join(", ")}.`);
  }
}

export function checkAllManifests(root: string): void {
  checkRequiredPluginFiles(root);
  checkManifestVersions(root);
  checkNpmPackageManifest(root);
  checkPlatformEntrypoints(root);
  checkCodexHookConfigDeclared(root);
  checkManifestAssetPaths(root);
}
