export declare const SESSION_LOCK_FILE = ".coding-plugins/session-lock.json";
export interface SessionLock {
    schema_version: 1;
    plugin_version: string;
    plugin_root: string;
    cli_path: string;
    thread_id: string | null;
    created_at: string;
}
export interface SessionLockStatus {
    path: string;
    ok: boolean;
    created: boolean;
    lock: SessionLock;
    errors: string[];
}
export declare function readPluginVersion(pluginRoot: string): string;
export declare function defaultThreadId(): string | null;
export declare function ensureSessionLock(options: {
    root: string;
    pluginVersion: string;
    pluginRoot: string;
    cliPath: string;
    threadId?: string | null;
}): SessionLockStatus;
