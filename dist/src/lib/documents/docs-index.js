import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { collectFeatureRoots, documentDocId, featureDocIds, featureRootForDocument, frontmatterListValues, parseFrontmatter, artifactFiles, artifactFilesForDocId, } from "./document-metadata.js";
export class DocsIndexError extends Error {
    constructor(message) {
        super(message);
        this.name = "DocsIndexError";
    }
}
export const ARTIFACT_INDEX_REQUIRED_COLUMNS = [
    "Feature",
    "Doc ID",
    "功能根目录",
    "需求文档",
    "技术方案",
    "测试用例",
    "任务执行",
    "证据",
    "标签",
    "更新日期",
];
export function parseMarkdownTableHeaders(text) {
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length - 1; index += 1) {
        const line = lines[index];
        if (!line.trimStart().startsWith("|")) {
            continue;
        }
        const headers = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
        const separator = lines[index + 1].trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
        if (separator.length > 0 && separator.every((cell) => cell.replaceAll(":", "").replaceAll("-", "").trim() === "" && cell.includes("---"))) {
            return headers;
        }
    }
    return [];
}
export function parseChineseDocumentInfo(text) {
    const info = {};
    for (const line of text.split(/\r?\n/)) {
        if (!line.trimStart().startsWith("|")) {
            continue;
        }
        const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
        if (cells.length < 2) {
            continue;
        }
        const [key, value] = cells;
        if (key === "字段" || key === "---" || /^[\-:]+$/.test(key)) {
            continue;
        }
        info[key] = value;
    }
    return info;
}
export function relativeMarkdownPath(root, path) {
    return relative(root, path);
}
export function formatIndexPathCell(root, paths) {
    if (paths.length === 0) {
        return "-";
    }
    return paths.map((path) => `\`${relativeMarkdownPath(root, path)}\``).join("<br>");
}
export function featureSpecFiles(featureRoot) {
    return artifactFiles(featureRoot, "PRD");
}
export function featureSpecFilesForDocId(featureRoot, docId) {
    return artifactFilesForDocId(featureRoot, "PRD", docId);
}
export function featureEvidenceFiles(featureRoot) {
    return artifactFiles(featureRoot, "VED");
}
export function featureEvidenceFilesForDocId(featureRoot, docId) {
    return artifactFilesForDocId(featureRoot, "VED", docId);
}
export function featureArchivedEvidenceFiles(featureRoot) {
    const archiveRoot = join(featureRoot, "evidences/archive");
    if (!existsSync(archiveRoot)) {
        return [];
    }
    const results = [];
    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(path);
            }
            else if (entry.isFile() && entry.name.endsWith(".md")) {
                results.push(path);
            }
        }
    }
    walk(archiveRoot);
    return results.sort();
}
export function featureTechnicalDesignFiles(featureRoot) {
    return artifactFiles(featureRoot, "TSD");
}
export function featureTechnicalDesignFilesForDocId(featureRoot, docId) {
    return artifactFilesForDocId(featureRoot, "TSD", docId);
}
export function featurePlanFiles(featureRoot) {
    return artifactFiles(featureRoot, "TED");
}
export function featurePlanFilesForDocId(featureRoot, docId) {
    return artifactFilesForDocId(featureRoot, "TED", docId);
}
export function featureTestCaseFiles(featureRoot) {
    return artifactFiles(featureRoot, "TVD");
}
export function featureTestCaseFilesForDocId(featureRoot, docId) {
    return artifactFilesForDocId(featureRoot, "TVD", docId);
}
export function featureTags(featureRoot) {
    const readme = join(featureRoot, "README.md");
    if (!existsSync(readme)) {
        return "-";
    }
    const tags = frontmatterListValues(readFileSync(readme, "utf8"), "tags");
    return tags.length > 0 ? tags.join(", ") : "-";
}
export function featureUpdated(featureRoot, docId) {
    let paths = [
        ...featureSpecFiles(featureRoot),
        ...featureTechnicalDesignFiles(featureRoot),
        ...featureTestCaseFiles(featureRoot),
        ...featurePlanFiles(featureRoot),
    ];
    if (docId !== undefined) {
        paths = paths.filter((path) => documentDocId(path) === docId);
    }
    const updatedValues = paths
        .map((path) => parseFrontmatter(readFileSync(path, "utf8")).updated)
        .filter((value) => Boolean(value));
    return updatedValues.length > 0 ? updatedValues.sort().at(-1) ?? "-" : "-";
}
export function renderArtifactIndex(root) {
    const lines = [
        "# Coding Plugins Feature 索引",
        "",
        "本索引用于按 `Feature` 检索 feature-first 文档链路。运行 `npm run preflight -- --write-index` 可根据 feature root 重新生成本文件。",
        "",
        "| Feature | Doc ID | 功能根目录 | 需求文档 | 技术方案 | 测试用例 | 任务执行 | 证据 | 标签 | 更新日期 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ];
    for (const featureRoot of collectFeatureRoots(root)) {
        const featureContext = featureRootForDocument(root, join(featureRoot, "README.md"));
        if (!featureContext) {
            continue;
        }
        const [feature] = featureContext;
        const docIds = featureDocIds(featureRoot);
        const rowDocIds = docIds.length > 0 ? docIds : [feature];
        for (const docId of rowDocIds) {
            lines.push(`| ${[
                feature,
                docId,
                `\`${relativeMarkdownPath(root, featureRoot)}\``,
                formatIndexPathCell(root, featureSpecFilesForDocId(featureRoot, docId)),
                formatIndexPathCell(root, featureTechnicalDesignFilesForDocId(featureRoot, docId)),
                formatIndexPathCell(root, featureTestCaseFilesForDocId(featureRoot, docId)),
                formatIndexPathCell(root, featurePlanFilesForDocId(featureRoot, docId)),
                formatIndexPathCell(root, featureEvidenceFilesForDocId(featureRoot, docId)),
                featureTags(featureRoot),
                featureUpdated(featureRoot, docId),
            ].join(" | ")} |`);
        }
    }
    lines.push("", "规则:", "", "- `Feature` 必须和 `功能根目录` 路径一致。", "- `Doc ID` 来自文件名去掉 `-PRD`、`-TSD`、`-TVD`、`-TED` 或 `-VED` 后的前缀，用于区分同一 feature 下多条文档链路。", "- `功能根目录` 指向 `docs/coding-plugins/features/<feature-name>`。", "- `需求文档` 指向 `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`；没有需求文档时使用 `-`。", "- `技术方案` 指向 `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md`；没有技术方案时使用 `-`。", "- `测试用例` 指向 `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md`；没有测试用例时使用 `-`。", "- `任务执行` 指向 `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md`；没有 TED 任务执行文档时使用 `-`。", "- `证据` 指向 `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md`；没有证据时使用 `-`。", "- `标签` 来自 feature README frontmatter 的 `tags` 列表；日期来自需求文档、技术方案、测试用例或 TED 任务执行文档 frontmatter 的最大 `updated` 值。");
    return `${lines.join("\n")}\n`;
}
export function writeArtifactIndex(root) {
    const indexPath = join(root, "docs/coding-plugins/INDEX.md");
    mkdirSync(dirname(indexPath), { recursive: true });
    writeFileSync(indexPath, renderArtifactIndex(root), "utf8");
}
export function collectIndexDocumentFiles(root) {
    const documents = [];
    for (const featureRoot of collectFeatureRoots(root)) {
        documents.push(...featureSpecFiles(featureRoot));
        documents.push(...featureTechnicalDesignFiles(featureRoot));
        documents.push(...featureTestCaseFiles(featureRoot));
        documents.push(...featurePlanFiles(featureRoot));
        documents.push(...featureEvidenceFiles(featureRoot));
    }
    return documents.sort();
}
export function checkArtifactIndexCoversDocuments(root) {
    const featureRoots = collectFeatureRoots(root);
    const documents = collectIndexDocumentFiles(root);
    if (featureRoots.length === 0 && documents.length === 0) {
        return;
    }
    const indexPath = join(root, "docs/coding-plugins/INDEX.md");
    if (!existsSync(indexPath)) {
        throw new DocsIndexError("Missing artifact index: docs/coding-plugins/INDEX.md.");
    }
    const text = readFileSync(indexPath, "utf8");
    const headers = parseMarkdownTableHeaders(text);
    const missingColumns = ARTIFACT_INDEX_REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
    if (missingColumns.length > 0) {
        throw new DocsIndexError(`Artifact index is missing required columns: ${missingColumns.join(", ")}.`);
    }
    const expectedPaths = [...featureRoots, ...documents].map((path) => relative(root, path));
    const missingPaths = expectedPaths.filter((path) => !text.includes(path));
    if (missingPaths.length > 0) {
        throw new DocsIndexError(`Artifact index is missing document paths: ${missingPaths.join(", ")}.`);
    }
    const expectedText = renderArtifactIndex(root);
    if (text !== expectedText) {
        throw new DocsIndexError("Artifact index does not match generated content. Run `npm run preflight -- --write-index`.");
    }
}
