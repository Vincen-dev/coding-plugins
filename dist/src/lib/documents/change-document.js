import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
const REQUIRED_CHANGE_SECTIONS = ["Intent", "Acceptance", "Scope", "Tasks", "Decisions", "Evidence", "Completion"];
const ACTIVE_CHANGE_MARKER = "coding-plugins-active-change";
export function selectArtifactProfile(options) {
    if (options.flow === "inspect") {
        return "none";
    }
    if (options.flow === "governed-change") {
        return "governed";
    }
    return options.multiTurn ? "standard" : "quick";
}
function encodeRecord(record) {
    return Buffer.from(JSON.stringify(record), "utf8").toString("base64url");
}
export function parseStandardChangeDocument(text) {
    const match = new RegExp(`<!--\\s*${ACTIVE_CHANGE_MARKER}:([A-Za-z0-9_-]+)\\s*-->`).exec(text);
    if (!match) {
        return null;
    }
    try {
        return JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    }
    catch {
        return null;
    }
}
export function renderStandardChangeDocument(record) {
    return [
        "---",
        `title: ${record.id} Standard Change`,
        "status: active",
        `change_id: ${record.id}`,
        `flow: ${record.flow}`,
        `updated: ${record.updatedAt.slice(0, 10)}`,
        "---",
        "",
        `# ${record.id}`,
        "",
        `<!-- ${ACTIVE_CHANGE_MARKER}:${encodeRecord(record)} -->`,
        "",
        "## Intent",
        "",
        record.scope.summary,
        "",
        "## Acceptance",
        "",
        "Acceptance criteria are maintained as task-scoped checks for this Standard Change.",
        "",
        "## Scope",
        "",
        `- Planned files: ${(record.scope.plannedFiles ?? []).join(", ") || "not fixed"}`,
        `- Spec IDs: ${(record.scope.specIds ?? []).join(", ") || "not applicable"}`,
        "",
        "## Tasks",
        "",
        `- Current task: ${record.currentTaskId ?? "not selected"}`,
        "",
        "## Decisions",
        "",
        "- Use the Standard Change path; upgrade to Governed Change when high-risk scope appears.",
        "",
        "## Evidence",
        "",
        "- Record focused test and verification commands as tasks complete.",
        "",
        "## Completion",
        "",
        `- Workflow state: ${record.state}`,
        "",
    ].join("\n");
}
export function validateStandardChangeDocument(text) {
    const errors = [];
    if (!parseStandardChangeDocument(text)) {
        errors.push("active change metadata is missing or invalid");
    }
    for (const section of REQUIRED_CHANGE_SECTIONS) {
        if (!new RegExp(`^## ${section}$`, "m").test(text)) {
            errors.push(`missing section: ${section}`);
        }
    }
    return errors;
}
export function standardChangeDocumentPath(root, changeId) {
    return join(root, "docs/coding-plugins/changes", changeId, "change.md");
}
export function writeStandardChangeDocument(root, record) {
    const path = standardChangeDocumentPath(root, record.id);
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.tmp`;
    writeFileSync(temporary, renderStandardChangeDocument({
        ...record,
        artifactRef: relative(root, path).replaceAll("\\", "/"),
    }), "utf8");
    renameSync(temporary, path);
    return path;
}
export function readStandardChangeDocument(path) {
    return parseStandardChangeDocument(readFileSync(path, "utf8"));
}
