#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

type JsonObject = Record<string, unknown>;

type ReleaseMetadata = {
  version: string;
  tagName: string;
  notes: string;
};

type Args = {
  root: string;
  version?: string;
  notesOut?: string;
  githubOutput?: string;
  skipGitChecks: boolean;
  allowDirty: boolean;
};

function parseArgs(argv: string[]): Args {
  const args = [...argv];
  const parsed: Args = {
    root: ".",
    skipGitChecks: false,
    allowDirty: false,
  };
  while (args.length > 0) {
    const option = args.shift();
    if (option === "--root") {
      parsed.root = requireValue(args, option);
    } else if (option === "--version") {
      parsed.version = requireValue(args, option);
    } else if (option === "--notes-out") {
      parsed.notesOut = requireValue(args, option);
    } else if (option === "--github-output") {
      parsed.githubOutput = requireValue(args, option);
    } else if (option === "--skip-git-checks") {
      parsed.skipGitChecks = true;
    } else if (option === "--allow-dirty") {
      parsed.allowDirty = true;
    } else {
      throw new Error(`unrecognized arguments: ${option}`);
    }
  }
  return parsed;
}

function requireValue(args: string[], option: string): string {
  const value = args.shift();
  if (!value) {
    throw new Error(`argument ${option}: expected one argument`);
  }
  return value;
}

function validateVersion(version: string): void {
  if (!SEMVER_RE.test(version)) {
    throw new Error(`Version must be strict semver: ${version}`);
  }
}

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function tagNameForVersion(version: string): string {
  validateVersion(version);
  return `v${version}`;
}

function extractReleaseNotesSection(text: string, version: string): string {
  const heading = new RegExp(`^##\\s+${escapeRegExp(version)}(?:\\s+-[^\\n]+)?\\s*$`, "m");
  const match = heading.exec(text);
  if (!match || match.index === undefined) {
    throw new Error(`Release notes section not found for version: ${version}`);
  }
  const start = match.index + match[0].length;
  const nextText = text.slice(start);
  const nextHeading = /^##\s+/m.exec(nextText);
  const end = nextHeading?.index === undefined ? text.length : start + nextHeading.index;
  const notes = text.slice(start, end).trim();
  if (!notes) {
    throw new Error(`Release notes section is empty for version: ${version}`);
  }
  return notes;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function manifestVersion(root: string): string {
  const codex = readJson(resolve(root, ".codex-plugin/plugin.json"));
  const version = codex.version;
  if (typeof version !== "string" || !version.trim()) {
    throw new Error("Codex manifest must define a non-empty version.");
  }
  validateVersion(version);
  return version;
}

function validateReleaseMetadata(root: string, expectedVersion?: string): ReleaseMetadata {
  const resolvedRoot = resolve(root);
  const version = manifestVersion(resolvedRoot);
  if (expectedVersion !== undefined && expectedVersion !== version) {
    throw new Error(`Expected version ${expectedVersion}, but manifest version is ${version}.`);
  }
  const claude = readJson(resolve(resolvedRoot, ".claude-plugin/plugin.json"));
  const config = readJson(resolve(resolvedRoot, ".version-bump.json"));
  const packageManifest = readJson(resolve(resolvedRoot, "package.json"));
  if (claude.version !== version) {
    throw new Error(`Claude manifest version differs from Codex manifest: ${String(claude.version)} != ${version}.`);
  }
  if (config.version !== version) {
    throw new Error(`Version bump config version differs from manifest: ${String(config.version)} != ${version}.`);
  }
  if (packageManifest.version !== version) {
    throw new Error(`NPM package version differs from Codex manifest: ${String(packageManifest.version)} != ${version}.`);
  }
  const releaseNotes = readFileSync(resolve(resolvedRoot, "RELEASE-NOTES.md"), "utf8");
  return {
    version,
    tagName: tagNameForVersion(version),
    notes: extractReleaseNotesSection(releaseNotes, version),
  };
}

function runGit(root: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout).trim());
  }
  return result.stdout.trim();
}

function validateGitReleaseState(root: string, tagName: string, allowDirty: boolean): void {
  try {
    runGit(root, ["rev-parse", "--is-inside-work-tree"]);
  } catch (error) {
    throw new Error("Release preparation must run inside a git repository.");
  }
  if (!allowDirty && runGit(root, ["status", "--short"])) {
    throw new Error("Working tree must be clean before preparing a release tag.");
  }
  const existingTag = spawnSync("git", ["rev-parse", "--verify", "--quiet", `refs/tags/${tagName}`], {
    cwd: root,
    encoding: "utf8",
  });
  if (existingTag.status === 0) {
    throw new Error(`Release tag already exists: ${tagName}`);
  }
}

function writeGithubOutput(path: string, metadata: ReleaseMetadata): void {
  appendFileSync(path, `version=${metadata.version}\n`, "utf8");
  appendFileSync(path, `tag=${metadata.tagName}\n`, "utf8");
}

function main(argv: string[]): number {
  try {
    const args = parseArgs(argv);
    const root = resolve(args.root);
    const metadata = validateReleaseMetadata(root, args.version);
    if (!args.skipGitChecks) {
      validateGitReleaseState(root, metadata.tagName, args.allowDirty);
    }
    if (args.notesOut) {
      writeFileSync(args.notesOut, `${metadata.notes}\n`, "utf8");
    }
    if (args.githubOutput) {
      writeGithubOutput(args.githubOutput, metadata);
    }
    console.log(`Release ready: ${metadata.tagName}`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Release preparation failed: ${message}`);
    return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
