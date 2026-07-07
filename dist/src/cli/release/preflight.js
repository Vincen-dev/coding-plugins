#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkArtifactIndexCoversDocuments, collectFormalFeatureRoots, featureEvidenceFiles, featureSpecFiles, writeArtifactIndex, } from "../../lib/documents/docs-index.js";
import { checkCodexHookConfigDeclared, checkManifestAssetPaths, checkManifestVersions, checkNpmPackageManifest, checkPlatformEntrypoints, checkRequiredPluginFiles, } from "../../lib/release/manifest-checks.js";
import { buildPayload as buildSpecPayload } from "../../lib/documents/validate-spec.js";
import { buildPayload as buildTddEvidencePayload } from "../../lib/documents/validate-tdd-evidence.js";
import { validateRepository as validateTechnicals } from "../../lib/documents/validate-technicals.js";
import { frontmatterListValues } from "../../lib/documents/document-metadata.js";
import { resolveArtifactMode } from "../../lib/documents/artifact-mode.js";
import { withBuildLock } from "../../lib/runtime/build-lock.js";
import { findRepositoryRoot } from "../../lib/runtime/repository-root.js";
const args = process.argv.slice(2);
const usage = "Usage: coding-plugins preflight [--root <path>] [--write-index] [--check-external-references]";
function parseArgs(argv) {
    const parsed = {
        root: findRepositoryRoot(dirname(fileURLToPath(import.meta.url))),
        writeIndex: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            const value = argv[index + 1];
            if (!value) {
                console.error(usage);
                process.exit(2);
            }
            parsed.root = resolve(value);
            index += 1;
        }
        else if (arg === "--write-index") {
            parsed.writeIndex = true;
        }
        else if (arg === "--check-external-references") {
            continue;
        }
        else {
            console.error(usage);
            process.exit(2);
        }
    }
    return parsed;
}
const options = parseArgs(args);
const root = options.root;
function collectSpecFiles() {
    return collectFormalFeatureRoots(root).flatMap((featureRoot) => featureSpecFiles(featureRoot)).sort();
}
function collectTddEvidenceFiles() {
    return collectFormalFeatureRoots(root).flatMap((featureRoot) => featureEvidenceFiles(featureRoot)).sort();
}
function runCommand(command, args) {
    console.log(`+ ${[command, ...args].join(" ")}`);
    const result = spawnSync(command, args, {
        cwd: root,
        stdio: "inherit",
    });
    if (result.status !== 0) {
        throw new Error(`${[command, ...args].join(" ")} failed with exit code ${result.status ?? 1}`);
    }
}
function assertPayload(name, payload) {
    if (payload.ok) {
        return;
    }
    const errors = payload.errors ?? payload.results?.flatMap((result) => result.errors) ?? [];
    throw new Error(`${name} failed: ${errors.join("; ")}`);
}
function checkNoPythonRuntime() {
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
function collectMarkdownFiles(directory) {
    if (!existsSync(directory)) {
        return [];
    }
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectMarkdownFiles(path));
        }
        else if (entry.isFile() && entry.name.endsWith(".md")) {
            files.push(path);
        }
    }
    return files.sort();
}
function isUrlReference(reference) {
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(reference);
}
function localReferenceExists(documentPath, reference) {
    if (isAbsolute(reference)) {
        return existsSync(reference);
    }
    const candidates = [resolve(root, reference), resolve(dirname(documentPath), reference)];
    return candidates.some((candidate) => existsSync(candidate));
}
function checkExternalReferences() {
    const files = collectFormalFeatureRoots(root).flatMap((featureRoot) => collectMarkdownFiles(featureRoot)).sort();
    const errors = [];
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
function runStaticChecks() {
    const artifactMode = resolveArtifactMode(root);
    if (artifactMode.errors.length > 0) {
        throw new Error(`Artifact mode validation failed: ${artifactMode.errors.join("; ")}`);
    }
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
        if (!artifactMode.formal_evidence_allowed) {
            throw new Error("Artifact mode validation failed: local artifact mode evidence cannot be used as formal completion evidence.");
        }
        assertPayload("TDD evidence validation", buildTddEvidencePayload(evidenceFiles, {
            strict: true,
            root,
            artifactMode: artifactMode.mode,
        }));
    }
    assertPayload("Technical design validation", validateTechnicals(root, { strict: true, includeIgnored: false }));
}
function runValidationCommands() {
    runCommand("npm", ["run", "typecheck"]);
    for (const testFile of collectTypeScriptTestFiles()) {
        runCommand("node", ["--test", testFile]);
    }
    runCommand("bash", ["tests/hooks/test-session-start.sh"]);
}
function collectTypeScriptTestFiles() {
    return readdirSync(join(root, "tests/ts"), { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".test.mjs"))
        .map((entry) => `tests/ts/${entry.name}`)
        .sort();
}
try {
    withBuildLock(root, () => {
        if (options.writeIndex) {
            writeArtifactIndex(root);
        }
        checkExternalReferences();
        runStaticChecks();
        runValidationCommands();
        console.log("Preflight passed.");
    });
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Preflight failed: ${message}`);
    process.exit(1);
}
