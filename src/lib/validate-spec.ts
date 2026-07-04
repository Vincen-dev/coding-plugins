import { existsSync, readFileSync, statSync } from "node:fs";

const SPEC_ID_RE = /\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}\b/g;
const PLACEHOLDER_RE = /<[^>\n]{2,}>|\bTODO\b|\bTBD\b|待补充|待定|占位/g;
const SEPARATOR_RE = /^:?-{3,}:?$/;

const MAYBE_AMBIGUOUS = ["适当", "友好", "常见情况", "尽快", "合理", "必要时"];

const ALLOWED_TRACE_STATUSES = new Set([
  "planned",
  "covered",
  "manual",
  "blocked",
  "deferred",
  "not-applicable",
  "n/a",
  "implemented",
  "done",
  "计划中",
  "已覆盖",
  "已实现",
  "完成",
  "人工",
  "阻塞",
  "延期",
  "不适用",
]);

interface Table {
  headers: string[];
  rows: string[][];
  startLine: number;
}

export interface ValidationResult {
  path: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationPayload {
  ok: boolean;
  error_count: number;
  warning_count: number;
  results: ValidationResult[];
}

function allMatches(regex: RegExp, text: string): RegExpExecArray[] {
  const clone = new RegExp(regex.source, regex.flags);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = clone.exec(text)) !== null) {
    matches.push(match);
  }
  return matches;
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => SEPARATOR_RE.test(cell.trim()));
}

function extractTables(lines: string[]): Table[] {
  const tables: Table[] = [];
  let index = 0;
  while (index < lines.length) {
    if (!lines[index].trimStart().startsWith("|") || index + 1 >= lines.length) {
      index += 1;
      continue;
    }

    const headers = splitTableRow(lines[index]);
    const separator = splitTableRow(lines[index + 1]);
    if (!isSeparatorRow(separator)) {
      index += 1;
      continue;
    }

    const rows: string[][] = [];
    const startLine = index + 1;
    index += 2;
    while (index < lines.length && lines[index].trimStart().startsWith("|")) {
      const row = splitTableRow(lines[index]);
      if (!isSeparatorRow(row)) {
        rows.push(row);
      }
      index += 1;
    }
    tables.push({ headers, rows, startLine });
  }
  return tables;
}

function getCell(row: string[], headers: string[], names: string[]): string {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  for (const rawName of names) {
    const name = rawName.toLowerCase();
    for (const [index, header] of normalized.entries()) {
      if (header.includes(name) && index < row.length) {
        return row[index].trim();
      }
    }
  }
  return "";
}

function hasHeader(headers: string[], names: string[]): boolean {
  return names.some((name) => getCell(headers, headers, [name]));
}

function placeholderMatches(text: string): RegExpExecArray[] {
  return allMatches(PLACEHOLDER_RE, text).filter((match) => {
    const value = match[0];
    if (value.startsWith("<")) {
      const previous = match.index > 0 ? text[match.index - 1] : "";
      if (/[A-Za-z0-9]/.test(previous) || previous === "_" || previous === ">") {
        return false;
      }
    }
    return true;
  });
}

function containsPlaceholder(text: string): boolean {
  return placeholderMatches(text).length > 0;
}

function normalizeCell(text: string): string {
  return text.trim().replace(/^`+|`+$/g, "").trim();
}

function normalizePriority(text: string): string {
  const normalized = normalizeCell(text).toUpperCase();
  if (["必须", "必需", "MUST"].includes(normalized)) {
    return "MUST";
  }
  if (["应该", "SHOULD"].includes(normalized)) {
    return "SHOULD";
  }
  return normalized;
}

function isTraceabilityTable(headers: string[]): boolean {
  const headerText = headers.join(" | ").toLowerCase();
  const hasSpecId = headerText.includes("spec id") || headerText.includes("规格 id") || headerText.includes("规格id");
  const hasEvidence = ["verification", "test file", "command", "evidence", "验证", "测试文件", "命令", "证据"].some(
    (marker) => headerText.includes(marker),
  );
  return hasSpecId && hasEvidence;
}

function sortedDisplay(values: Set<string>): string {
  return `['${[...values].sort().join("', '")}']`;
}

function specIds(text: string): Set<string> {
  return new Set(allMatches(SPEC_ID_RE, text).map((match) => match[0]));
}

