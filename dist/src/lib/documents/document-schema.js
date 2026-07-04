import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { ARTIFACT_SUFFIXES, DOCUMENT_ARTIFACTS, collectFeatureRoots, documentDocId, documentSuffix, parseFrontmatter as parseDocumentFrontmatter, splitFrontmatter, } from "./document-metadata.js";
import { computeUpstreamHash } from "../workflow/workflow-state.js";
const REQUIRED_FRONTMATTER = ["title", "status", "feature", "doc_id"];
const REQUIRED_ARTIFACTS = ["PRD", "TSD", "TVD", "TED", "VED"];
const REQUIRED_SECTIONS = {
    PRD: ["需求总览", "追踪矩阵"],
    TSD: ["规格到设计映射", "测试策略"],
    TVD: ["测试用例总览"],
    TED: ["执行锁定区", "执行简报", "任务总览"],
    VED: ["TDD 证据"],
};
function collectMarkdownFiles(directory) {
    if (!existsSync(directory)) {
        return [];
    }
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectMarkdownFiles(path));
        }
        else if (entry.isFile() && entry.name.endsWith(".md")) {
            files.push(path);
        }
    }
    return files.sort();
}
function uniqueMatches(text, pattern) {
    return [...new Set([...text.matchAll(pattern)].map((match) => match[0]))].sort();
}
function parseMarkdownSections(body) {
    const matches = [...body.matchAll(/^(?<marker>#{1,6})\s+(?<title>.+)$/gm)];
    const sections = {};
    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const title = match.groups?.title.trim() ?? "";
        const start = (match.index ?? 0) + match[0].length;
        const end = matches[index + 1]?.index ?? body.length;
        sections[title] = body.slice(start, end).trim();
    }
    return sections;
}
function hasSection(sections, required) {
    return Object.keys(sections).some((heading) => heading.includes(required));
}
function missingRequiredSections(kind, sections) {
    const required = REQUIRED_SECTIONS[kind] ?? [];
    if (kind !== "VED") {
        return required.filter((section) => !hasSection(sections, section));
    }
    return required.filter((section) => !Object.keys(sections).some((heading) => /TDD\s*证据|验证证据|最终验证/.test(heading) || heading.includes(section)));
}
export function parseWorkflowDocument(root, path) {
    const suffix = documentSuffix(path);
    if (!suffix || !ARTIFACT_SUFFIXES.includes(suffix)) {
        return null;
    }
    const text = readFileSync(path, "utf8");
    const [, body] = splitFrontmatter(text);
    const frontmatter = parseDocumentFrontmatter(text);
    const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim());
    const sections = parseMarkdownSections(body);
    const errors = [];
    for (const field of REQUIRED_FRONTMATTER) {
        if (!frontmatter[field]) {
            errors.push(`${relative(root, path)} missing frontmatter field: ${field}`);
        }
    }
    if (frontmatter.doc_id && frontmatter.doc_id !== documentDocId(path)) {
        errors.push(`${relative(root, path)} doc_id does not match filename`);
    }
    if (headings.length === 0) {
        errors.push(`${relative(root, path)} has no markdown headings`);
    }
    const relativePath = relative(root, path).replaceAll("\\", "/");
    const missingSections = missingRequiredSections(suffix, sections);
    if (missingSections.length > 0) {
        errors.push(`${relativePath} ${suffix} is missing required sections: ${missingSections.join(", ")}`);
    }
    if (suffix === "PRD" && uniqueMatches(body, /\bREQ-\d{3,}\b/g).length === 0) {
        errors.push(`${relativePath} PRD must declare at least one REQ id`);
    }
    if (suffix === "TSD" && uniqueMatches(body, /\bREQ-\d{3,}\b/g).length === 0) {
        errors.push(`${relativePath} TSD must map at least one REQ id to technical design`);
    }
    if (suffix === "TVD") {
        if (uniqueMatches(body, /\bTC-\d{3,}\b/g).length === 0) {
            errors.push(`${relativePath} TVD must declare at least one TC id`);
        }
        if (uniqueMatches(body, /\bREQ-\d{3,}\b/g).length === 0) {
            errors.push(`${relativePath} TVD must map test cases to at least one REQ id`);
        }
    }
    if (suffix === "TED") {
        if (uniqueMatches(body, /\bTASK-\d{3,}\b/g).length === 0) {
            errors.push(`${relativePath} TED must declare at least one TASK id`);
        }
        if (uniqueMatches(body, /\bREQ-\d{3,}\b/g).length === 0) {
            errors.push(`${relativePath} TED must map tasks to at least one REQ id`);
        }
        if (!headings.some((value) => value.includes("执行锁定区"))) {
            errors.push(`${relativePath} TED execution lock section is missing`);
        }
    }
    if (suffix === "VED") {
        const hasEvidence = headings.some((value) => /TDD\s*证据|验证证据|最终验证/.test(value)) || /最终验证|RED 命令|GREEN 命令/.test(body);
        if (!hasEvidence) {
            errors.push(`${relativePath} VED must include TDD evidence or validation evidence`);
        }
    }
    return {
        path: relativePath,
        kind: suffix,
        feature: frontmatter.feature ?? "",
        doc_id: frontmatter.doc_id ?? documentDocId(path),
        status: frontmatter.status ?? "",
        frontmatter,
        headings,
        sections,
        spec_ids: uniqueMatches(body, /\bREQ-\d{3,}\b/g),
        test_ids: uniqueMatches(body, /\bTC-\d{3,}\b/g),
        task_ids: uniqueMatches(body, /\bTASK-\d{3,}\b/g),
        errors,
    };
}
export function validateDocumentSchemas(root) {
    const files = collectFeatureRoots(root).flatMap((featureRoot) => DOCUMENT_ARTIFACTS.flatMap((artifact) => collectMarkdownFiles(join(featureRoot, artifact.directory))));
    const documents = files
        .map((path) => parseWorkflowDocument(root, path))
        .filter((document) => document !== null);
    const chains = validateDocumentChains(root, documents);
    const chainErrors = chains.flatMap((chain) => chain.errors);
    const errors = [...documents.flatMap((document) => document.errors), ...chainErrors];
    return { ok: errors.length === 0, root, documents, chains, chain_errors: chainErrors, errors };
}
export function validateDocumentChains(root, documents) {
    const groups = new Map();
    for (const document of documents) {
        if (!document.feature || !document.doc_id) {
            continue;
        }
        const key = `${document.feature}\0${document.doc_id}`;
        groups.set(key, [...(groups.get(key) ?? []), document]);
    }
    return [...groups.values()].map((group) => {
        const first = group[0];
        const artifacts = Object.fromEntries(REQUIRED_ARTIFACTS.map((suffix) => [suffix, null]));
        const errors = [];
        for (const document of group) {
            if (artifacts[document.kind]) {
                errors.push(`${document.feature}/${document.doc_id} duplicate artifact: ${document.kind}`);
            }
            artifacts[document.kind] = document.path;
        }
        const missingArtifacts = REQUIRED_ARTIFACTS.filter((suffix) => !artifacts[suffix]);
        const standaloneEvidenceOnly = group.every((document) => document.kind === "VED");
        if (missingArtifacts.length > 0 && !standaloneEvidenceOnly) {
            errors.push(`${first.feature}/${first.doc_id} missing artifacts: ${missingArtifacts.join(", ")}`);
        }
        const ted = group.find((document) => document.kind === "TED");
        if (ted && !missingArtifacts.some((suffix) => ["PRD", "TSD", "TVD"].includes(suffix))) {
            const expectedHash = computeUpstreamHash(root, { feature: first.feature, docId: first.doc_id });
            const sourceHash = ted.frontmatter.source_hash;
            if (!sourceHash) {
                errors.push(`${first.feature}/${first.doc_id} TED source_hash is missing`);
            }
            else if (expectedHash && sourceHash !== expectedHash) {
                errors.push(`${first.feature}/${first.doc_id} TED source_hash is stale`);
            }
        }
        const prd = group.find((document) => document.kind === "PRD");
        const prdSpecIds = new Set(prd?.spec_ids ?? []);
        if (prdSpecIds.size > 0) {
            for (const suffix of ["TSD", "TVD", "TED", "VED"]) {
                const document = group.find((item) => item.kind === suffix);
                if (!document) {
                    continue;
                }
                const documentSpecIds = new Set(document.spec_ids);
                const missingSpecIds = [...prdSpecIds].filter((specId) => !documentSpecIds.has(specId));
                if (missingSpecIds.length > 0) {
                    errors.push(`${document.feature}/${document.doc_id} ${suffix} missing PRD spec coverage: ${missingSpecIds.join(", ")}`);
                }
            }
        }
        return {
            feature: first.feature,
            doc_id: first.doc_id,
            ok: errors.length === 0,
            artifacts,
            missing_artifacts: missingArtifacts,
            errors,
        };
    });
}
