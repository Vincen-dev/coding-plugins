#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

type JsonObject = Record<string, unknown>;

type VersionBumpFileEntry = {
  path?: unknown;
  field?: unknown;
};

function parseArgs(argv: string[]): { version: string; root: string } {
  const args = [...argv];
  const version = args.shift();
  if (!version) {
    throw new Error("the following arguments are required: version");
  }
  let root = ".";
  while (args.length > 0) {
    const option = args.shift();
    if (option === "--root") {
      const value = args.shift();
      if (!value) {
        throw new Error("argument --root: expected one argument");
      }
      root = value;
      continue;
    }
    throw new Error(`unrecognized arguments: ${option}`);
  }
  return { version, root };
}

function validateVersion(version: string): void {
  if (!SEMVER_RE.test(version)) {
    throw new Error(`Version must be strict semver: ${version}`);
  }
}

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function writeJson(path: string, data: JsonObject): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function updateVersions(root: string, version: string): void {
  validateVersion(version);
  const resolvedRoot = resolve(root);
  const configPath = resolve(resolvedRoot, ".version-bump.json");
  const config = readJson(configPath);
  const files = config.files;
  if (!Array.isArray(files)) {
    throw new Error(".version-bump.json must define a files array.");
  }

  for (const item of files as VersionBumpFileEntry[]) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(".version-bump.json files entries must be objects.");
    }
    const relativePath = item.path;
    const field = item.field ?? "version";
    if (typeof relativePath !== "string" || typeof field !== "string") {
      throw new Error(".version-bump.json files entries require string path and field.");
    }
    const targetPath = resolve(resolvedRoot, relativePath);
    const data = readJson(targetPath);
    data[field] = version;
    writeJson(targetPath, data);
  }
}

function main(argv: string[]): number {
  try {
    const args = parseArgs(argv);
    updateVersions(args.root, args.version);
    console.log(`Version bumped to ${args.version}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Version bump failed: ${message}`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
