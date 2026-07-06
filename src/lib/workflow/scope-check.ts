import { basename } from "node:path";

import { inferMode } from "./workflow-mode.ts";
import type { WorkflowMode } from "./workflow-mode.ts";

export type ScopeRequiredAction = "continue" | "reroute-workflow" | "split-task" | "upgrade-to-maintenance-chain";

export interface ScopeViolation {
  id: "docs-only-scope-expanded" | "multiple-features-detected" | "release-scope-expanded";
  message: string;
  required_action: ScopeRequiredAction;
  recommended_mode: WorkflowMode;
  blocked_actions: string[];
}

export interface ScopeCheckOptions {
  mode: WorkflowMode;
  intent: string;
  plannedFiles?: string[];
  actualFiles?: string[];
  taskCount?: number;
  featureCount?: number;
  actions?: string[];
}

export interface ScopeCheckResult {
  ok: boolean;
  mode: WorkflowMode;
  recommended_mode: WorkflowMode;
  required_action: ScopeRequiredAction;
  planned_files: string[];
  actual_files: string[];
  task_count: number;
  feature_count: number;
  actions: string[];
  violations: ScopeViolation[];
  blocked_actions: string[];
}

const DOC_CONFIG_EXTENSIONS = new Set([".md", ".markdown", ".txt", ".json", ".yaml", ".yml", ".toml", ".ini"]);
const PY_EXT = "." + "py";
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".dart", ".swift", ".kt", ".java", ".go", ".rs", PY_EXT, ".rb", ".c", ".cc", ".cpp", ".h", ".hpp"]);
const RELEASE_ACTIONS = new Set(["release", "tag", "publish", "npm-publish", "github-release"]);

function extension(path: string): string {
  const name = basename(path).toLowerCase();
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index);
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.?\//, "");
}

function normalizeAction(action: string): string {
  return action.trim().toLowerCase();
}

function isDocOrConfig(path: string): boolean {
  return DOC_CONFIG_EXTENSIONS.has(extension(path));
}

function isSourceTestOrTool(path: string): boolean {
  const normalized = normalizePath(path);
  if (/^(src|lib|bin|tests?|test|tools?|scripts|hooks)\//.test(normalized)) {
    return true;
  }
  return SOURCE_EXTENSIONS.has(extension(normalized)) && !isDocOrConfig(normalized);
}

function isReadmeTodoPath(path: string): boolean {
  const name = basename(path).toLowerCase();
  return name === "readme.md" || name === "todo.md";
}

function includesReleaseAction(actions: string[]): boolean {
  return actions.map(normalizeAction).some((action) => RELEASE_ACTIONS.has(action));
}

function includesReleaseFile(files: string[]): boolean {
  return files.some((file) => /(^|\/)(release|prepare-release|publish|tag)(\/|[-_.A-Za-z0-9]*\.)/i.test(normalizePath(file)));
}

function chooseRequiredAction(violations: ScopeViolation[]): ScopeRequiredAction {
  if (violations.some((violation) => violation.required_action === "upgrade-to-maintenance-chain")) {
    return "upgrade-to-maintenance-chain";
  }
  if (violations.some((violation) => violation.required_action === "split-task")) {
    return "split-task";
  }
  if (violations.length > 0) {
    return "reroute-workflow";
  }
  return "continue";
}

function chooseRecommendedMode(mode: WorkflowMode, violations: ScopeViolation[], intent: string, actualFiles: string[], taskCount: number): WorkflowMode {
  const maintenance = violations.find((violation) => violation.recommended_mode === "maintenance-chain");
  if (maintenance) {
    return "maintenance-chain";
  }
  if (violations.length > 0) {
    return inferMode(intent, { files: actualFiles, taskCount }).mode;
  }
  return mode;
}

export function checkScope(options: ScopeCheckOptions): ScopeCheckResult {
  const plannedFiles = options.plannedFiles ?? [];
  const actualFiles = options.actualFiles ?? [];
  const taskCount = options.taskCount ?? 0;
  const featureCount = options.featureCount ?? 0;
  const actions = (options.actions ?? []).map(normalizeAction).filter(Boolean);
  const violations: ScopeViolation[] = [];

  if (options.mode === "docs-only" && actualFiles.some(isSourceTestOrTool)) {
    violations.push({
      id: "docs-only-scope-expanded",
      message: "docs-only work touched source, test, or tool files; reroute before continuing.",
      required_action: "reroute-workflow",
      recommended_mode: inferMode(options.intent, { files: actualFiles, taskCount }).mode,
      blocked_actions: ["continue-with-current-mode", "commit"],
    });
  }

  if (featureCount > 1 && taskCount <= 1) {
    violations.push({
      id: "multiple-features-detected",
      message: "a single task expanded into multiple independent features; split the task before continuing.",
      required_action: "split-task",
      recommended_mode: "full-chain",
      blocked_actions: ["continue-as-single-task", "commit"],
    });
  }

  const readmeTodoOnly = plannedFiles.length > 0 && plannedFiles.every((file) => isReadmeTodoPath(file) || isDocOrConfig(file));
  if (readmeTodoOnly && (includesReleaseAction(actions) || includesReleaseFile(actualFiles))) {
    violations.push({
      id: "release-scope-expanded",
      message: "README/TODO work expanded into release helper, tag, or publish scope; upgrade to maintenance-chain.",
      required_action: "upgrade-to-maintenance-chain",
      recommended_mode: "maintenance-chain",
      blocked_actions: ["continue-with-current-mode", "tag", "publish", "release"],
    });
  }

  const requiredAction = chooseRequiredAction(violations);
  const recommendedMode = chooseRecommendedMode(options.mode, violations, options.intent, actualFiles, taskCount);
  const blockedActions = [...new Set(violations.flatMap((violation) => violation.blocked_actions))];

  return {
    ok: violations.length === 0,
    mode: options.mode,
    recommended_mode: recommendedMode,
    required_action: requiredAction,
    planned_files: plannedFiles,
    actual_files: actualFiles,
    task_count: taskCount,
    feature_count: featureCount,
    actions,
    violations,
    blocked_actions: blockedActions,
  };
}
