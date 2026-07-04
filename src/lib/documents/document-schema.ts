import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import {
  ARTIFACT_SUFFIXES,
  DOCUMENT_ARTIFACTS,
  collectFeatureRoots,
  documentDocId,
  documentSuffix,
  parseFrontmatter as parseDocumentFrontmatter,
  splitFrontmatter,
} from "./document-metadata.ts";
import { computeUpstreamHash } from "../workflow/workflow-state.ts";

export interface ParsedDocument {
  path: string;
  kind: string;
  feature: string;
  doc_id: string;
  status: string;
  frontmatter: Record<string, string>;
  headings: string[];
  sections: Record<string, string>;
  spec_ids: string[];
  test_ids: string[];
  task_ids: string[];
  errors: string[];
}

export type ParsedDocumentSummary = Omit<ParsedDocument, "sections"> & {
  section_names: string[];
  section_hashes: Record<string, string>;
};

export interface DocumentValidationResult<TDocument extends ParsedDocument | ParsedDocumentSummary = ParsedDocumentSummary> {
  ok: boolean;
  root: string;
  documents: TDocument[];
  chains: ParsedDocumentChain[];
  chain_errors: string[];
  errors: string[];
}

export interface ParsedDocumentChain {
  feature: string;
  doc_id: string;
  ok: boolean;
  artifacts: Record<string, string | null>;
  missing_artifacts: string[];
  chain_type: "complete" | "incomplete" | "evidence-only";
  errors: string[];
}

export interface DocumentValidationOptions {
  includeSections?: boolean;
  allowEvidenceOnly?: boolean;
}

const REQUIRED_FRONTMATTER = ["title", "status", "feature", "doc_id"];
const REQUIRED_ARTIFACTS = ["PRD", "TSD", "TVD", "TED", "VED"];
const REQUIRED_SECTIONS: Record<string, string[]> = {
  PRD: ["需求总览", "追踪矩阵"],
  TSD: ["规格到设计映射", "测试策略"],
  TVD: ["测试用例总览"],
  TED: ["执行锁定区", "执行简报", "任务总览"],
  VED: ["TDD 证据"],
};

function collectMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files.sort();
}

function uniqueMatches(text: string, pattern: RegExp): string[] {
  return [...new Set([...text.matchAll(pattern)].map((match) => match[0]))].sort();
}

function parseMarkdownSections(body: string): Record<string, string> {
  const matches = [...body.matchAll(/^(?<marker>#{1,6})\s+(?<title>.+)$/gm)];
  const sections: Record<string, string> = {};
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const title = match.groups?.title.trim() ?? "";
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    sections[title] = body.slice(start, end).trim();
  }
  return sections;
}

function hasSection(sections: Record<string, string>, required: string): boolean {
  return Object.keys(sections).some((heading) => heading.includes(required));
}

function missingRequiredSections(kind: string, sections: Record<string, string>): string[] {
  const required = REQUIRED_SECTIONS[kind] ?? [];
  if (kind !== "VED") {
    return required.filter((section) => !hasSection(sections, section));
  }
  return required.filter((section) => !Object.keys(sections).some((heading) => /TDD\s*证据|验证证据|最终验证/.test(heading) || heading.includes(section)));
}

export function parseWorkflowDocument(root: string, path: string): ParsedDocument | null {
  const suffix = documentSuffix(path);
  if (!suffix || !ARTIFACT_SUFFIXES.includes(suffix)) {
    return null;
  }
  const text = readFileSync(path, "utf8");
  const [, body] = splitFrontmatter(text);
  const frontmatter = parseDocumentFrontmatter(text);
  const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim());
  const sections = parseMarkdownSections(body);
  const errors: string[] = [];
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

function summarizeDocument(document: ParsedDocument): ParsedDocumentSummary {
  const { sections, ...rest } = document;
  return {
    ...rest,
    section_names: Object.keys(sections),
    section_hashes: Object.fromEntries(
      Object.entries(sections).map(([name, body]) => [name, `sha256:${createHash("sha256").update(body, "utf8").digest("hex")}`]),
    ),
  };
}

export function validateDocumentSchemas(root: string, options: DocumentValidationOptions & { includeSections: true }): DocumentValidationResult<ParsedDocument>;
export function validateDocumentSchemas(root: string, options?: DocumentValidationOptions & { includeSections?: false }): DocumentValidationResult<ParsedDocumentSummary>;
export function validateDocumentSchemas(root: string, options: DocumentValidationOptions): DocumentValidationResult<ParsedDocument | ParsedDocumentSummary>;
export function validateDocumentSchemas(root: string, options: DocumentValidationOptions = {}): DocumentValidationResult<ParsedDocument | ParsedDocumentSummary> {
  const files = collectFeatureRoots(root).flatMap((featureRoot) =>
    DOCUMENT_ARTIFACTS.flatMap((artifact) => collectMarkdownFiles(join(featureRoot, artifact.directory))),
  );
  const parsedDocuments = files
    .map((path) => parseWorkflowDocument(root, path))
    .filter((document): document is ParsedDocument => document !== null);
  const chains = validateDocumentChains(root, parsedDocuments, options);
  const chainErrors = chains.flatMap((chain) => chain.errors);
  const errors = [...parsedDocuments.flatMap((document) => document.errors), ...chainErrors];
  const documents = options.includeSections === true ? parsedDocuments : parsedDocuments.map(summarizeDocument);
  return { ok: errors.length === 0, root, documents, chains, chain_errors: chainErrors, errors };
}

export function validateDocumentChains(root: string, documents: ParsedDocument[], options: Pick<DocumentValidationOptions, "allowEvidenceOnly"> = {}): ParsedDocumentChain[] {
  const groups = new Map<string, ParsedDocument[]>();
  for (const document of documents) {
    if (!document.feature || !document.doc_id) {
      continue;
    }
    const key = `${document.feature}\0${document.doc_id}`;
    groups.set(key, [...(groups.get(key) ?? []), document]);
  }

  return [...groups.values()].map((group) => {
    const first = group[0];
    const artifacts: Record<string, string | null> = Object.fromEntries(REQUIRED_ARTIFACTS.map((suffix) => [suffix, null]));
    const errors: string[] = [];
    for (const document of group) {
      if (artifacts[document.kind]) {
        errors.push(`${document.feature}/${document.doc_id} duplicate artifact: ${document.kind}`);
      }
      artifacts[document.kind] = document.path;
    }
    const missingArtifacts = REQUIRED_ARTIFACTS.filter((suffix) => !artifacts[suffix]);
    const standaloneEvidenceOnly = group.every((document) => document.kind === "VED");
    const chainType = missingArtifacts.length === 0 ? "complete" : standaloneEvidenceOnly ? "evidence-only" : "incomplete";
    if (missingArtifacts.length > 0 && !(standaloneEvidenceOnly && options.allowEvidenceOnly === true)) {
      errors.push(`${first.feature}/${first.doc_id} missing artifacts: ${missingArtifacts.join(", ")}`);
    }

    const ted = group.find((document) => document.kind === "TED");
    if (ted && !missingArtifacts.some((suffix) => ["PRD", "TSD", "TVD"].includes(suffix))) {
      const expectedHash = computeUpstreamHash(root, { feature: first.feature, docId: first.doc_id });
      const sourceHash = ted.frontmatter.source_hash;
      if (!sourceHash) {
        errors.push(`${first.feature}/${first.doc_id} TED source_hash is missing`);
      } else if (expectedHash && sourceHash !== expectedHash) {
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
      chain_type: chainType,
      errors,
    };
  });
}
