export declare const PACKAGE_REQUIRED_RUNTIME_FILES: readonly ["package.json", "bin/coding-plugins.js", "dist/index.js", "dist/index.d.ts", "dist/src/cli/start.js", "dist/src/cli/workflow/start.js", "dist/src/cli/doctor.js", "dist/src/cli/documents/doctor.js", "dist/src/cli/preflight.js", "dist/src/cli/prepare-release.js", "dist/src/cli/bump-version.js", "dist/src/cli/release/preflight.js", "dist/src/cli/release/prepare-release.js", "dist/src/cli/release/bump-version.js", "dist/skills/using-coding-plugins/scripts/workflow-mode.js"];
export declare const PACKAGE_REQUIRED_USER_DOCS: readonly ["README.md", "INSTALL.md", "SECURITY.md", "LICENSE", "RELEASE-NOTES.md"];
export declare const PACKAGE_REQUIRED_PLATFORM_FILES: readonly ["skills/", "hooks/", "assets/", ".codex-plugin/", ".claude-plugin/", ".opencode/", ".agents/skills", "plugin.json", "gemini-extension.json", "GEMINI.md"];
export declare const PACKAGE_ALLOWED_FILE_ENTRIES: readonly string[];
export declare const PACKAGE_DISALLOWED_BROAD_ENTRIES: readonly ["src/", "docs/", "tests/"];
export type PackagePolicyIssueKind = "not_allowed" | "denied_dev_content" | "missing_required_runtime" | "missing_user_doc" | "env_file";
export interface PackagePolicyIssue {
    kind: PackagePolicyIssueKind;
    path: string;
}
export declare function requiredPackageFileEntries(): Set<string>;
export declare function auditPackageManifestEntries(entries: string[]): PackagePolicyIssue[];
export declare function isDeniedPackagePath(path: string): boolean;
export declare function auditPackedFilePaths(paths: string[]): PackagePolicyIssue[];
