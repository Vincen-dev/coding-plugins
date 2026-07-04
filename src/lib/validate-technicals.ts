import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import { featureSpecFiles, featureTechnicalDesignFiles } from "./docs-index.ts";
import {
  collectFeatureRoots,
  documentDocId,
  documentSuffix,
  expectedRelatedPathsForDocId,
  featureRootForDocument,
  frontmatterListValues,
  parseFrontmatter,
  parseFrontmatterBlock,
  RELATED_DOCS_KEY,
  splitFrontmatter,
} from "./document-metadata.ts";

const SPEC_ID_RE = /\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}\b/g;
const TD_ID_RE = /\bTD-\d{3,}\b/g;
const TECHNICAL_REQUIRED_SECTION_ALIASES = [
  ["规格到方案映射", "规格到设计映射"],
  ["无需技术方案的规格", "无需技术设计的规格"],
];
const TECHNICAL_MAPPING_HEADERS = ["规格 ID", "规格摘要", "技术落点", "关键决策 ID", "影响文件/符号", "验证命令", "证据"];
const TECHNICAL_DECISION_HEADERS = ["决策 ID", "决策", "原因", "取舍"];
const TECHNICAL_LIFECYCLE_STATUSES = new Set(["draft", "approved", "implemented", "stale", "superseded"]);
const TECHNICAL_LIFECYCLE_REQUIRED_FIELDS = ["lifecycle_status", "implemented_commits", "validated_by"];
const GENERIC_MAPPING_PATTERNS = ["见本设计的 `影响组件`", "见本设计的", "按本 technical", "见 `## 测试策略`", "对应计划追踪"];
const HIDDEN_REQUIREMENT_TERMS = ["必须", "不得", "禁止", "MUST", "SHOULD"];
const HIDDEN_REQUIREMENT_EXCLUDED_SECTIONS = new Set(["规格缺口审查", "规格到方案映射", "规格到设计映射", "无需技术方案的规格", "无需技术设计的规格", "测试策略"]);
const TEMPLATE_PLACEHOLDER_RE = /<[^>\n]*(?:[\u4e00-\u9fff]|feature-name|doc-id|path|symbol)[^>\n]*>|YYYY-MM-DD/g;

export interface ValidationResult {
  ok: boolean;
  checked_files: string[];
  errors: string[];
  warnings: string[];
}

export interface ValidationPayload extends ValidationResult {
  error_count: number;
  warning_count: number;
}

function allMatches(regex: RegExp, text: string): string[] {
  const clone = new RegExp(regex.source, regex.flags);
  return [...text.matchAll(clone)].map((match) => match[0]);
}

function markdownSection(text: string, heading: string): string | undefined {
  const headingRe = new RegExp(`^##[ \\t]+${escapeRegExp(heading)}[ \\t]*$`, "m");
  const match = headingRe.exec(text);
  if (!match) {
    return undefined;
  }
  const rest = text.slice(match.index + match[0].length);
  const nextMatch = /^##[ \t]+/m.exec(rest);
  if (!nextMatch) {
    return text.slice(match.index);
  }
  return text.slice(match.index, match.index + match[0].length + nextMatch.index);
}

function markdownSectionByAliases(text: string, headings: string[]): string | undefined {
  for (const heading of headings) {
    const section = markdownSection(text, heading);
    if (section) {
      return section;
    }
  }
  return undefined;
}

function markdownSections(text: string): [string, string][] {
  const matches = [...text.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)];
  const sections: [string, string][] = [];
  for (const [index, match] of matches.entries()) {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
    sections.push([match[1].trim(), text.slice(start, end)]);
  }
  return sections;
}

