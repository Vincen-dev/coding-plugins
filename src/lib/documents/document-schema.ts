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
  spec_ids: string[];
  test_ids: string[];
  task_ids: string[];
  errors: string[];
}

export interface DocumentValidationResult {
  ok: boolean;
  root: string;
  documents: ParsedDocument[];
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
  errors: string[];
}

const REQUIRED_FRONTMATTER = ["title", "status", "feature", "doc_id"];
const REQUIRED_ARTIFACTS = ["PRD", "TSD", "TVD", "TED", "VED"];

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

export function parseWorkflowDocument(root: string, path: string): ParsedDocument | null {
  const suffix = documentSuffix(path);
  if (!suffix || !ARTIFACT_SUFFIXES.includes(suffix)) {
    return null;
  }
  const text = readFileSync(path, "utf8");
  const [, body] = splitFrontmatter(text);
  const frontmatter = parseDocumentFrontmatter(text);
  const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim());
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

  return {
    path: relative(root, path).replaceAll("\\", "/"),
    kind: suffix,
    feature: frontmatter.feature ?? "",
    doc_id: frontmatter.doc_id ?? documentDocId(path),
    status: frontmatter.status ?? "",
    frontmatter,
    headings,
    spec_ids: uniqueMatches(body, /\bREQ-\d{3,}\b/g),
    test_ids: uniqueMatches(body, /\bTC-\d{3,}\b/g),
    task_ids: uniqueMatches(body, /\bTASK-\d{3,}\b/g),
    errors,
  };
}

export function validateDocumentSchemas(root: string): DocumentValidationResult {
  const files = collectFeatureRoots(root).flatMap((featureRoot) =>
    DOCUMENT_ARTIFACTS.flatMap((artifact) => collectMarkdownFiles(join(featureRoot, artifact.directory))),
  );
  const documents = files
    .map((path) => parseWorkflowDocument(root, path))
    .filter((document): document is ParsedDocument => document !== null);
  const chains = validateDocumentChains(root, documents);
  const chainErrors = chains.flatMap((chain) => chain.errors);
  const errors = [...documents.flatMap((document) => document.errors), ...chainErrors];
  return { ok: errors.length === 0, root, documents, chains, chain_errors: chainErrors, errors };
}

export function validateDocumentChains(root: string, documents: ParsedDocument[]): ParsedDocumentChain[] {
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
    if (missingArtifacts.length > 0) {
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
