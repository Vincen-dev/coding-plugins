import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDecisionPoint } from "../agents/decision-points.js";
export const DECISION_STATE_FILE_NAME = ".coding-plugins-decisions.json";
function decisionPath(root) {
    return join(root, DECISION_STATE_FILE_NAME);
}
function emptyState() {
    return { schema_version: 1, decisions: [] };
}
function readState(root) {
    const path = decisionPath(root);
    if (!existsSync(path)) {
        return emptyState();
    }
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return {
        schema_version: Number(parsed.schema_version ?? 1),
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    };
}
function writeState(root, state) {
    writeFileSync(decisionPath(root), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
function key(options) {
    return `${options.feature}\0${options.docId}\0${options.id}`;
}
function blockedActionsForDecision(id) {
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
export function requiredDecisionsForTarget(target) {
    if (target === "execute") {
        return ["DP-4"];
    }
    return ["DP-6", "DP-7"];
}
function blockedActionsForTarget(target) {
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
export function getDecisionStatus(root, options) {
    const point = getDecisionPoint(options.id);
    const state = readState(root);
    const record = state.decisions.find((decision) => key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) === key(options)) ?? null;
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
export function requestDecision(root, options) {
    getDecisionPoint(options.id);
    const state = readState(root);
    const decisionKey = key(options);
    const now = new Date().toISOString();
    const existingIndex = state.decisions.findIndex((decision) => key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) === decisionKey);
    const record = {
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
    }
    else {
        state.decisions[existingIndex] = record;
    }
    writeState(root, state);
    return getDecisionStatus(root, options);
}
export function approveDecision(root, options) {
    getDecisionPoint(options.id);
    const state = readState(root);
    const decisionKey = key(options);
    const now = new Date().toISOString();
    const existing = state.decisions.find((decision) => key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) === decisionKey);
    const record = {
        feature: options.feature,
        doc_id: options.docId,
        id: options.id,
        status: "approved",
        reason: options.reason ?? existing?.reason ?? "",
        requested_at: existing?.requested_at ?? now,
        approved_at: now,
    };
    const next = state.decisions.filter((decision) => key({ feature: decision.feature, docId: decision.doc_id, id: decision.id }) !== decisionKey);
    next.push(record);
    writeState(root, { schema_version: 1, decisions: next });
    return getDecisionStatus(root, options);
}
export function auditDecisions(root, options) {
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
