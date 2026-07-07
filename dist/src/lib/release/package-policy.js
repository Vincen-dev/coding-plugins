export const PACKAGE_REQUIRED_RUNTIME_FILES = [
    "package.json",
    "bin/coding-plugins.js",
    "dist/index.js",
    "dist/index.d.ts",
    "dist/src/cli/start.js",
    "dist/src/cli/workflow/start.js",
    "dist/src/cli/doctor.js",
    "dist/src/cli/documents/doctor.js",
    "dist/src/cli/preflight.js",
    "dist/src/cli/prepare-release.js",
    "dist/src/cli/bump-version.js",
    "dist/src/cli/release/preflight.js",
    "dist/src/cli/release/prepare-release.js",
    "dist/src/cli/release/bump-version.js",
    "dist/skills/using-coding-plugins/scripts/workflow-mode.js",
];
export const PACKAGE_REQUIRED_USER_DOCS = [
    "README.md",
    "INSTALL.md",
    "SECURITY.md",
    "LICENSE",
    "RELEASE-NOTES.md",
];
export const PACKAGE_REQUIRED_PLATFORM_FILES = [
    "skills/",
    "hooks/",
    "assets/",
    ".codex-plugin/",
    ".claude-plugin/",
    ".opencode/",
    ".agents/skills",
    "plugin.json",
    "gemini-extension.json",
    "GEMINI.md",
];
const PY_EXTENSION = "." + "py";
export const PACKAGE_ALLOWED_FILE_ENTRIES = [
    "bin/",
    "dist/",
    ...PACKAGE_REQUIRED_PLATFORM_FILES,
    ...PACKAGE_REQUIRED_USER_DOCS,
    "!skills/**/scripts/fixtures/",
    "!skills/**/scripts/fixtures/**",
    "!**/__pycache__/",
    `!**/*${PY_EXTENSION}`,
    `!**/*${PY_EXTENSION}c`,
];
export const PACKAGE_DISALLOWED_BROAD_ENTRIES = ["src/", "docs/", "tests/"];
export function requiredPackageFileEntries() {
    return new Set(PACKAGE_ALLOWED_FILE_ENTRIES);
}
export function auditPackageManifestEntries(entries) {
    const entrySet = new Set(entries);
    const issues = [];
    for (const entry of PACKAGE_DISALLOWED_BROAD_ENTRIES) {
        if (entrySet.has(entry)) {
            issues.push({ kind: "denied_dev_content", path: entry });
        }
    }
    for (const required of PACKAGE_ALLOWED_FILE_ENTRIES) {
        if (!entrySet.has(required)) {
            issues.push({
                kind: PACKAGE_REQUIRED_USER_DOCS.includes(required)
                    ? "missing_user_doc"
                    : "missing_required_runtime",
                path: required,
            });
        }
    }
    return issues;
}
export function isDeniedPackagePath(path) {
    return (path.startsWith("docs/coding-plugins/features/") ||
        path.startsWith("tests/") ||
        path.startsWith("fixtures/") ||
        path.includes("/fixtures/") ||
        path.startsWith("tmp/") ||
        path.startsWith("temp/") ||
        path === "todo.md" ||
        path.includes("__pycache__/") ||
        path.endsWith(".pyc") ||
        /(^|\/)\.env(\.|$)/.test(path));
}
function isAllowedPackagePath(path) {
    if (PACKAGE_REQUIRED_RUNTIME_FILES.includes(path)) {
        return true;
    }
    return PACKAGE_ALLOWED_FILE_ENTRIES.some((entry) => {
        if (entry.startsWith("!")) {
            return false;
        }
        return entry.endsWith("/") ? path.startsWith(entry) : path === entry;
    });
}
export function auditPackedFilePaths(paths) {
    const fileSet = new Set(paths);
    const issues = [];
    for (const path of paths) {
        if (isDeniedPackagePath(path)) {
            issues.push({ kind: /(^|\/)\.env(\.|$)/.test(path) ? "env_file" : "denied_dev_content", path });
            continue;
        }
        if (!isAllowedPackagePath(path)) {
            issues.push({ kind: "not_allowed", path });
        }
    }
    for (const required of PACKAGE_REQUIRED_RUNTIME_FILES) {
        if (!fileSet.has(required)) {
            issues.push({ kind: "missing_required_runtime", path: required });
        }
    }
    for (const required of PACKAGE_REQUIRED_USER_DOCS) {
        if (!fileSet.has(required)) {
            issues.push({ kind: "missing_user_doc", path: required });
        }
    }
    return issues;
}
