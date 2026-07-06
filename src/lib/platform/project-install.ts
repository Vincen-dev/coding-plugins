import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

export type InstallPlatform = "cursor" | "copilot";

export interface InstallResult {
  platform: InstallPlatform;
  root: string;
  dry_run: boolean;
  overwritten: boolean;
  files: string[];
}

const SHARED_CONTENT = [
  "# Coding Plugins",
  "",
  "These instructions apply to every coding task in this project.",
  "",
  "Use Coding Plugins CLI `start` before selecting workflow skills.",
  "In Codex sessions, prefer the SessionStart-provided `CP_CLI` fallback: `${CP_CLI} <command> ...`.",
  "If a terminal shortcut is required, ask the user before running `${CP_CLI} cli install --scope user` or `${CP_CLI} cli install --scope project`.",
  "",
  "- Run `coding-plugins state check --root . --json` when a `.coding-plugins.yaml` file exists.",
  "- Run `coding-plugins validate --root . --format json` before executing formal PRD/TSD/TVD/TED/VED chains.",
  "- Run `coding-plugins execution-contract generate --root . --feature <feature> --doc-id <doc-id> --write` before TED execution.",
  "- Do not rely on conversation-only skill routing for formal document work.",
  "",
].join("\n");

const CURSOR_CONTENT = [
  "---",
  "description: Coding Plugins workflow guard",
  "globs: **/*",
  "alwaysApply: true",
  "---",
  "",
  SHARED_CONTENT,
].join("\n");

const COPILOT_CONTENT = SHARED_CONTENT;
const DEFAULT_DOCUMENTS_GITIGNORE_ENTRY = "docs/coding-plugins/";

export function platformFiles(root: string, platform: InstallPlatform): string[] {
  if (platform === "cursor") {
    return [join(root, ".cursor/rules/coding-plugins.mdc")];
  }
  return [join(root, ".github/copilot-instructions.md")];
}

function ensureDefaultDocumentsIgnored(root: string, options: { dryRun?: boolean } = {}): string {
  const path = join(root, ".gitignore");
  if (options.dryRun) {
    return path;
  }
  if (!existsSync(path)) {
    writeFileSync(path, `${DEFAULT_DOCUMENTS_GITIGNORE_ENTRY}\n`, "utf8");
    return path;
  }
  const text = readFileSync(path, "utf8");
  const hasEntry = text.split(/\r?\n/).some((line) => line.trim() === DEFAULT_DOCUMENTS_GITIGNORE_ENTRY);
  if (!hasEntry) {
    const separator = text.length === 0 ? "" : text.endsWith("\n") ? "\n" : "\n\n";
    writeFileSync(path, `${text}${separator}${DEFAULT_DOCUMENTS_GITIGNORE_ENTRY}\n`, "utf8");
  }
  return path;
}

export function installPlatform(root: string, platform: InstallPlatform, options: { dryRun?: boolean; force?: boolean } = {}): InstallResult {
  const files = platformFiles(root, platform);
  const existing = files.filter((path) => existsSync(path));
  if (existing.length > 0 && !options.force && !options.dryRun) {
    throw new Error(`refusing to overwrite existing ${platform} file(s): ${existing.map((path) => relative(root, path)).join(", ")}; pass --force to replace`);
  }
  const gitignore = ensureDefaultDocumentsIgnored(root, { dryRun: options.dryRun });
  if (!options.dryRun) {
    for (const path of files) {
      if (!existsSync(dirname(path))) {
        mkdirSync(dirname(path), { recursive: true });
      }
      writeFileSync(path, platform === "cursor" ? CURSOR_CONTENT : COPILOT_CONTENT, "utf8");
    }
  }
  return {
    platform,
    root,
    dry_run: options.dryRun ?? false,
    overwritten: existing.length > 0 && !options.dryRun,
    files: [...files, gitignore].map((path) => relative(root, path).replaceAll("\\", "/")),
  };
}
