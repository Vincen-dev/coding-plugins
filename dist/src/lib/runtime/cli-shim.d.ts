import { type SessionLockStatus } from "./session-lock.ts";
export type CliScope = "user" | "project";
export interface CliStatus {
    cli_on_path: boolean;
    path_command: string | null;
    plugin_root: string;
    plugin_version: string;
    current_cli: string;
    fallback_argv: string[];
    fallback_command: string;
    session_lock: SessionLockStatus;
    shim_target: string;
    shim_exists: boolean;
    shim_points_to_current_cli: boolean;
    path_contains_target_dir: boolean;
    recommended_action: "none" | "install-cli-shim-or-use-fallback";
}
export interface CliInstallResult {
    installed: boolean;
    target: string;
    scope: CliScope;
    plugin_root: string;
    current_cli: string;
    path_contains_target_dir: boolean;
}
export interface CliUninstallResult {
    removed: boolean;
    target: string;
    scope: CliScope;
}
export declare function findPluginRoot(start: string): string;
export declare function defaultShimTarget(scope: CliScope, options?: {
    root?: string;
}): string;
export declare function shimContent(options: {
    nodePath: string;
    cliPath: string;
}): string;
export declare function cliStatus(options: {
    pluginRoot: string;
    target?: string;
    scope?: CliScope;
    root?: string;
    threadId?: string | null;
}): CliStatus;
export declare function installCliShim(options: {
    pluginRoot: string;
    target?: string;
    scope?: CliScope;
    root?: string;
    force?: boolean;
}): CliInstallResult;
export declare function uninstallCliShim(options: {
    pluginRoot: string;
    target?: string;
    scope?: CliScope;
    root?: string;
}): CliUninstallResult;
