export declare const ARTIFACT_MODE_FILE = ".coding-plugins-artifacts.json";
export declare const DOCS_CODING_PLUGINS_DIR = "docs/coding-plugins";
export type ArtifactModeValue = "tracked" | "local" | "external";
export interface ArtifactModeStatus {
    mode: ArtifactModeValue;
    source: "config" | "inferred";
    root: string;
    docs_root: string;
    config_path: string;
    docs_ignored: boolean;
    formal_evidence_allowed: boolean;
    external_reference: string | null;
    errors: string[];
    warnings: string[];
}
export declare function isPathIgnoredByGitignore(root: string, path: string): boolean;
export declare function resolveArtifactMode(root: string): ArtifactModeStatus;
