#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkArtifactIndexCoversDocuments, featureEvidenceFiles, featureSpecFiles, writeArtifactIndex } from "../../lib/documents/docs-index.ts";
import {
  checkCodexHookConfigDeclared,
  checkManifestAssetPaths,
  checkManifestVersions,
  checkNpmPackageManifest,
  checkPlatformEntrypoints,
  checkRequiredPluginFiles,
} from "../../lib/release/manifest-checks.ts";
import { buildPayload as buildSpecPayload } from "../../lib/documents/validate-spec.ts";
import { buildPayload as buildTddEvidencePayload } from "../../lib/documents/validate-tdd-evidence.ts";
import { validateRepository as validateTechnicals } from "../../lib/documents/validate-technicals.ts";
import { collectFeatureRoots, frontmatterListValues } from "../../lib/documents/document-metadata.ts";
import { withBuildLock } from "../../lib/runtime/build-lock.ts";
import { findRepositoryRoot } from "../../lib/runtime/repository-root.ts";

const root = findRepositoryRoot(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const allowedArgs = new Set(["--write-index", "--check-external-references"]);
const unknownArgs = args.filter((arg) => !allowedArgs.has(arg));

if (unknownArgs.length > 0) {
  console.error("Usage: coding-plugins preflight [--write-index] [--check-external-references]");
  process.exit(2);
}

function collectSpecFiles(): string[] {
  return collectFeatureRoots(root).flatMap((featureRoot) => featureSpecFiles(featureRoot)).sort();
}

function collectTddEvidenceFiles(): string[] {
  return collectFeatureRoots(root).flatMap((featureRoot) => featureEvidenceFiles(featureRoot)).sort();
}

function runCommand(command: string, args: string[]): void {
  console.log(`+ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${[command, ...args].join(" ")} failed with exit code ${result.status ?? 1}`);
  }
}

function assertPayload(name: string, payload: { ok: boolean; errors?: string[]; results?: Array<{ errors: string[] }> }): void {
  if (payload.ok) {
    return;
  }
  const errors = payload.errors ?? payload.results?.flatMap((result) => result.errors) ?? [];
  throw new Error(`${name} failed: ${errors.join("; ")}`);
}

function checkNoPythonRuntime(): void {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const files = Array.isArray(packageJson.files) ? packageJson.files : [];
  if (files.includes("scripts/")) {
    throw new Error("package.json files must not include scripts/ for no-Python runtime packaging.");
  }
  for (const workflow of [".github/workflows/ci.yml", ".github/workflows/release.yml"]) {
    const path = join(root, workflow);
    if (!existsSync(path)) {
      continue;
    }
    const text = readFileSync(path, "utf8");
    const disallowedPythonCommand = ["py", "thon3 "].join("");
    const disallowedSetupAction = ["setup", "py" + "thon"].join("-");
    if (text.includes(disallowedSetupAction) || text.includes(disallowedPythonCommand)) {
      throw new Error(`${workflow} must not configure or invoke Python.`);
    }
  }
}

function collectMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files.sort();
}

function isUrlReference(reference: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(reference);
}

function localReferenceExists(documentPath: string, reference: string): boolean {
  if (isAbsolute(reference)) {
    return existsSync(reference);
  }
  const candidates = [resolve(root, reference), resolve(dirname(documentPath), reference)];
  return candidates.some((candidate) => existsSync(candidate));
}

function checkExternalReferences(): void {
  const files = collectMarkdownFiles(join(root, "docs/coding-plugins/features"));
  const errors: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const reference of frontmatterListValues(text, "external_references")) {
      if (!reference || isUrlReference(reference)) {
        continue;
      }
      if (!localReferenceExists(file, reference)) {
        errors.push(`${relative(root, file)} external_references entry is missing: ${reference}`);
      }
    }
  }
  if (errors.length > 0) {
    throw new Error(`External reference checks failed: ${errors.join("; ")}`);
  }
  console.log(`External reference checks passed (${files.length} markdown files scanned).`);
}

function runStaticChecks(): void {
  checkRequiredPluginFiles(root);
  checkManifestVersions(root);
  checkPlatformEntrypoints(root);
  checkNpmPackageManifest(root);
  checkCodexHookConfigDeclared(root);
  checkManifestAssetPaths(root);
  checkArtifactIndexCoversDocuments(root);
  checkNoPythonRuntime();

  const specFiles = collectSpecFiles();
  if (specFiles.length > 0) {
    assertPayload("Spec validation", buildSpecPayload(specFiles, true));
  }

  const evidenceFiles = collectTddEvidenceFiles();
  if (evidenceFiles.length > 0) {
    assertPayload("TDD evidence validation", buildTddEvidencePayload(evidenceFiles, true));
  }

  assertPayload("Technical design validation", validateTechnicals(root, { strict: true }));
}

function runValidationCommands(): void {
  runCommand("npm", ["run", "typecheck"]);

  for (const testFile of collectTypeScriptTestFiles()) {
    runCommand("node", ["--test", testFile]);
  }
  runCommand("bash", ["tests/hooks/test-session-start.sh"]);
}

function collectTypeScriptTestFiles(): string[] {
  return readdirSync(join(root, "tests/ts"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
    .map((entry) => `tests/ts/${entry.name}`)
    .sort();
}

try {
  withBuildLock(root, () => {
    if (args.includes("--write-index")) {
      writeArtifactIndex(root);
    }
    checkExternalReferences();
    runStaticChecks();
    runValidationCommands();
    console.log("Preflight passed.");
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Preflight failed: ${message}`);
  process.exit(1);
}
