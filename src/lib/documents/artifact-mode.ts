import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export const ARTIFACT_MODE_FILE = ".coding-plugins-artifacts.json";
export const DOCS_CODING_PLUGINS_DIR = "docs/coding-plugins";

export type ArtifactModeValue = "tracked" | "local" | "external";

export interface ArtifactModeStatus {
  mode: ArtifactModeValue;
  source: "config" | "inferred";
  root: string;
  docs_root: string;
  config_path: string;
  docs_ignored: boolean;
  formal_evidence_allowed: boolean;
  external_reference: string | null;
  errors: string[];
  warnings: string[];
}

interface ArtifactModeConfig {
  mode?: string;
  external_reference?: string;
  external_artifact_id?: string;
}

function normalizeRelativePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\.?\//, "").replace(/\/+$/, "");
}

function gitignorePatterns(root: string): string[] {
  const gitignore = join(root, ".gitignore");
  if (!existsSync(gitignore)) {
    return [];
  }
  return readFileSync(gitignore, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function gitignorePatternMatches(pattern: string, relativePath: string): boolean {
  const negated = pattern.startsWith("!");
  const cleaned = normalizeRelativePath(negated ? pattern.slice(1) : pattern);
  if (!cleaned || cleaned.includes("*")) {
    return false;
  }
  const normalizedPath = normalizeRelativePath(relativePath);
  return normalizedPath === cleaned || normalizedPath.startsWith(`${cleaned}/`);
}

export function isPathIgnoredByGitignore(root: string, path: string): boolean {
  const absolute = resolve(path);
  const relativePath = normalizeRelativePath(relative(root, absolute));
  let ignored = false;
  for (const pattern of gitignorePatterns(root)) {
    const negated = pattern.startsWith("!");
    if (!gitignorePatternMatches(pattern, relativePath)) {
      continue;
    }
    ignored = !negated;
  }
  return ignored;
}

function parseConfig(root: string): { config: ArtifactModeConfig | null; errors: string[] } {
  const configPath = join(root, ARTIFACT_MODE_FILE);
  if (!existsSync(configPath)) {
    return { config: null, errors: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(configPath, "utf8"));
    return { config: parsed && typeof parsed === "object" ? parsed as ArtifactModeConfig : {}, errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { config: {}, errors: [`${ARTIFACT_MODE_FILE} is not valid JSON: ${message}`] };
  }
}

function isArtifactModeValue(value: string | undefined): value is ArtifactModeValue {
  return value === "tracked" || value === "local" || value === "external";
}

export function resolveArtifactMode(root: string): ArtifactModeStatus {
  const resolvedRoot = resolve(root);
  const docsRoot = join(resolvedRoot, DOCS_CODING_PLUGINS_DIR);
  const configPath = join(resolvedRoot, ARTIFACT_MODE_FILE);
  const { config, errors } = parseConfig(resolvedRoot);
  const docsIgnored = isPathIgnoredByGitignore(resolvedRoot, docsRoot);
  const warnings: string[] = [];
  let source: ArtifactModeStatus["source"] = "inferred";
  let mode: ArtifactModeValue = existsSync(docsRoot) && !docsIgnored ? "tracked" : "local";
  let externalReference: string | null = null;

  if (config) {
    source = "config";
    if (isArtifactModeValue(config.mode)) {
      mode = config.mode;
    } else {
      errors.push(`${ARTIFACT_MODE_FILE} mode must be one of: tracked, local, external.`);
    }
    externalReference = config.external_reference ?? config.external_artifact_id ?? null;
  }

  if (mode === "tracked") {
    if (docsIgnored) {
      errors.push(`tracked artifact mode requires ${DOCS_CODING_PLUGINS_DIR}/ to be tracked, but .gitignore ignores it.`);
    }
    if (!existsSync(docsRoot)) {
      errors.push(`tracked artifact mode requires ${DOCS_CODING_PLUGINS_DIR}/ to exist in the repository.`);
    }
  }

  if (mode === "external" && !externalReference) {
    errors.push(`external artifact mode requires ${ARTIFACT_MODE_FILE} external_reference or external_artifact_id.`);
  }

  if (mode === "local") {
    warnings.push("local artifact mode is scratch-only and cannot be used as formal completion, commit, tag, release, or publish evidence.");
  }

  return {
    mode,
    source,
    root: resolvedRoot,
    docs_root: docsRoot,
    config_path: configPath,
    docs_ignored: docsIgnored,
    formal_evidence_allowed: mode !== "local" && errors.length === 0,
    external_reference: externalReference,
    errors,
    warnings,
  };
}
