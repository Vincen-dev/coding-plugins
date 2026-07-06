import { accessSync, constants, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
export const SESSION_LOCK_FILE = ".coding-plugins/session-lock.json";
export function readPluginVersion(pluginRoot) {
    const packagePath = join(pluginRoot, "package.json");
    if (!existsSync(packagePath)) {
        return "unknown";
    }
    const parsed = JSON.parse(readFileSync(packagePath, "utf8"));
    return String(parsed.version ?? "unknown");
}
export function defaultThreadId() {
    return process.env.CODEX_THREAD_ID ?? process.env.CODEX_SESSION_ID ?? process.env.CLAUDE_SESSION_ID ?? null;
}
function lockPath(root) {
    return join(resolve(root), SESSION_LOCK_FILE);
}
function readLock(path) {
    if (!existsSync(path)) {
        return null;
    }
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return {
        schema_version: 1,
        plugin_version: String(parsed.plugin_version ?? ""),
        plugin_root: String(parsed.plugin_root ?? ""),
        cli_path: String(parsed.cli_path ?? ""),
        thread_id: parsed.thread_id ? String(parsed.thread_id) : null,
        created_at: String(parsed.created_at ?? ""),
    };
}
function readable(path) {
    try {
        accessSync(path, constants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
function validateLock(lock, expected) {
    const errors = [];
    if (lock.plugin_version !== expected.pluginVersion) {
        errors.push(`plugin_version mismatch: locked=${lock.plugin_version}; current=${expected.pluginVersion}`);
    }
    if (resolve(lock.plugin_root) !== resolve(expected.pluginRoot)) {
        errors.push(`plugin_root mismatch: locked=${lock.plugin_root}; current=${expected.pluginRoot}`);
    }
    if (resolve(lock.cli_path) !== resolve(expected.cliPath)) {
        errors.push(`cli_path mismatch: locked=${lock.cli_path}; current=${expected.cliPath}`);
    }
    if (!readable(lock.cli_path)) {
        errors.push(`cli_path is not available: ${lock.cli_path}`);
    }
    if (expected.threadId && lock.thread_id && lock.thread_id !== expected.threadId) {
        errors.push(`thread_id mismatch: locked=${lock.thread_id}; current=${expected.threadId}`);
    }
    return errors;
}
export function ensureSessionLock(options) {
    const path = lockPath(options.root);
    const existing = readLock(path);
    if (existing) {
        const errors = validateLock(existing, options);
        return { path, ok: errors.length === 0, created: false, lock: existing, errors };
    }
    const lock = {
        schema_version: 1,
        plugin_version: options.pluginVersion,
        plugin_root: resolve(options.pluginRoot),
        cli_path: resolve(options.cliPath),
        thread_id: options.threadId ?? null,
        created_at: new Date().toISOString(),
    };
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
    return { path, ok: true, created: true, lock, errors: [] };
}
