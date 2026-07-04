import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
export const FEATURE_README_METADATA_REQUIRED_FIELDS = ["title", "status", "feature", "updated"];
export const EVIDENCE_METADATA_REQUIRED_FIELDS = ["title", "status", "feature", "created", "updated"];
export const ARCHIVED_EVIDENCE_METADATA_REQUIRED_FIELDS = [
    "title",
    "status",
    "feature",
    "created",
    "updated",
    "validation_mode",
    "archive_of",
    "archived_at",
];
export const PLAN_METADATA_REQUIRED_FIELDS = ["title", "status", "feature", "created", "updated"];
export const RELATED_DOCS_KEY = "related_docs";
export const DOCUMENT_ARTIFACTS = [
    { label: "PRD", suffix: "PRD", directory: "requirements", relationKey: RELATED_DOCS_KEY, docIdRequired: true, syncUpstream: [] },
    { label: "TSD", suffix: "TSD", directory: "technicals", relationKey: RELATED_DOCS_KEY, docIdRequired: true, syncUpstream: ["PRD"] },
    { label: "TVD", suffix: "TVD", directory: "test-cases", relationKey: RELATED_DOCS_KEY, docIdRequired: true, syncUpstream: ["PRD", "TSD"] },
    { label: "TED", suffix: "TED", directory: "plans", relationKey: RELATED_DOCS_KEY, docIdRequired: true, syncUpstream: ["PRD", "TSD", "TVD"] },
    { label: "VED", suffix: "VED", directory: "evidences", relationKey: RELATED_DOCS_KEY, docIdRequired: true, syncUpstream: ["PRD", "TSD", "TVD", "TED"] },
];
const ARTIFACTS_BY_SUFFIX = new Map(DOCUMENT_ARTIFACTS.map((artifact) => [artifact.suffix, artifact]));
export const ARTIFACT_SUFFIXES = DOCUMENT_ARTIFACTS.map((artifact) => artifact.suffix);
export const RELATION_KEYS = [...new Set(DOCUMENT_ARTIFACTS.map((artifact) => artifact.relationKey))];
export const DOCUMENT_SYNC_DEPENDENCIES = Object.fromEntries(DOCUMENT_ARTIFACTS.filter((artifact) => artifact.syncUpstream.length > 0).map((artifact) => [artifact.suffix, artifact.syncUpstream]));
export function splitFrontmatter(text) {
    if (!text.startsWith("---\n")) {
        return [[], text];
    }
    const end = text.indexOf("\n---", 4);
    if (end === -1) {
        return [[], text];
    }
    return [text.slice(4, end).split(/\r?\n/), text.slice(end + "\n---".length).replace(/^\n/, "")];
}
export function parseFrontmatterBlock(lines) {
    const scalars = {};
    const lists = {};
    const order = [];
    let currentKey;
    for (const line of lines) {
        const stripped = line.trim();
        if (!stripped) {
            continue;
        }
        if (line.startsWith(" ") && currentKey && stripped.startsWith("- ")) {
            lists[currentKey] ??= [];
            lists[currentKey].push(stripped.slice(2).trim().replace(/^["']|["']$/g, ""));
            continue;
        }
        if (!line.includes(":") || line.startsWith(" ")) {
            continue;
        }
        const index = line.indexOf(":");
        currentKey = line.slice(0, index).trim();
        if (!order.includes(currentKey)) {
            order.push(currentKey);
        }
        const rawValue = line.slice(index + 1).trim();
        const value = rawValue.replace(/^["']|["']$/g, "");
        if (rawValue === "[]") {
            lists[currentKey] ??= [];
        }
        else if (value) {
            scalars[currentKey] = value;
        }
        else {
            lists[currentKey] ??= [];
        }
    }
    return { scalars, lists, order };
}
export function renderFrontmatterBlock(frontmatter) {
    const keys = [...frontmatter.order];
    for (const key of [...Object.keys(frontmatter.scalars), ...Object.keys(frontmatter.lists)]) {
        if (!keys.includes(key)) {
            keys.push(key);
        }
    }
    const lines = ["---"];
    for (const key of keys) {
        if (key in frontmatter.lists) {
            const values = frontmatter.lists[key];
            if (values.length > 0) {
                lines.push(`${key}:`);
                lines.push(...values.map((value) => `  - ${value}`));
            }
            else {
                lines.push(`${key}: []`);
            }
        }
        else if (key in frontmatter.scalars) {
            lines.push(`${key}: ${frontmatter.scalars[key]}`);
        }
    }
    lines.push("---");
    return `${lines.join("\n")}\n`;
}
export function parseFrontmatter(text) {
    const [lines] = splitFrontmatter(text);
    if (lines.length === 0) {
        return {};
    }
    return { ...parseFrontmatterBlock(lines).scalars };
}
export function frontmatterListValues(text, key) {
    const [lines] = splitFrontmatter(text);
    if (lines.length === 0) {
        return [];
    }
    return [...(parseFrontmatterBlock(lines).lists[key] ?? [])];
}
export function featureDocsRoot(root) {
    return join(root, "docs/coding-plugins/features");
}
export function collectFeatureRoots(root) {
    const featuresRoot = featureDocsRoot(root);
    if (!existsSync(featuresRoot)) {
        return [];
    }
    return readdirSync(featuresRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(featuresRoot, entry.name))
        .sort();
}
export function featureRootForDocument(root, path) {
    const featuresRoot = featureDocsRoot(root);
    const rel = relative(featuresRoot, path);
    if (rel.startsWith("..") || rel === "") {
        return undefined;
    }
    const [feature] = rel.split(/[\\/]/);
    if (!feature) {
        return undefined;
    }
    return [feature, join(featuresRoot, feature)];
}
export function artifactForSuffix(suffix) {
    const artifact = ARTIFACTS_BY_SUFFIX.get(suffix);
    if (!artifact) {
        throw new Error(`Unknown document artifact suffix: ${suffix}`);
    }
    return artifact;
}
export function artifactDirectories() {
    return [...new Set(DOCUMENT_ARTIFACTS.map((artifact) => artifact.directory))];
}
export function filenamePatternsByDirectory() {
    const suffixesByDirectory = {};
    for (const artifact of DOCUMENT_ARTIFACTS) {
        suffixesByDirectory[artifact.directory] ??= [];
        suffixesByDirectory[artifact.directory].push(artifact.suffix);
    }
    return Object.fromEntries(Object.entries(suffixesByDirectory).map(([directoryName, suffixes]) => [
        directoryName,
        new RegExp(`^[A-Za-z0-9_.-]+-(?:${suffixes.map(escapeRegExp).join("|")})\\.md$`),
    ]));
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function documentDocId(path) {
    const stem = basename(path).replace(/\.[^.]+$/, "");
    for (const suffix of ARTIFACT_SUFFIXES) {
        const marker = `-${suffix}`;
        if (stem.endsWith(marker)) {
            return stem.slice(0, -marker.length);
        }
    }
    return stem;
}
export function documentSuffix(path) {
    const stem = basename(path).replace(/\.[^.]+$/, "");
    return ARTIFACT_SUFFIXES.find((suffix) => stem.endsWith(`-${suffix}`));
}
export function featureArtifactFile(featureRoot, directoryName, suffix, docId) {
    return join(featureRoot, directoryName, `${docId ?? basename(featureRoot)}-${suffix}.md`);
}
export function artifactFile(featureRoot, suffix, docId) {
    const artifact = artifactForSuffix(suffix);
    return featureArtifactFile(featureRoot, artifact.directory, artifact.suffix, docId);
}
export function featureArtifactFiles(featureRoot, directoryName, suffix) {
    const artifactDir = join(featureRoot, directoryName);
    if (!existsSync(artifactDir)) {
        return [];
    }
    return readdirSync(artifactDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(`-${suffix}.md`))
        .map((entry) => join(artifactDir, entry.name))
        .sort();
}
export function artifactFiles(featureRoot, suffix) {
    const artifact = artifactForSuffix(suffix);
    return featureArtifactFiles(featureRoot, artifact.directory, artifact.suffix);
}
export function featureArtifactFilesForDocId(featureRoot, directoryName, suffix, docId) {
    const path = featureArtifactFile(featureRoot, directoryName, suffix, docId);
    return existsSync(path) ? [path] : [];
}
export function artifactFilesForDocId(featureRoot, suffix, docId) {
    const artifact = artifactForSuffix(suffix);
    return featureArtifactFilesForDocId(featureRoot, artifact.directory, artifact.suffix, docId);
}
export function featureDocIds(featureRoot) {
    const docIds = new Set();
    for (const artifact of DOCUMENT_ARTIFACTS) {
        for (const path of artifactFiles(featureRoot, artifact.suffix)) {
            docIds.add(documentDocId(path));
        }
    }
    return [...docIds].sort();
}
export function documentsBySuffixForDocId(featureRoot, docId) {
    return Object.fromEntries(DOCUMENT_ARTIFACTS.map((artifact) => [artifact.suffix, artifactFilesForDocId(featureRoot, artifact.suffix, docId)]));
}
export function expectedRelatedPathsForDocId(featureRoot, docId, sourcePath) {
    const source = sourcePath ? resolve(sourcePath) : undefined;
    const expected = Object.fromEntries(RELATION_KEYS.map((key) => [key, []]));
    for (const artifact of DOCUMENT_ARTIFACTS) {
        for (const path of artifactFilesForDocId(featureRoot, artifact.suffix, docId)) {
            if (source && resolve(path) === source) {
                continue;
            }
            expected[artifact.relationKey].push(path);
        }
    }
    for (const key of Object.keys(expected)) {
        expected[key].sort();
    }
    return expected;
}
export function featureName(featureRoot) {
    return basename(featureRoot);
}
export function parentDir(path) {
    return dirname(path);
}