function parseMarkdownTable(section: string): [string[], string[][]] {
  const lines = section.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const line = lines[index];
    if (!line.trimStart().startsWith("|")) {
      continue;
    }
    const header = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
    const separator = lines[index + 1].trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
    if (!separator.length || !separator.every((cell) => cell.replaceAll(":", "").replaceAll("-", "") === "" && cell.includes("---"))) {
      continue;
    }
    const rows: string[][] = [];
    for (const rowLine of lines.slice(index + 2)) {
      if (!rowLine.trimStart().startsWith("|")) {
        break;
      }
      const cells = rowLine.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      if (cells.length === header.length) {
        rows.push(cells);
      }
    }
    return [header, rows];
  }
  return [[], []];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isRelativeTo(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

function relativePath(root: string, path: string): string {
  return isRelativeTo(root, path) ? relative(root, path) : path;
}

function collectTechnicalDesignFiles(root: string, technicalFiles?: string[]): string[] {
  if (technicalFiles && technicalFiles.length > 0) {
    return technicalFiles.map((path) => (isAbsolute(path) ? path : resolve(root, path))).sort();
  }
  const files: string[] = [];
  for (const featureRoot of collectFeatureRoots(root)) {
    files.push(...featureTechnicalDesignFiles(featureRoot));
  }
  return files.sort();
}

function approvedSpecFilesForFeature(featureRoot: string): string[] {
  return featureSpecFiles(featureRoot).filter((specFile) => parseFrontmatter(readFileSync(specFile, "utf8")).status === "approved");
}

function relatedPathsFromMetadata(root: string, text: string, key: string): string[] {
  const paths: string[] = [];
  for (const value of relatedValuesFromMetadata(text, key)) {
    if (!value.startsWith("docs/coding-plugins/")) {
      continue;
    }
    const path = resolve(root, value);
    if (existsSync(path)) {
      paths.push(path);
    }
  }
  return paths.sort();
}

function relatedValuesFromMetadata(text: string, key: string): string[] {
  const values = new Set(frontmatterListValues(text, key));
  if (key !== RELATED_DOCS_KEY) {
    for (const value of frontmatterListValues(text, RELATED_DOCS_KEY)) {
      const suffix = documentSuffix(value);
      if (key === "PRD" && suffix === "PRD") {
        values.add(value);
      }
    }
  }
  return [...values].sort();
}

function approvedSpecFilesForTechnical(root: string, technicalFile: string, text: string): string[] {
  const relatedSpecs = relatedPathsFromMetadata(root, text, "PRD");
  if (relatedSpecs.length > 0) {
    return relatedSpecs.filter((specFile) => parseFrontmatter(readFileSync(specFile, "utf8")).status === "approved");
  }
  const featureContext = featureRootForDocument(root, technicalFile);
  if (!featureContext) {
    return [];
  }
  const [, featureRoot] = featureContext;
  const docId = documentDocId(technicalFile);
  return approvedSpecFilesForFeature(featureRoot).filter((specFile) => documentDocId(specFile) === docId);
}

function requiredSpecIdsFromSpecs(specFiles: string[]): Set<string> {
  const ids = new Set<string>();
  for (const specFile of specFiles) {
    for (const line of readFileSync(specFile, "utf8").split(/\r?\n/)) {
      const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      if (!cells.length || !line.trimStart().startsWith("|")) {
        continue;
      }
      if (cells.some((cell) => cell === "必须" || cell === "MUST")) {
        for (const specId of allMatches(SPEC_ID_RE, line)) {
          ids.add(specId);
        }
      }
    }
  }
  return ids;
}

function technicalDesignCoverageIds(text: string): Set<string> {
  const ids = new Set<string>();
  for (const headings of TECHNICAL_REQUIRED_SECTION_ALIASES) {
    const section = markdownSectionByAliases(text, headings);
    if (section) {
      for (const specId of allMatches(SPEC_ID_RE, section)) {
        ids.add(specId);
      }
    }
  }
  return ids;
}

function validateLifecycleMetadata(root: string, technicalFile: string, text: string): string[] {
  const [lines] = splitFrontmatter(text);
  const frontmatter = parseFrontmatterBlock(lines);
  const metadata = frontmatter.scalars;
  const presentFields = new Set([...Object.keys(frontmatter.scalars), ...Object.keys(frontmatter.lists)]);
  const missing = TECHNICAL_LIFECYCLE_REQUIRED_FIELDS.filter((field) => !presentFields.has(field));
  if (missing.length > 0) {
    return [`${relativePath(root, technicalFile)} lifecycle metadata missing ${missing.join(", ")}`];
  }

  const status = metadata.lifecycle_status ?? "";
  if (!TECHNICAL_LIFECYCLE_STATUSES.has(status)) {
    return [`${relativePath(root, technicalFile)} lifecycle metadata has invalid lifecycle_status=${status}`];
  }
  return [];
}

function validateRequiredSections(root: string, technicalFile: string, text: string): string[] {
  const missing = TECHNICAL_REQUIRED_SECTION_ALIASES.filter((headings) => markdownSectionByAliases(text, headings) === undefined).map((headings) => headings[0]);
  return missing.length > 0 ? [`${relative(root, technicalFile)} missing required section: ${missing.join(", ")}`] : [];
}

function validateMustSpecCoverage(root: string, technicalFile: string, text: string): string[] {
  const requiredIds = requiredSpecIdsFromSpecs(approvedSpecFilesForTechnical(root, technicalFile, text));
  if (requiredIds.size === 0) {
    return [];
  }
  const coveredIds = technicalDesignCoverageIds(text);
  const missing = [...requiredIds].filter((id) => !coveredIds.has(id)).sort();
  return missing.length > 0 ? [`${relative(root, technicalFile)} does not cover required Spec IDs: ${missing.join(", ")}`] : [];
}

function validateRelatedMetadata(root: string, technicalFile: string, text: string): string[] {
  const featureContext = featureRootForDocument(root, technicalFile);
  if (!featureContext) {
    return [];
  }
  const [, featureRoot] = featureContext;
  const docId = documentDocId(technicalFile);
  const expectedByKey = expectedRelatedPathsForDocId(featureRoot, docId, technicalFile);

  const errors: string[] = [];
  for (const [key, expectedPaths] of Object.entries(expectedByKey)) {
    if (expectedPaths.length === 0) {
      continue;
    }
    const rawValues = relatedValuesFromMetadata(text, key);
    const actualValues = new Set(rawValues.filter((value) => value.startsWith("docs/coding-plugins/") && existsSync(resolve(root, value))));
    const expectedValues = new Set(expectedPaths.map((path) => relative(root, path)));
    const missingValues = [...expectedValues].filter((value) => !actualValues.has(value)).sort();
    const missingExisting = rawValues
      .filter((value) => value.startsWith("docs/coding-plugins/") && !existsSync(resolve(root, value)))
      .sort();
    if (missingValues.length > 0) {
      errors.push(`${relative(root, technicalFile)} related metadata ${key} missing ${missingValues.join(", ")}`);
    }
    if (missingExisting.length > 0) {
      errors.push(`${relative(root, technicalFile)} related metadata ${key} references missing ${missingExisting.join(", ")}`);
    }
  }
  return errors;
}

function validateMappingTableSchema(root: string, technicalFile: string, text: string): string[] {
  const section = markdownSectionByAliases(text, ["规格到方案映射", "规格到设计映射"]);
  if (!section) {
    return [];
  }
  const [header, rows] = parseMarkdownTable(section);
  if (JSON.stringify(header) !== JSON.stringify(TECHNICAL_MAPPING_HEADERS)) {
    return [`${relativePath(root, technicalFile)} mapping table header must be: ${TECHNICAL_MAPPING_HEADERS.join(" | ")}`];
  }
  const errors: string[] = [];
  rows.forEach((row, index) => {
    if (!SPEC_ID_RE.test(row[0])) {
      SPEC_ID_RE.lastIndex = 0;
      return;
    }
    SPEC_ID_RE.lastIndex = 0;
    const emptyColumns = row.map((value, column) => (value ? undefined : TECHNICAL_MAPPING_HEADERS[column])).filter(Boolean);
    if (emptyColumns.length > 0) {
      errors.push(`${relativePath(root, technicalFile)} mapping table row ${index + 1} has empty columns: ${emptyColumns.join(", ")}`);
    }
  });
  return errors;
}

function decisionIdsFromDesign(text: string): Set<string> {
  const section = markdownSection(text, "关键决策");
  if (!section) {
    return new Set();
  }
  const [header, rows] = parseMarkdownTable(section);
  if (JSON.stringify(header) !== JSON.stringify(TECHNICAL_DECISION_HEADERS)) {
    return new Set();
  }
  return new Set(rows.flatMap((row) => allMatches(TD_ID_RE, row[0])));
}

function validateDecisionIdReferences(root: string, technicalFile: string, text: string): string[] {
  const section = markdownSectionByAliases(text, ["规格到方案映射", "规格到设计映射"]);
  if (!section) {
    return [];
  }
  const [header, rows] = parseMarkdownTable(section);
  if (JSON.stringify(header) !== JSON.stringify(TECHNICAL_MAPPING_HEADERS)) {
    return [];
  }
  const declaredIds = decisionIdsFromDesign(text);
  if (declaredIds.size === 0) {
    return [`${relativePath(root, technicalFile)} missing key decision table with TD decision IDs`];
  }
  const decisionColumn = header.indexOf("关键决策 ID");
  const referencedIds = new Set(rows.flatMap((row) => allMatches(TD_ID_RE, row[decisionColumn])));
  const missing = [...referencedIds].filter((id) => !declaredIds.has(id)).sort();
  return missing.length > 0 ? [`${relativePath(root, technicalFile)} references unknown decision IDs: ${missing.join(", ")}`] : [];
}

function validateHiddenRequirements(root: string, technicalFile: string, text: string): string[] {
  const errors: string[] = [];
  let inCodeFence = false;
  for (const [heading, section] of markdownSections(text)) {
    if (HIDDEN_REQUIREMENT_EXCLUDED_SECTIONS.has(heading)) {
      continue;
    }
    section.split(/\r?\n/).forEach((line, index) => {
      const stripped = line.trim();
      if (stripped.startsWith("```")) {
        inCodeFence = !inCodeFence;
        return;
      }
      if (inCodeFence || !stripped || stripped.startsWith("#")) {
        return;
      }
      if (!HIDDEN_REQUIREMENT_TERMS.some((term) => stripped.includes(term))) {
        return;
      }
      if (SPEC_ID_RE.test(stripped) || TD_ID_RE.test(stripped) || stripped.includes("设计约束")) {
        SPEC_ID_RE.lastIndex = 0;
        TD_ID_RE.lastIndex = 0;
        return;
      }
      SPEC_ID_RE.lastIndex = 0;
      TD_ID_RE.lastIndex = 0;
      errors.push(`${relativePath(root, technicalFile)} hidden requirement in ${heading} line ${index + 1}: ${stripped}`);
    });
  }
  return errors;
}

function genericMappingWarnings(root: string, technicalFile: string, text: string): string[] {
  const section = markdownSectionByAliases(text, ["规格到方案映射", "规格到设计映射"]);
  if (!section) {
    return [];
  }
  const warnings: string[] = [];
  section.split(/\r?\n/).forEach((line, index) => {
    if (!SPEC_ID_RE.test(line)) {
      SPEC_ID_RE.lastIndex = 0;
      return;
    }
    SPEC_ID_RE.lastIndex = 0;
    if (GENERIC_MAPPING_PATTERNS.some((pattern) => line.includes(pattern))) {
      const specIds = allMatches(SPEC_ID_RE, line).join(", ");
      warnings.push(`${relative(root, technicalFile)} has generic mapping for ${specIds} in 规格到方案映射 line ${index + 1}`);
    }
  });
  return warnings;
}

function staleWarnings(root: string, technicalFile: string, text: string): string[] {
  const technicalMetadata = parseFrontmatter(text);
  const technicalUpdated = technicalMetadata.updated ?? "";
  if (!technicalUpdated) {
    return [];
  }
  const warnings: string[] = [];
  for (const specFile of approvedSpecFilesForTechnical(root, technicalFile, text)) {
    const specUpdated = parseFrontmatter(readFileSync(specFile, "utf8")).updated ?? "";
    if (specUpdated && specUpdated > technicalUpdated) {
      warnings.push(
        `${relative(root, technicalFile)} is stale technical: ${relative(root, specFile)} updated ${specUpdated} > technical updated ${technicalUpdated}`,
      );
    }
  }
  return warnings;
}

function validateNoUnfinishedTemplateContent(root: string, documentFile: string, text: string): string[] {
  const errors: string[] = [];
  let inCodeFence = false;
  text.split(/\r?\n/).forEach((line, index) => {
    const stripped = line.trim();
    if (stripped.startsWith("```")) {
      inCodeFence = !inCodeFence;
      return;
    }
    if (inCodeFence) {
      return;
    }
    const matches = [...line.matchAll(TEMPLATE_PLACEHOLDER_RE)].map((match) => match[0]);
    if (matches.length > 0) {
      errors.push(`${relativePath(root, documentFile)} unfinished template content line ${index + 1}: ${matches.join(", ")}`);
    }
  });
  return errors;
}

export function validateRepository(rootPath: string, options: { strict: boolean; technicalFiles?: string[] }): ValidationResult {
  const root = resolve(rootPath);
  const files = collectTechnicalDesignFiles(root, options.technicalFiles);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const technicalFile of files) {
    if (!existsSync(technicalFile)) {
      errors.push(`Technical design file does not exist: ${technicalFile}`);
      continue;
    }
    const text = readFileSync(technicalFile, "utf8");
    errors.push(...validateRequiredSections(root, technicalFile, text));
    errors.push(...validateLifecycleMetadata(root, technicalFile, text));
    errors.push(...validateMustSpecCoverage(root, technicalFile, text));
    errors.push(...validateRelatedMetadata(root, technicalFile, text));
    errors.push(...validateMappingTableSchema(root, technicalFile, text));
    errors.push(...validateDecisionIdReferences(root, technicalFile, text));
    errors.push(...validateHiddenRequirements(root, technicalFile, text));
    errors.push(...validateNoUnfinishedTemplateContent(root, technicalFile, text));
    warnings.push(...genericMappingWarnings(root, technicalFile, text));
    warnings.push(...staleWarnings(root, technicalFile, text));
  }

  const finalErrors = options.strict ? [...errors, ...warnings] : errors;
  const finalWarnings = options.strict && warnings.length > 0 ? [] : warnings;
  return {
    ok: finalErrors.length === 0,
    checked_files: files.map((path) => (isRelativeTo(root, path) ? relative(root, path) : path)),
    errors: finalErrors,
    warnings: finalWarnings,
  };
}

export function buildPayload(result: ValidationResult): ValidationPayload {
  return {
    ...result,
    error_count: result.errors.length,
    warning_count: result.warnings.length,
  };
}

export function formatTextResult(result: ValidationResult): string {
  const lines = [result.ok ? `Technical design validation passed: ${result.checked_files.length} file(s)` : "Technical design validation failed"];
  if (result.errors.length > 0) {
    lines.push("", "Errors:");
    for (const error of result.errors) {
      lines.push(`- ${error}`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push("", "Warnings:");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  return lines.join("\n");
}
