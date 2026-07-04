import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
export const STATE_FILE_NAME = ".coding-plugins.yaml";
function stateKey(state) {
    return `${state.feature}\0${state.doc_id}`;
}
function statePath(root) {
    return join(root, STATE_FILE_NAME);
}
function stateLockPath(root) {
    const digest = createHash("sha256").update(statePath(root), "utf8").digest("hex").slice(0, 16);
    return join(tmpdir(), `coding-plugins-state-${digest}.lock`);
}
function sleepSync(ms) {
    const signal = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(signal, 0, 0, ms);
}
function stateLockIsStale(lockPath, staleMs) {
    if (!existsSync(join(lockPath, "owner.json"))) {
        return true;
    }
    try {
        const owner = JSON.parse(readFileSync(join(lockPath, "owner.json"), "utf8"));
        return !owner.created_at || Date.now() - owner.created_at > staleMs;
    }
    catch {
        return true;
    }
}
function withStateFileLock(root, fn) {
    const lockPath = stateLockPath(root);
    if (process.env.CODING_PLUGINS_STATE_LOCK === lockPath) {
        return fn();
    }
    const timeoutMs = 30_000;
    const staleMs = 300_000;
    const started = Date.now();
    while (true) {
        try {
            mkdirSync(lockPath);
            writeFileSync(join(lockPath, "owner.json"), JSON.stringify({ pid: process.pid, path: statePath(root), created_at: Date.now() }), "utf8");
            break;
        }
        catch {
            if (existsSync(lockPath) && stateLockIsStale(lockPath, staleMs)) {
                rmSync(lockPath, { recursive: true, force: true });
                continue;
            }
            if (Date.now() - started > timeoutMs) {
                throw new Error(`Timed out waiting for state file lock: ${lockPath}`);
            }
            sleepSync(50);
        }
    }
    const previousLock = process.env.CODING_PLUGINS_STATE_LOCK;
    process.env.CODING_PLUGINS_STATE_LOCK = lockPath;
    try {
        return fn();
    }
    finally {
        if (previousLock === undefined) {
            delete process.env.CODING_PLUGINS_STATE_LOCK;
        }
        else {
            process.env.CODING_PLUGINS_STATE_LOCK = previousLock;
        }
        rmSync(lockPath, { recursive: true, force: true });
    }
}
function quote(value) {
    return JSON.stringify(value);
}
function unquote(value) {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
            return String(JSON.parse(trimmed));
        }
        catch {
            return trimmed.slice(1, -1);
        }
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}
function scalarLine(key, value, indent = "") {
    return `${indent}${key}: ${quote(value)}`;
}
export function renderState(state) {
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
    }
    else {
        for (const transition of state.transitions) {
            lines.push(`  - from: ${quote(transition.from)}`);
            lines.push(`    to: ${quote(transition.to)}`);
            lines.push(`    at: ${quote(transition.at)}`);
            lines.push(`    reason: ${quote(transition.reason)}`);
        }
    }
    return `${lines.join("\n")}\n`;
}
export function renderStateFile(file) {
    const lines = [
        "schema_version: 2",
        "active:",
        scalarLine("feature", file.active.feature, "  "),
        scalarLine("doc_id", file.active.doc_id, "  "),
        "workflows:",
    ];
    for (const workflow of file.workflows) {
        lines.push(`  - schema_version: ${workflow.schema_version}`);
        lines.push(scalarLine("workflow", workflow.workflow, "    "));
        lines.push(scalarLine("feature", workflow.feature, "    "));
        lines.push(scalarLine("doc_id", workflow.doc_id, "    "));
        lines.push(scalarLine("state", workflow.state, "    "));
        lines.push(scalarLine("updated_at", workflow.updated_at, "    "));
        lines.push(scalarLine("artifacts_hash", workflow.artifacts_hash, "    "));
        if (workflow.transitions.length === 0) {
            lines.push("    transitions: []");
        }
        else {
            lines.push("    transitions:");
            for (const transition of workflow.transitions) {
                lines.push(`      - from: ${quote(transition.from)}`);
                lines.push(scalarLine("to", transition.to, "        "));
                lines.push(scalarLine("at", transition.at, "        "));
                lines.push(scalarLine("reason", transition.reason, "        "));
            }
        }
    }
    return `${lines.join("\n")}\n`;
}
export function parseStateYaml(text) {
    const scalars = {};
    const transitions = [];
    let current = null;
    for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) {
            continue;
        }
        if (line.startsWith("  - ")) {
            if (current) {
                transitions.push(current);
            }
            current = {};
            const [key, ...rest] = line.slice(4).split(":");
            current[key.trim()] = unquote(rest.join(":"));
            continue;
        }
        if (line.startsWith("    ") && current) {
            const [key, ...rest] = line.trim().split(":");
            current[key.trim()] = unquote(rest.join(":"));
            continue;
        }
        if (!line.startsWith(" ") && line.includes(":")) {
            const [key, ...rest] = line.split(":");
            scalars[key.trim()] = unquote(rest.join(":"));
        }
    }
    if (current) {
        transitions.push(current);
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
function parseStateJson(text) {
    const trimmed = text.trim();
    if (!trimmed.startsWith("{")) {
        return null;
    }
    const parsed = JSON.parse(trimmed);
    const workflows = Array.isArray(parsed.workflows) ? parsed.workflows : [];
    const active = parsed.active ?? workflows[0] ?? { feature: "", doc_id: "" };
    return {
        schema_version: Number(parsed.schema_version ?? 2),
        active: {
            feature: String(active.feature ?? ""),
            doc_id: String(active.doc_id ?? ""),
        },
        workflows,
    };
}
function parseKeyValue(line) {
    const [key, ...rest] = line.split(":");
    return [key.trim(), unquote(rest.join(":"))];
}
function parseStateFileYamlV2(text) {
    if (!/^schema_version:\s*2\s*$/m.test(text) || !/^workflows:\s*$/m.test(text)) {
        return null;
    }
    const active = { feature: "", doc_id: "" };
    const workflows = [];
    let section = "root";
    let current = null;
    let currentTransition = null;
    let inTransitions = false;
    const pushTransition = () => {
        if (currentTransition && current) {
            const transition = currentTransition;
            if (transition.from && transition.to && transition.at) {
                current.transitions.push(transition);
            }
        }
        currentTransition = null;
    };
    for (const rawLine of text.split(/\r?\n/)) {
        if (!rawLine.trim()) {
            continue;
        }
        if (rawLine === "active:") {
            section = "active";
            inTransitions = false;
            continue;
        }
        if (rawLine === "workflows:") {
            section = "workflows";
            inTransitions = false;
            continue;
        }
        if (section === "active" && rawLine.startsWith("  ") && !rawLine.startsWith("  - ")) {
            const [key, value] = parseKeyValue(rawLine.trim());
            if (key === "feature" || key === "doc_id") {
                active[key] = value;
            }
            continue;
        }
        if (section !== "workflows") {
            continue;
        }
        if (rawLine.startsWith("  - ")) {
            pushTransition();
            const [key, value] = parseKeyValue(rawLine.slice(4));
            current = {
                schema_version: key === "schema_version" ? Number(value) : 1,
                workflow: "full-chain",
                feature: "",
                doc_id: "",
                state: "not-started",
                updated_at: "",
                artifacts_hash: "",
                transitions: [],
            };
            workflows.push(current);
            inTransitions = false;
            continue;
        }
        if (!current) {
            continue;
        }
        if (rawLine.startsWith("    ") && !rawLine.startsWith("      ")) {
            pushTransition();
            const [key, value] = parseKeyValue(rawLine.trim());
            inTransitions = key === "transitions";
            if (key === "schema_version") {
                current.schema_version = Number(value);
            }
            else if (key === "workflow" || key === "feature" || key === "doc_id" || key === "state" || key === "updated_at" || key === "artifacts_hash") {
                current[key] = value;
            }
            continue;
        }
        if (inTransitions && rawLine.startsWith("      - ")) {
            pushTransition();
            currentTransition = {};
            const [key, value] = parseKeyValue(rawLine.slice(8));
            currentTransition[key.trim()] = value;
            continue;
        }
        if (inTransitions && currentTransition && rawLine.startsWith("        ")) {
            const [key, value] = parseKeyValue(rawLine.trim());
            currentTransition[key.trim()] = value;
        }
    }
    pushTransition();
    return { schema_version: 2, active: active.feature || active.doc_id ? active : workflows[0] ?? active, workflows };
}
export function parseStateFile(text) {
    const parsedJson = parseStateJson(text);
    if (parsedJson) {
        return parsedJson;
    }
    const parsedYamlV2 = parseStateFileYamlV2(text);
    if (parsedYamlV2) {
        return parsedYamlV2;
    }
    const legacyState = parseStateYaml(text);
    return {
        schema_version: 2,
        active: {
            feature: legacyState.feature,
            doc_id: legacyState.doc_id,
        },
        workflows: [legacyState],
    };
}
function hashDirectory(root) {
    const digest = createHash("sha256");
    const visit = (directory) => {
        if (!existsSync(directory)) {
            return;
        }
        for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(path);
            }
            else if (entry.isFile() && entry.name.endsWith(".md")) {
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
export function initialState(root, options) {
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
function initialStateFile(state) {
    return {
        schema_version: 2,
        active: {
            feature: state.feature,
            doc_id: state.doc_id,
        },
        workflows: [state],
    };
}
export function writeStateFile(root, file) {
    return withStateFileLock(root, () => {
        const path = statePath(root);
        const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
        writeFileSync(tempPath, renderStateFile(file), "utf8");
        renameSync(tempPath, path);
        return file;
    });
}
export function writeState(root, state) {
    return withStateFileLock(root, () => {
        writeStateFile(root, initialStateFile(state));
        return state;
    });
}
export function initState(root, options) {
    return withStateFileLock(root, () => {
        const next = initialState(root, options);
        const path = statePath(root);
        const file = existsSync(path) ? readStateFile(root) : initialStateFile(next);
        const workflows = file.workflows.filter((workflow) => stateKey(workflow) !== stateKey(next));
        workflows.push(next);
        writeStateFile(root, {
            schema_version: 2,
            active: { feature: next.feature, doc_id: next.doc_id },
            workflows,
        });
        return { ...next, schema_version: 2 };
    });
}
export function readState(root) {
    const file = readStateFile(root);
    const active = selectState(file);
    if (!active) {
        throw new Error(`${STATE_FILE_NAME} has no workflow records`);
    }
    return active;
}
export function readStateFile(root) {
    return parseStateFile(readFileSync(statePath(root), "utf8"));
}
function selectState(file, options = {}) {
    const feature = options.feature ?? file.active.feature;
    const docId = options.docId ?? file.active.doc_id;
    return file.workflows.find((workflow) => workflow.feature === feature && workflow.doc_id === docId) ?? file.workflows[0] ?? null;
}
export function validateState(state) {
    const errors = [];
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
export function validateStateFile(file) {
    const errors = [];
    if (file.schema_version !== 2) {
        errors.push("schema_version must be 2");
    }
    if (!Array.isArray(file.workflows) || file.workflows.length === 0) {
        errors.push("workflows must contain at least one record");
        return errors;
    }
    const seen = new Set();
    for (const workflow of file.workflows) {
        const key = stateKey(workflow);
        if (seen.has(key)) {
            errors.push(`duplicate workflow record: ${workflow.feature}/${workflow.doc_id}`);
        }
        seen.add(key);
        errors.push(...validateState(workflow).map((error) => `${workflow.feature || "<missing>"}/${workflow.doc_id || "<missing>"} ${error}`));
    }
    if (!selectState(file)) {
        errors.push(`active workflow is missing: ${file.active.feature}/${file.active.doc_id}`);
    }
    return errors;
}
export function checkState(root) {
    const path = statePath(root);
    if (!existsSync(path)) {
        const state = initialState(root, { feature: "", docId: "" });
        return {
            ...state,
            path,
            valid: false,
            errors: [`${STATE_FILE_NAME} is missing`],
            workflows: [],
        };
    }
    const file = readStateFile(root);
    const state = selectState(file) ?? initialState(root, { feature: "", docId: "" });
    const errors = validateStateFile(file);
    return { ...state, schema_version: file.schema_version, path, valid: errors.length === 0, errors, workflows: file.workflows };
}
export function transitionState(root, options) {
    return withStateFileLock(root, () => {
        const file = readStateFile(root);
        const state = selectState(file, { feature: options.feature, docId: options.docId });
        if (!state) {
            throw new Error(`workflow record not found: ${options.feature ?? file.active.feature}/${options.docId ?? file.active.doc_id}`);
        }
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
        file.active = { feature: state.feature, doc_id: state.doc_id };
        file.schema_version = 2;
        writeStateFile(root, file);
        return { ...state, schema_version: 2 };
    });
}
export function auditState(root) {
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
