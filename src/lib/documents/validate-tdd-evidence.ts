import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { isPathIgnoredByGitignore } from "./artifact-mode.ts";
import type { ArtifactModeValue } from "./artifact-mode.ts";

const EVIDENCE_HEADING_RE = /^\s{0,3}#{1,6}\s+TDD 证据\s*$/gim;
const EXCEPTION_HEADING_RE = /^\s{0,3}#{1,6}\s+TDD 例外记录\s*$/gim;
const SPEC_SOURCE_RE = /\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}\b|bug|复现|验收|acceptance/i;
const PLACEHOLDER_RE = /<[^>\n]{2,}>|\[[^\]\n]{2,}\]|\bTODO\b|\bTBD\b|待补充|待定|占位|\.\.\./;
const SUSPICIOUS_RE = /先实现|后补测|补测试|测试后补|直接实现|先写代码|实现后写测试|test after|implemented first/i;
const BEHAVIOR_SOURCE_RE = /用户|点击|按钮|页面|界面|交互|流程|UI|widget|behavior/i;

const EVIDENCE_FIELDS = [
  "规格/缺陷/验收",
  "RED 测试",
  "RED 命令",
  "RED 失败",
  "GREEN 变更",
  "GREEN 命令",
  "REFACTOR 命令",
  "最终验证",
];
const REPRODUCIBLE_REFERENCE_FIELDS = ["RED 测试", "RED 命令", "GREEN 命令", "REFACTOR 命令", "最终验证"];
const OPTIONAL_TEST_TYPE_FIELD = "测试类型";
const ALLOWED_TEST_TYPES = new Set(["behavior", "contract", "architecture", "source-scan", "config"]);
const EXCEPTION_FIELDS = ["原因", "用户批准", "替代验证", "风险"];