export function validateSpec(path: string, strict: boolean): [string[], string[]] {
  const errors: string[] = [];
  let warnings: string[] = [];

  if (!existsSync(path)) {
    return [[`File does not exist: ${path}`], warnings];
  }
  if (!statSync(path).isFile()) {
    return [[`Path is not a file: ${path}`], warnings];
  }

  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);
  if (!text.trim()) {
    return [["Spec file is empty."], warnings];
  }

  for (const match of placeholderMatches(text)) {
    const lineNo = text.slice(0, match.index).split("\n").length;
    errors.push(`Line ${lineNo}: unresolved placeholder or TODO: '${match[0]}'.`);
  }

  for (const phrase of MAYBE_AMBIGUOUS) {
    if (text.includes(phrase)) {
      warnings.push(`Ambiguous wording found: '${phrase}'. Make it observable if it is normative.`);
    }
  }

  const ids = specIds(text);
  if (ids.size === 0) {
    errors.push("No Spec ID found. Use REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON-001 style IDs.");
  }

  const tables = extractTables(lines);
  const mustIds = new Set<string>();
  const shouldIds = new Set<string>();
  const traceIds = new Set<string>();
  const definedIds = new Map<string, number>();

  for (const table of tables) {
    const isTraceTable = isTraceabilityTable(table.headers);
    const hasStatusColumn = hasHeader(table.headers, ["status", "状态"]);

    table.rows.forEach((row, rowIndex) => {
      const lineNo = table.startLine + rowIndex + 2;
      const rowText = row.join(" | ");
      const rowIds = specIds(rowText);
      const priority = normalizePriority(getCell(row, table.headers, ["priority", "优先级"]));

      if (rowIds.size > 0 && !isTraceTable) {
        for (const specId of rowIds) {
          if (definedIds.has(specId)) {
            errors.push(
              `Line ${lineNo}: Duplicate Spec ID definition ${specId} (first defined on line ${definedIds.get(specId)}).`,
            );
          } else {
            definedIds.set(specId, lineNo);
          }
        }
      }

      if ((priority === "MUST" || priority === "SHOULD") && rowIds.size === 0) {
        errors.push(`Line ${lineNo}: ${priority} row is missing a Spec ID.`);
      }

      if (priority === "MUST") {
        for (const specId of rowIds) {
          mustIds.add(specId);
        }
        const verification = getCell(row, table.headers, ["verification", "验证方式", "验证"]);
        if (!verification || containsPlaceholder(verification)) {
          errors.push(`Line ${lineNo}: MUST row lacks concrete verification evidence.`);
        }
      }

      if (priority === "SHOULD") {
        for (const specId of rowIds) {
          shouldIds.add(specId);
        }
      }

      if (isTraceTable && rowIds.size > 0) {
        for (const specId of rowIds) {
          traceIds.add(specId);
        }
        const verificationType = getCell(row, table.headers, [
          "verification type",
          "verification",
          "验证类型",
          "验证方式",
        ]);
        const testCommand = getCell(row, table.headers, ["test file", "command", "evidence", "测试文件", "命令", "证据"]);
        if (
          !verificationType ||
          !testCommand ||
          containsPlaceholder(verificationType) ||
          containsPlaceholder(testCommand)
        ) {
          errors.push(`Line ${lineNo}: traceability row for ${sortedDisplay(rowIds)} lacks evidence.`);
        }
        if (hasStatusColumn) {
          const status = getCell(row, table.headers, ["status", "状态"]);
          const normalizedStatus = normalizeCell(status).toLowerCase();
          if (!status || containsPlaceholder(status)) {
            errors.push(`Line ${lineNo}: traceability row for ${sortedDisplay(rowIds)} lacks status.`);
          } else if (!ALLOWED_TRACE_STATUSES.has(normalizedStatus)) {
            const allowed = [...ALLOWED_TRACE_STATUSES].sort().join(", ");
            errors.push(`Line ${lineNo}: invalid traceability status '${status}'; allowed: ${allowed}.`);
          }
        }
      }
    });
  }

  if (mustIds.size > 0 && traceIds.size === 0) {
    errors.push("MUST requirements exist but no Traceability Matrix rows were found.");
  }

  const missingTrace = [...mustIds].filter((id) => !traceIds.has(id)).sort();
  if (missingTrace.length > 0) {
    errors.push(`MUST requirements missing from Traceability Matrix: ${missingTrace.join(", ")}.`);
  }

  const missingShouldTrace = [...shouldIds].filter((id) => !traceIds.has(id)).sort();
  if (missingShouldTrace.length > 0) {
    warnings.push(`SHOULD requirements missing from Traceability Matrix: ${missingShouldTrace.join(", ")}.`);
  }

  if (strict && warnings.length > 0) {
    errors.push(...warnings);
    warnings = [];
  }

  return [errors, warnings];
}

export function buildResult(path: string, strict: boolean): ValidationResult {
  const [errors, warnings] = validateSpec(path, strict);
  return { path, ok: errors.length === 0, errors, warnings };
}

export function buildPayload(paths: string[], strict: boolean): ValidationPayload {
  const results = paths.map((path) => buildResult(path, strict));
  return {
    ok: results.every((result) => result.ok),
    error_count: results.reduce((total, result) => total + result.errors.length, 0),
    warning_count: results.reduce((total, result) => total + result.warnings.length, 0),
    results,
  };
}

export function formatTextResults(results: ValidationResult[]): string {
  const blocks = results.map((result) => {
    const lines: string[] = [];
    if (result.errors.length > 0) {
      lines.push(`Spec validation failed: ${result.path}`, "", "Errors:");
      for (const error of result.errors) {
        lines.push(`- ${error}`);
      }
    } else {
      lines.push(`Spec validation passed: ${result.path}`);
    }
    if (result.warnings.length > 0) {
      lines.push("", "Warnings:");
      for (const warning of result.warnings) {
        lines.push(`- ${warning}`);
      }
    }
    return lines.join("\n");
  });
  return blocks.join("\n\n");
}
