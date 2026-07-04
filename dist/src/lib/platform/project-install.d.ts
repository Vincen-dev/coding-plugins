export type InstallPlatform = "cursor" | "copilot";
export interface InstallResult {
    platform: InstallPlatform;
    root: string;
    dry_run: boolean;
    overwritten: boolean;
    files: string[];
}
export declare function platformFiles(root: string, platform: InstallPlatform): string[];
export declare function installPlatform(root: string, platform: InstallPlatform, options?: {
    dryRun?: boolean;
    force?: boolean;
}): InstallResult;