export interface ValidationResult {
  path: string;
  ok: boolean;
  content_valid: boolean;
  valid_for: Array<"local-review" | "task-completion" | "formal-completion">;
  formal_completion_allowed: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationPayload {
  ok: boolean;
  error_count: number;
  warning_count: number;
  results: ValidationResult[];
}

export interface ValidationOptions {
  strict: boolean;
  root?: string;
  artifactMode?: ArtifactModeValue;
}

type ValidationInput = boolean | ValidationOptions;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fieldPattern(label: string): RegExp {
  return new RegExp(
    `^\\s*(?:[-*]\\s*)?(?:\\*\\*)?${escapeRegExp(label)}\\s*(?::\\*\\*|\\*\\*\\s*:|:)\\s*(.+?)\\s*$`,
    "gim",
  );
}

function getField(text: string, label: string): string | undefined {
  const match = fieldPattern(label).exec(text);
  return match ? match[1].trim() : undefined;
}

function getFields(text: string, label: string): string[] {
  return [...text.matchAll(fieldPattern(label))].map((match) => match[1].trim());
}

function isPlaceholder(value: string): boolean {
  const cleaned = value.trim().replace(/^`+|`+$/g, "").trim();
  return !cleaned || PLACEHOLDER_RE.test(cleaned);
}

function requireFields(text: string, labels: string[], sectionName: string): string[] {
  const errors: string[] = [];
  for (const label of labels) {
    const value = getField(text, label);
    if (value === undefined) {
      errors.push(`${sectionName} is missing required field: ${label}.`);
    } else if (isPlaceholder(value)) {
      errors.push(`${sectionName} field '${label}' still contains a placeholder: '${value}'.`);
    }
  }
  return errors;
}

function normalizeOptions(input: ValidationInput): ValidationOptions {
  if (typeof input === "boolean") {
    return { strict: input };
  }
  return input;
}

function localPathReferences(text: string): string[] {
  const withoutQuotedSearchPatterns = text.replace(/"[^"\n]*"|'[^'\n]*'/g, " ");
  return [...new Set([...withoutQuotedSearchPatterns.matchAll(/\b(?:tests|src|skills|docs|hooks|assets|\.github)\/[A-Za-z0-9_.\/-]+/g)]
    .map((match) => match[0])
    .filter((reference) => !reference.includes("...") && /\.[A-Za-z0-9]+$/.test(reference)))]
    .sort();
}

function referencedPathExists(root: string, evidencePath: string, reference: string): boolean {
  const candidates = [resolve(root, reference), resolve(dirname(evidencePath), reference)];
  return candidates.some((candidate) => existsSync(candidate));
}

function validateEvidenceContext(path: string, text: string, options: ValidationOptions): string[] {
  const errors: string[] = [];
  if (!options.root) {
    return errors;
  }

  const root = resolve(options.root);
  const evidencePath = resolve(path);
  if (options.artifactMode !== "local" && isPathIgnoredByGitignore(root, evidencePath)) {
    errors.push("ignored evidence cannot be used as formal completion evidence.");
  }

  const reproducibleText = REPRODUCIBLE_REFERENCE_FIELDS.flatMap((field) => getFields(text, field)).join("\n");
  for (const reference of localPathReferences(reproducibleText)) {
    if (!referencedPathExists(root, evidencePath, reference)) {
      errors.push(`referenced path does not exist: ${reference}`);
    }
  }
  return errors;
}

export function validateText(text: string, input: ValidationInput): [string[], string[]] {
  const options = normalizeOptions(input);
  const errors: string[] = [];
  let warnings: string[] = [];

  if (!text.trim()) {
    return [["Evidence file is empty."], warnings];
  }

  if (SUSPICIOUS_RE.test(text)) {
    errors.push("Suspicious after-the-fact testing wording found; TDD requires RED before implementation.");
  }

  const hasEvidence = EVIDENCE_HEADING_RE.test(text);
  EVIDENCE_HEADING_RE.lastIndex = 0;
  const hasException = EXCEPTION_HEADING_RE.test(text);
  EXCEPTION_HEADING_RE.lastIndex = 0;

  if (!hasEvidence && !hasException) {
    errors.push("Missing TDD 证据 or TDD 例外记录 section.");
  }

  if (hasEvidence) {
    errors.push(...requireFields(text, EVIDENCE_FIELDS, "TDD 证据"));
    const source = getField(text, "规格/缺陷/验收");
    const testType = getField(text, OPTIONAL_TEST_TYPE_FIELD);
    const redFailure = getField(text, "RED 失败");
    const finalVerification = getField(text, "最终验证");

    if (source && !isPlaceholder(source) && options.artifactMode !== "local" && !SPEC_SOURCE_RE.test(source)) {
      warnings.push("规格/缺陷/验收 does not look traceable to a Spec ID, bug reproduction, or acceptance criterion.");
    }

    if (testType) {
      const normalizedTestType = testType.trim().replace(/^`+|`+$/g, "").toLowerCase();
      if (!ALLOWED_TEST_TYPES.has(normalizedTestType)) {
        errors.push(`invalid 测试类型: ${testType}. Allowed: ${[...ALLOWED_TEST_TYPES].sort().join(", ")}.`);
      } else if (normalizedTestType === "source-scan" && source && BEHAVIOR_SOURCE_RE.test(source)) {
        warnings.push("source-scan should not be used as the primary proof for user-facing behavior.");
      }
    }

    if (redFailure && /\bpass(?:ed)?\b|通过/i.test(redFailure)) {
      warnings.push("RED 失败提到了类似通过的结果；请确认测试确实先失败。");
    }

    if (finalVerification && /not run|未运行|无法运行/i.test(finalVerification)) {
      warnings.push("最终验证未运行；如果自动化被阻塞，请使用 TDD 例外记录。");
    }
  }

  if (hasException) {
    errors.push(...requireFields(text, EXCEPTION_FIELDS, "TDD 例外记录"));
  }

  if (options.strict && warnings.length > 0) {
    errors.push(...warnings);
    warnings = [];
  }

  return [errors, warnings];
}

export function buildResult(path: string, input: ValidationInput): ValidationResult {
  const options = normalizeOptions(input);
  if (!existsSync(path)) {
    return { path, ok: false, content_valid: false, valid_for: [], formal_completion_allowed: false, errors: [`File does not exist: ${path}`], warnings: [] };
  }
  if (!statSync(path).isFile()) {
    return { path, ok: false, content_valid: false, valid_for: [], formal_completion_allowed: false, errors: [`Path is not a file: ${path}`], warnings: [] };
  }
  const text = readFileSync(path, "utf8");
  const [contentErrors, warnings] = validateText(text, options);
  const contextErrors = validateEvidenceContext(path, text, options);
  const errors = [...contentErrors, ...contextErrors];
  const contentValid = contentErrors.length === 0;
  const ignored = options.root ? isPathIgnoredByGitignore(resolve(options.root), resolve(path)) : false;
  const formalCompletionAllowed = contentValid && contextErrors.length === 0 && options.artifactMode !== "local" && !ignored;
  return {
    path,
    ok: errors.length === 0,
    content_valid: contentValid,
    valid_for: contentValid
      ? formalCompletionAllowed ? ["local-review", "task-completion", "formal-completion"] : ["local-review"]
      : [],
    formal_completion_allowed: formalCompletionAllowed,
    errors,
    warnings,
  };
}

export function buildPayload(paths: string[], input: ValidationInput): ValidationPayload {
  const options = normalizeOptions(input);
  const results = paths.map((path) => buildResult(path, options));
  return {
    ok: results.every((result) => result.ok),
    error_count: results.reduce((total, result) => total + result.errors.length, 0),
    warning_count: results.reduce((total, result) => total + result.warnings.length, 0),
    results,
  };
}

export function formatTextResults(results: ValidationResult[]): string {
  return results
    .map((result) => {
      const lines: string[] = [];
      if (result.errors.length > 0) {
        lines.push(`TDD evidence validation failed: ${result.path}`, "", "Errors:");
        for (const error of result.errors) {
          lines.push(`- ${error}`);
        }
      } else {
        lines.push(`TDD evidence validation passed: ${result.path}`);
      }
      if (result.warnings.length > 0) {
        lines.push("", "Warnings:");
        for (const warning of result.warnings) {
          lines.push(`- ${warning}`);
        }
      }
      return lines.join("\n");
    })
    .join("\n\n");
}
