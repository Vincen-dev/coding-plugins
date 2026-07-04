import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkWorkflowGuard, VALID_TARGETS } from "./workflow-guard.ts";

export { VALID_TARGETS };

interface BriefOptions {
  feature: string;
  docId: string;
  target?: string;
  task?: string;
}

export interface WorkflowBriefPayload {
  pass: boolean;
  feature: string;
  doc_id: string;
  target: string;
  current_task?: string | null;
  state: string;
  reason: string;
  next_skill: string;
  failures: string[];
  must_read: string[];
  may_skip: string[];
  focus_sections: string[];
  task_headings: string[];
  execution_source: string;
  new_plan_policy: string;
}

export function extractTaskHeadings(text: string): string[] {
  const headings: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trim();
    if (stripped.startsWith("## ") && stripped.includes("TASK-")) {
      headings.push(stripped.slice("## ".length).trim());
    }
  }
  return headings;
}

export function buildBrief(root: string, options: BriefOptions): WorkflowBriefPayload {
  const target = options.target ?? "execute";
  if (!VALID_TARGETS.has(target)) {
    throw new Error(`invalid workflow guard target: ${target}`);
  }

  const guard = checkWorkflowGuard(root, {
    feature: options.feature,
    docId: options.docId,
    target,
  });
  const nextContext = guard.next_context;
  const mustRead = nextContext.must_read;

  let taskHeadings: string[] = [];
  if (mustRead.length > 0) {
    const planPath = join(root, mustRead[0]);
    if (existsSync(planPath)) {
      taskHeadings = extractTaskHeadings(readFileSync(planPath, "utf8"));
    }
  }

  const failures = [...guard.failures];
  const focusSections = [...nextContext.focus_sections];
  if (options.task) {
    taskHeadings = taskHeadings.filter((heading) => heading.includes(options.task ?? ""));
    if (taskHeadings.length > 0) {
      focusSections.push(...taskHeadings.map((heading) => `## ${heading}`));
    } else {
      failures.push(`requested task ${options.task} was not found`);
    }
  }

  return {
    pass: guard.pass && failures.length === 0,
    feature: options.feature,
    doc_id: options.docId,
    target,
    current_task: options.task ?? null,
    state: guard.state,
    reason: guard.reason,
    next_skill: guard.next_skill,
    failures,
    must_read: mustRead,
    may_skip: nextContext.may_skip,
    focus_sections: focusSections,
    task_headings: taskHeadings,
    execution_source: nextContext.execution_source,
    new_plan_policy: "create-new-ted",
  };
}

export function formatPlain(payload: WorkflowBriefPayload): string {
  const lines = [
    `State: ${payload.state}`,
    `Pass: ${String(payload.pass).toLowerCase()}`,
    `Reason: ${payload.reason}`,
    `Next skill: ${payload.next_skill}`,
    "Must read:",
  ];
  lines.push(...(payload.must_read.length > 0 ? payload.must_read : ["-"]).map((path) => `- ${path}`));
  lines.push("May skip unless rewind triggers fire:");
  lines.push(...(payload.may_skip.length > 0 ? payload.may_skip : ["-"]).map((path) => `- ${path}`));
  if (payload.task_headings.length > 0) {
    lines.push("Task chapters:");
    lines.push(...payload.task_headings.map((heading) => `- ${heading}`));
  }
  if (payload.failures.length > 0) {
    lines.push("Failures:");
    lines.push(...payload.failures.map((failure) => `- ${failure}`));
  }
  lines.push(`Execution source: ${payload.execution_source}`);
  lines.push(`New plan policy: ${payload.new_plan_policy}`);
  return lines.join("\n");
}
