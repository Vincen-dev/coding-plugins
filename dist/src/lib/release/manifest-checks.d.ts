export declare class ManifestCheckError extends Error {
    constructor(message: string);
}
type JsonObject = Record<string, unknown>;
export declare function readJson(path: string): JsonObject;
export declare function checkRequiredPluginFiles(root: string): void;
export declare function checkManifestVersions(root: string): void;
export declare function currentManifestVersion(root: string): string;
export declare function checkCodexHookConfigDeclared(root: string): void;
export declare function checkPlatformEntrypoints(root: string): void;
export declare function checkNpmPackageManifest(root: string): void;
export declare function normalizeManifestAssetPath(rawPath: unknown): string | undefined;
export declare function checkManifestAssetPaths(root: string): void;
export declare function checkAllManifests(root: string): void;
export {};
