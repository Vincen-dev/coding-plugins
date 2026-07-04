import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { inspectDocumentChain } from "./workflow-state.ts";
import type { WorkflowStateResult } from "./workflow-state.ts";

export const VALID_TARGETS = new Set(["plan", "execute"]);
const EXECUTION_LOCK_HEADING = "## 执行锁定区";
const EXECUTION_BRIEF_HEADING = "## 执行简报";
const TASK_OVERVIEW_HEADING = "## 任务总览";
const TASK_HEADING_RE = /^## .+（TASK-\d{3,} \/ REQ-\d{3,}）$/m;
const EXECUTION_LOCK_FIELDS = [
  "Intent Lock",
  "Scope Fence",
  "Required Spec IDs",
  "Required Tests",
  "Review Gates",
  "Rewind Triggers",
];
const UPSTREAM_SUFFIXES = ["PRD", "TSD", "TVD"] as const;
const NEW_PLAN_POLICY = "create a new TED for each new execution plan; do not append new plan tasks to an existing TED";

interface NextContext {
  must_read: string[];
  may_skip: string[];
  focus_sections: string[];
  execution_source: string;
  new_plan_policy: string;
}

export interface WorkflowGuardResult {
  pass: boolean;
  target: string;
  feature: string;
  doc_id: string;
  state: string;
  next_skill: string;
  reason: string;
  missing_artifacts: string[];
  stale: boolean;
  failures: string[];
  next_context: NextContext;
}

export function parseExecutionLock(text: string): Record<string, string> | null {
  let sectionStart = text.indexOf(`\n${EXECUTION_LOCK_HEADING}\n`);
  if (sectionStart === -1) {
    if (text.startsWith(`${EXECUTION_LOCK_HEADING}\n`)) {
      sectionStart = 0;
    } else {
      return null;
    }
  } else {
    sectionStart += 1;
  }

  const sectionBodyStart = sectionStart + EXECUTION_LOCK_HEADING.length + 1;
  const nextHeading = text.indexOf("\n## ", sectionBodyStart);
  const section = nextHeading === -1 ? text.slice(sectionBodyStart) : text.slice(sectionBodyStart, nextHeading);

  const fields: Record<string, string> = {};
  for (const line of section.split(/\r?\n/)) {
    const stripped = line.trim();
    if (!stripped.startsWith("- **") || !stripped.includes(":**")) {
      continue;
    }
    const fieldText = stripped.slice(4);
    const separator = fieldText.indexOf(":**");
    const label = fieldText.slice(0, separator).trim().replaceAll("*", "");
    const value = fieldText.slice(separator + ":**".length).trim();
    fields[label] = value;
  }
  return fields;
}

export function validateExecutionLock(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }
  const fields = parseExecutionLock(readFileSync(path, "utf8"));
  if (fields === null) {
    return ["TED execution lock section is missing"];
  }

  const missing = EXECUTION_LOCK_FIELDS.filter((field) => !fields[field]);
  if (missing.length > 0) {
    return [`TED execution lock is missing fields: ${missing.join(", ")}`];
  }

  const placeholders = EXECUTION_LOCK_FIELDS.filter((field) => fields[field].includes("<") || fields[field].includes(">"));
  if (placeholders.length > 0) {
    return [`TED execution lock has placeholder fields: ${placeholders.join(", ")}`];
  }

  return [];
}

export function validateExecutionSections(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }
  const text = readFileSync(path, "utf8");
  const failures = validateExecutionLock(path);
  if (!text.includes(EXECUTION_BRIEF_HEADING)) {
    failures.push("TED execution brief section is missing");
  }
  if (!text.includes(TASK_OVERVIEW_HEADING)) {
    failures.push("TED task overview section is missing");
  }
  if (!TASK_HEADING_RE.test(text)) {
    failures.push("TED task chapter is missing");
  }
  return failures;
}

export function buildNextContext(
  state: WorkflowStateResult,
  options: { target: string; passed: boolean },
): NextContext {
  const artifacts = state.artifacts;
  const upstreamPaths = UPSTREAM_SUFFIXES
    .filter((suffix) => artifacts[suffix].exists)
    .map((suffix) => artifacts[suffix].path);
  const tedPath = artifacts.TED.exists ? artifacts.TED.path : null;

  if (options.target === "execute" && options.passed && tedPath) {
    return {
      must_read: [tedPath],
      may_skip: upstreamPaths,
      focus_sections: ["## 执行简报", "## 执行锁定区", "## 任务总览", "## <任务标题>（TASK-001 / REQ-001）"],
      execution_source: "TED task chapters",
      new_plan_policy: NEW_PLAN_POLICY,
    };
  }

  return {
    must_read: upstreamPaths.filter(Boolean),
    may_skip: [],
    focus_sections: [],
    execution_source: "document chain",
    new_plan_policy: NEW_PLAN_POLICY,
  };
}

export function checkWorkflowGuard(
  root: string,
  options: { feature: string; docId: string; target: string },
): WorkflowGuardResult {
  if (!VALID_TARGETS.has(options.target)) {
    throw new Error(`invalid workflow guard target: ${options.target}`);
  }

  const state = inspectDocumentChain(root, { feature: options.feature, docId: options.docId });
  const allowedStates = options.target === "plan" ? new Set(["ready-for-plan"]) : new Set(["ready-for-execution"]);
  let passed = allowedStates.has(state.state) && !state.stale;
  const failures: string[] = [];

  if (options.target === "execute" && state.state === "ready-for-execution") {
    const tedPath = join(root, state.artifacts.TED.path);
    failures.push(...validateExecutionSections(tedPath));
    passed = passed && failures.length === 0;
  }

  if (!passed) {
    if (state.missing_artifacts.length > 0) {
      failures.push(`missing artifacts: ${state.missing_artifacts.join(", ")}`);
    }
    if (state.state === "plan-unlocked") {
      failures.push("TED source_hash is missing");
    }
    if (state.stale) {
      failures.push("TED source_hash is stale");
    }
    if (!allowedStates.has(state.state)) {
      failures.push(`state '${state.state}' cannot enter target '${options.target}'`);
    }
  }

  return {
    pass: passed,
    target: options.target,
    feature: options.feature,
    doc_id: options.docId,
    state: state.state,
    next_skill: state.next_skill,
    reason: state.reason,
    missing_artifacts: state.missing_artifacts,
    stale: state.stale,
    failures,
    next_context: buildNextContext(state, { target: options.target, passed }),
  };
}
