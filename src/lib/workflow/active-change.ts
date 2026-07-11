import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { createWorkflowDiagnostic } from "./diagnostics.ts";
import type { WorkflowDiagnostic } from "./diagnostics.ts";
import type { UserFlow } from "./route-decision.ts";
import { readStandardChangeDocument } from "../documents/change-document.ts";

export interface ActiveChangeRecord {
  schemaVersion: 1;
  id: string;
  flow: UserFlow;
  feature?: string;
  docId?: string;
  intentFingerprint: string;
  scope: {
    plannedFiles?: string[];
    specIds?: string[];
    summary: string;
  };
  currentTaskId?: string;
  state: "drafting" | "approval-pending" | "ready" | "executing" | "needs-rescope" | "verifying" | "complete" | "archived";
  artifactRef?: string;
  updatedAt: string;
}

export interface ActiveChangeRestoreResult {
  record: ActiveChangeRecord | null;
  source: "explicit" | "cache" | "standard-change" | "none";
  diagnostics: WorkflowDiagnostic[];
}

export const ACTIVE_CHANGE_STATE_FILE = ".coding-plugins/runtime-state.json";

function activeChangeStatePath(root: string): string {
  return join(root, ACTIVE_CHANGE_STATE_FILE);
}

function isRecord(value: unknown): value is ActiveChangeRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<ActiveChangeRecord>;
  return candidate.schemaVersion === 1 && typeof candidate.id === "string" && typeof candidate.intentFingerprint === "string"
    && Boolean(candidate.scope && typeof candidate.scope.summary === "string");
}

export function saveActiveChange(root: string, record: ActiveChangeRecord): string {
  const path = activeChangeStatePath(root);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  renameSync(temporary, path);
  return path;
}

export function loadActiveChange(root: string): ActiveChangeRecord | null {
  const path = activeChangeStatePath(root);
  if (!existsSync(path)) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function standardChangeCandidates(root: string): ActiveChangeRecord[] {
  const changesRoot = join(root, "docs/coding-plugins/changes");
  if (!existsSync(changesRoot)) {
    return [];
  }
  const records: ActiveChangeRecord[] = [];
  for (const entry of readdirSync(changesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const path = join(changesRoot, entry.name, "change.md");
    if (!existsSync(path)) {
      continue;
    }
    const record = readStandardChangeDocument(path);
    if (record && record.state !== "complete" && record.state !== "archived") {
      records.push({ ...record, artifactRef: relative(root, path).replaceAll("\\", "/") });
    }
  }
  return records.sort((left, right) => left.id.localeCompare(right.id));
}

export function restoreActiveChange(root: string, options: { changeId?: string } = {}): ActiveChangeRestoreResult {
  const cached = loadActiveChange(root);
  if (options.changeId && cached?.id === options.changeId) {
    return { record: cached, source: "explicit", diagnostics: [] };
  }
  if (!options.changeId && cached && cached.state !== "complete" && cached.state !== "archived") {
    return { record: cached, source: "cache", diagnostics: [] };
  }

  const candidates = standardChangeCandidates(root).filter((record) => !options.changeId || record.id === options.changeId);
  if (candidates.length === 1) {
    return { record: candidates[0], source: options.changeId ? "explicit" : "standard-change", diagnostics: [] };
  }
  if (candidates.length > 1) {
    return { record: null, source: "none", diagnostics: [createWorkflowDiagnostic("ACTIVE_CHANGE_AMBIGUOUS")] };
  }
  return { record: null, source: "none", diagnostics: [] };
}
