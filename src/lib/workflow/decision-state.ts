import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getDecisionPoint } from "../agents/decision-points.ts";
import type { DecisionCatalogVersion } from "../agents/decision-points.ts";

export const DECISION_STATE_FILE_NAME = ".coding-plugins-decisions.json";

export type DecisionStatusValue = "requested" | "approved" | "stale";
export type DecisionAuditTarget = "execute" | "commit" | "tag" | "release" | "publish";

export interface DecisionRecord {
  feature: string;
  doc_id: string;
  id: string;
  status: DecisionStatusValue;
  reason: string;
  requested_at?: string;
  approved_at?: string;
  catalog_version?: DecisionCatalogVersion;
  artifact_hashes?: Record<string, string>;
  approved_bundle_hash?: string;
  required_policy_hash?: string;
  stale_reason?: string;
}

export interface DecisionStateFile {
  schema_version: number;
  decisions: DecisionRecord[];
}

export interface DecisionStatusResult {
  feature: string;
  doc_id: string;
  id: string;
  status: DecisionStatusValue | "missing";
  approved: boolean;
  point: Record<string, unknown>;
  record: DecisionRecord | null;
  blocked_actions: string[];
}

export interface DecisionAuditResult {
  ok: boolean;
  approved: boolean;
  feature: string;
  doc_id: string;
  target: DecisionAuditTarget;
  required_decision: string | null;
  required_decisions: string[];
  missing_decisions: string[];
  decisions: DecisionStatusResult[];
  blocked_actions: string[];
}

function decisionPath(root: string): string {
  return join(root, DECISION_STATE_FILE_NAME);
}

function emptyState(): DecisionStateFile {
  return { schema_version: 1, decisions: [] };
}

function readState(root: string): DecisionStateFile {
  const path = decisionPath(root);
  if (!existsSync(path)) {
    return emptyState();
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<DecisionStateFile>;
  return {
    schema_version: Number(parsed.schema_version ?? 1),
    decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
  };
}

function writeState(root: string, state: DecisionStateFile): void {
  writeFileSync(decisionPath(root), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function key(options: { feature: string; docId: string; id: string }): string {
  return `${options.feature}\0${options.docId}\0${options.id}`;
}

function isV1Record(record: DecisionRecord): boolean {
  return !record.catalog_version || record.catalog_version === "governed-v1";
}

function blockedActionsForDecision(id: string): string[] {
  if (id === "DP-4") {
    return ["execute"];
  }
  if (id === "DP-6") {
    return ["complete-claim", "commit", "tag", "release", "publish"];
  }
  if (id === "DP-7") {
    return ["commit", "tag", "release", "publish"];
  }
  return [];
}

export function requiredDecisionsForTarget(target: DecisionAuditTarget): string[] {
  if (target === "execute") {
    return ["DP-4"];
  }
  return ["DP-6", "DP-7"];
}

function blockedActionsForTarget(target: DecisionAuditTarget): string[] {
  if (target === "execute") {
    return ["execute"];
  }
  if (target === "commit") {
    return ["commit"];
  }
  if (target === "tag") {
    return ["tag"];
  }
  return ["release", "publish"];
}

export function getDecisionStatus(root: string, options: { feature: string; docId: string; id: string }): DecisionStatusResult {
  const point = getDecisionPoint(options.id);
  const state = readState(root);
  const record = state.decisions.find((decision) => isV1Record(decision)
    && key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) === key(options)) ?? null;
  const approved = record?.status === "approved";
  return {
    feature: options.feature,
    doc_id: options.docId,
    id: options.id,
    status: record?.status ?? "missing",
    approved,
    point,
    record,
    blocked_actions: approved ? [] : blockedActionsForDecision(options.id),
  };
}

export function requestDecision(root: string, options: { feature: string; docId: string; id: string; reason?: string }): DecisionStatusResult {
  getDecisionPoint(options.id);
  const state = readState(root);
  const decisionKey = key(options);
  const now = new Date().toISOString();
  const existingIndex = state.decisions.findIndex((decision) => isV1Record(decision)
    && key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) === decisionKey);
  const record: DecisionRecord = {
    feature: options.feature,
    doc_id: options.docId,
    id: options.id,
    status: existingIndex === -1 ? "requested" : state.decisions[existingIndex].status,
    reason: options.reason ?? state.decisions[existingIndex]?.reason ?? "",
    requested_at: state.decisions[existingIndex]?.requested_at ?? now,
    approved_at: state.decisions[existingIndex]?.approved_at,
  };
  if (existingIndex === -1) {
    state.decisions.push(record);
  } else {
    state.decisions[existingIndex] = record;
  }
  writeState(root, state);
  return getDecisionStatus(root, options);
}

export function approveDecision(root: string, options: { feature: string; docId: string; id: string; reason?: string }): DecisionStatusResult {
  getDecisionPoint(options.id);
  const state = readState(root);
  const decisionKey = key(options);
  const now = new Date().toISOString();
  const existing = state.decisions.find((decision) => isV1Record(decision)
    && key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) === decisionKey);
  const record: DecisionRecord = {
    feature: options.feature,
    doc_id: options.docId,
    id: options.id,
    status: "approved",
    reason: options.reason ?? existing?.reason ?? "",
    requested_at: existing?.requested_at ?? now,
    approved_at: now,
  };
  const next = state.decisions.filter((decision) => !isV1Record(decision)
    || key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) !== decisionKey);
  next.push(record);
  writeState(root, { schema_version: state.schema_version, decisions: next });
  return getDecisionStatus(root, options);
}

