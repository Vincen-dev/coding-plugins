import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

export const STATE_FILE_NAME = ".coding-plugins.yaml";

export interface StateTransition {
  from: string;
  to: string;
  at: string;
  reason: string;
}

export interface CodingPluginsState {
  schema_version: number;
  workflow: string;
  feature: string;
  doc_id: string;
  state: string;
  updated_at: string;
  artifacts_hash: string;
  transitions: StateTransition[];
}

export interface StateCheckResult extends CodingPluginsState {
  path: string;
  valid: boolean;
  errors: string[];
}

export interface StateAuditResult {
  path: string;
  valid: boolean;
  findings: string[];
  state: CodingPluginsState | null;
}

function statePath(root: string): string {
  return join(root, STATE_FILE_NAME);
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function renderState(state: CodingPluginsState): string {
  const lines = [
    "schema_version: 1",
    `workflow: ${quote(state.workflow)}`,
    `feature: ${quote(state.feature)}`,
    `doc_id: ${quote(state.doc_id)}`,
    `state: ${quote(state.state)}`,
    `updated_at: ${quote(state.updated_at)}`,
    `artifacts_hash: ${quote(state.artifacts_hash)}`,
    "transitions:",
  ];
  if (state.transitions.length === 0) {
    lines.push("  []");
  } else {
    for (const transition of state.transitions) {
      lines.push(`  - from: ${quote(transition.from)}`);
      lines.push(`    to: ${quote(transition.to)}`);
      lines.push(`    at: ${quote(transition.at)}`);
      lines.push(`    reason: ${quote(transition.reason)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export function parseStateYaml(text: string): CodingPluginsState {
  const scalars: Record<string, string> = {};
  const transitions: StateTransition[] = [];
  let current: Partial<StateTransition> | null = null;

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    if (line.startsWith("  - ")) {
      if (current) {
        transitions.push(current as StateTransition);
      }
      current = {};
      const [key, ...rest] = line.slice(4).split(":");
      current[key.trim() as keyof StateTransition] = unquote(rest.join(":"));
      continue;
    }
    if (line.startsWith("    ") && current) {
      const [key, ...rest] = line.trim().split(":");
      current[key.trim() as keyof StateTransition] = unquote(rest.join(":"));
      continue;
    }
    if (!line.startsWith(" ") && line.includes(":")) {
      const [key, ...rest] = line.split(":");
      scalars[key.trim()] = unquote(rest.join(":"));
    }
  }
  if (current) {
    transitions.push(current as StateTransition);
  }

  return {
    schema_version: Number(scalars.schema_version || "1"),
    workflow: scalars.workflow || "full-chain",
    feature: scalars.feature || "",
    doc_id: scalars.doc_id || "",
    state: scalars.state || "not-started",
    updated_at: scalars.updated_at || "",
    artifacts_hash: scalars.artifacts_hash || "",
    transitions: transitions.filter((transition) => transition.from && transition.to && transition.at),
  };
}

function hashDirectory(root: string): string {
  const digest = createHash("sha256");
  const visit = (directory: string): void => {
    if (!existsSync(directory)) {
      return;
    }
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(path);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        digest.update(relative(root, path));
        digest.update("\0");
        digest.update(readFileSync(path));
        digest.update("\0");
      }
    }
  };
  visit(join(root, "docs/coding-plugins/features"));
  return `sha256:${digest.digest("hex")}`;
}

export function initialState(
  root: string,
  options: { feature: string; docId: string; state?: string; workflow?: string; now?: string },
): CodingPluginsState {
  const now = options.now ?? new Date().toISOString();
  return {
    schema_version: 1,
    workflow: options.workflow ?? "full-chain",
    feature: options.feature,
    doc_id: options.docId,
    state: options.state ?? "not-started",
    updated_at: now,
    artifacts_hash: hashDirectory(root),
    transitions: [],
  };
}

export function writeState(root: string, state: CodingPluginsState): CodingPluginsState {
  writeFileSync(statePath(root), renderState(state), "utf8");
  return state;
}

export function initState(root: string, options: { feature: string; docId: string; state?: string; workflow?: string }): CodingPluginsState {
  return writeState(root, initialState(root, options));
}

export function readState(root: string): CodingPluginsState {
  return parseStateYaml(readFileSync(statePath(root), "utf8"));
}

export function validateState(state: CodingPluginsState): string[] {
  const errors: string[] = [];
  if (state.schema_version !== 1) {
    errors.push("schema_version must be 1");
  }
  if (!state.feature) {
    errors.push("feature is required");
  }
  if (!state.doc_id) {
    errors.push("doc_id is required");
  }
  if (!state.state) {
    errors.push("state is required");
  }
  return errors;
}

export function checkState(root: string): StateCheckResult {
  const path = statePath(root);
  if (!existsSync(path)) {
    return {
      ...initialState(root, { feature: "", docId: "" }),
      path,
      valid: false,
      errors: [`${STATE_FILE_NAME} is missing`],
    };
  }
  const state = readState(root);
  const errors = validateState(state);
  return { ...state, path, valid: errors.length === 0, errors };
}

export function transitionState(root: string, options: { to: string; from?: string; reason?: string }): CodingPluginsState {
  const state = readState(root);
  if (options.from && state.state !== options.from) {
    throw new Error(`current state '${state.state}' does not match expected from state '${options.from}'`);
  }
  const now = new Date().toISOString();
  state.transitions.push({
    from: state.state,
    to: options.to,
    at: now,
    reason: options.reason ?? "manual transition",
  });
  state.state = options.to;
  state.updated_at = now;
  state.artifacts_hash = hashDirectory(root);
  return writeState(root, state);
}

export function auditState(root: string): StateAuditResult {
  const checked = checkState(root);
  if (!checked.valid) {
    return { path: checked.path, valid: false, findings: checked.errors, state: null };
  }
  const findings = [
    `${STATE_FILE_NAME} is present`,
    `current state is ${checked.state}`,
    `${checked.transitions.length} transition(s) recorded`,
    `artifacts hash ${checked.artifacts_hash}`,
  ];
  return { path: checked.path, valid: true, findings, state: checked };
}