export function auditDecisions(root: string, options: { feature: string; docId: string; target: DecisionAuditTarget }): DecisionAuditResult {
  const required = requiredDecisionsForTarget(options.target);
  const decisions = required.map((id) => getDecisionStatus(root, { feature: options.feature, docId: options.docId, id }));
  const missing = decisions.filter((decision) => !decision.approved).map((decision) => decision.id);
  return {
    ok: missing.length === 0,
    approved: missing.length === 0,
    feature: options.feature,
    doc_id: options.docId,
    target: options.target,
    required_decision: missing[0] ?? required[0] ?? null,
    required_decisions: required,
    missing_decisions: missing,
    decisions,
    blocked_actions: missing.length === 0 ? [] : blockedActionsForTarget(options.target),
  };
}

export interface DecisionBundleInput {
  artifacts: Record<string, string>;
  requiredPolicies?: unknown[];
  requiredSkills?: unknown[];
  advisorySkills?: unknown[];
  approvedWaivers?: string[];
}

export interface DecisionV2Result {
  feature: string;
  doc_id: string;
  id: string;
  catalog_version: "governed-v2";
  status: "approved" | "stale" | "missing";
  approved: boolean;
  approved_bundle_hash?: string;
  required_policy_hash?: string;
  stale_reason?: string;
}

function semanticArtifact(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s*updated\s*:/i.test(line))
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([keyName, child]) => [keyName, canonicalize(child)]));
  }
  return value;
}

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex")}`;
}

export function computeDecisionBundleHash(bundle: DecisionBundleInput): string {
  return sha256({
    artifacts: Object.fromEntries(Object.entries(bundle.artifacts).map(([name, text]) => [name, semanticArtifact(text)])),
    requiredPolicies: bundle.requiredPolicies ?? [],
    requiredSkills: bundle.requiredSkills ?? [],
    approvedWaivers: bundle.approvedWaivers ?? [],
  });
}

function computeRequiredPolicyHash(bundle: DecisionBundleInput): string {
  return sha256(bundle.requiredPolicies ?? []);
}

function computeArtifactHashes(bundle: DecisionBundleInput): Record<string, string> {
  return Object.fromEntries(Object.entries(bundle.artifacts).sort(([left], [right]) => left.localeCompare(right))
    .map(([name, text]) => [name, sha256(semanticArtifact(text))]));
}

function v2Record(state: DecisionStateFile, options: { feature: string; docId: string; id: string }): DecisionRecord | undefined {
  return state.decisions.find((record) => record.catalog_version === "governed-v2"
    && key({ feature: record.feature, docId: record.doc_id, id: record.id }) === key(options));
}

function previousV2Decision(id: string): string | null {
  if (id === "DP-2") {
    return "DP-1";
  }
  if (id === "DP-3") {
    return "DP-2";
  }
  return null;
}

export function approveDecisionV2(root: string, options: {
  feature: string;
  docId: string;
  id: "DP-1" | "DP-2" | "DP-3";
  bundle: DecisionBundleInput;
  reason: string;
}): DecisionV2Result {
  getDecisionPoint(options.id, "governed-v2");
  const state = readState(root);
  const previous = previousV2Decision(options.id);
  if (previous) {
    const priorRecord = v2Record(state, { feature: options.feature, docId: options.docId, id: previous });
    if (priorRecord?.status !== "approved") {
      throw new Error(`${previous} must be approved before ${options.id}`);
    }
  }
  const now = new Date().toISOString();
  const existing = v2Record(state, options);
  const record: DecisionRecord = {
    feature: options.feature,
    doc_id: options.docId,
    id: options.id,
    catalog_version: "governed-v2",
    status: "approved",
    reason: options.reason,
    requested_at: existing?.requested_at ?? now,
    approved_at: now,
    artifact_hashes: computeArtifactHashes(options.bundle),
    approved_bundle_hash: computeDecisionBundleHash(options.bundle),
    required_policy_hash: computeRequiredPolicyHash(options.bundle),
  };
  const decisions = state.decisions.filter((candidate) => candidate !== existing);
  decisions.push(record);
  writeState(root, { schema_version: Math.max(2, state.schema_version), decisions });
  return {
    feature: record.feature,
    doc_id: record.doc_id,
    id: record.id,
    catalog_version: "governed-v2",
    status: "approved",
    approved: true,
    approved_bundle_hash: record.approved_bundle_hash,
    required_policy_hash: record.required_policy_hash,
  };
}

export function auditDecisionV2(root: string, options: {
  feature: string;
  docId: string;
  id: "DP-1" | "DP-2" | "DP-3";
  bundle: DecisionBundleInput;
}): DecisionV2Result {
  const state = readState(root);
  const record = v2Record(state, options);
  if (!record) {
    return { feature: options.feature, doc_id: options.docId, id: options.id, catalog_version: "governed-v2", status: "missing", approved: false };
  }
  const currentHash = computeDecisionBundleHash(options.bundle);
  if (record.approved_bundle_hash === currentHash) {
    if (record.status === "stale") {
      record.status = "approved";
      delete record.stale_reason;
      writeState(root, state);
    }
    return {
      feature: record.feature,
      doc_id: record.doc_id,
      id: record.id,
      catalog_version: "governed-v2",
      status: "approved",
      approved: true,
      approved_bundle_hash: record.approved_bundle_hash,
      required_policy_hash: record.required_policy_hash,
    };
  }
  record.status = "stale";
  record.stale_reason = `bundle hash changed from ${record.approved_bundle_hash} to ${currentHash}`;
  writeState(root, state);
  return {
    feature: record.feature,
    doc_id: record.doc_id,
    id: record.id,
    catalog_version: "governed-v2",
    status: "stale",
    approved: false,
    approved_bundle_hash: record.approved_bundle_hash,
    required_policy_hash: record.required_policy_hash,
    stale_reason: record.stale_reason,
  };
}
