import { checkState } from "./project-state.ts";
import { buildBrief } from "./workflow-brief.ts";
import type { WorkflowBriefPayload } from "./workflow-brief.ts";
import { checkWorkflowGuard } from "./workflow-guard.ts";
import type { WorkflowGuardResult } from "./workflow-guard.ts";
import { inferMode } from "./workflow-mode.ts";
import { inspectDocumentChain } from "./workflow-state.ts";
import type { WorkflowStateResult } from "./workflow-state.ts";

export type TaskAction = "start" | "continue" | "status";

export interface TaskStatusOptions {
  action: TaskAction;
  root: string;
  intent: string;
  feature?: string;
  docId?: string;
}

export interface TaskStatusPayload {
  entrypoint: string;
  action: TaskAction;
  conversation_judgment_allowed: false;
  reason: string;
  mode: ReturnType<typeof inferMode>;
  project_state: ReturnType<typeof checkState> | null;
  workflow_state: WorkflowStateResult | null;
  guard: WorkflowGuardResult | null;
  brief: WorkflowBriefPayload | null;
  feature: string | null;
  doc_id: string | null;
  state: string;
  allowed_actions: string[];
  blocked_actions: string[];
  next_skill: string;
  decision_point: string | null;
  next_command: string | null;
  next_args: string[];
  warnings: string[];
}

function targetForState(state: string, intent: string): "plan" | "execute" {
  if (state === "ready-for-execution" || /执行|execute|继续|continue/i.test(intent)) {
    return "execute";
  }
  return "plan";
}

function decisionPointForState(state: string): string | null {
  if (state === "analysis-only" || state === "unknown") {
    return null;
  }
  if (state === "not-started") {
    return "DP-0";
  }
  if (state === "requirements-missing" || state === "requirements-draft") {
    return "DP-1";
  }
  if (state === "ready-for-technicals" || state === "technicals-draft") {
    return "DP-2";
  }
  if (state === "ready-for-test-cases" || state === "test-cases-draft") {
    return "DP-3";
  }
  return "DP-4";
}

function actionsForState(state: string): Pick<TaskStatusPayload, "allowed_actions" | "blocked_actions"> {
  if (state === "ready-for-execution") {
    return {
      allowed_actions: ["workflow-guard:execute", "workflow-brief", "execute-ted"],
      blocked_actions: [],
    };
  }
  if (state === "ready-for-plan") {
    return {
      allowed_actions: ["workflow-guard:plan", "write-plan"],
      blocked_actions: ["workflow-guard:execute", "workflow-brief", "execute-ted"],
    };
  }
  if (state === "not-started") {
    return {
      allowed_actions: ["scaffold-feature-docs", "write-requirements"],
      blocked_actions: ["workflow-guard:plan", "workflow-guard:execute", "workflow-brief", "execute-ted"],
    };
  }
  if (state === "analysis-only") {
    return {
      allowed_actions: ["answer-directly"],
      blocked_actions: ["scaffold-feature-docs", "workflow-guard:plan", "workflow-guard:execute", "execute-ted"],
    };
  }
  if (state.endsWith("-draft") || state.endsWith("-missing")) {
    return {
      allowed_actions: ["revise-current-document", "validate"],
      blocked_actions: ["workflow-guard:plan", "workflow-guard:execute", "workflow-brief", "execute-ted"],
    };
  }
  if (state === "plan-unlocked" || state === "plan-stale") {
    return {
      allowed_actions: ["refresh-plan", "write-plan"],
      blocked_actions: ["workflow-guard:execute", "workflow-brief", "execute-ted"],
    };
  }
  return {
    allowed_actions: ["continue-document-chain"],
    blocked_actions: ["workflow-guard:execute", "workflow-brief", "execute-ted"],
  };
}

function nextForMissingChain(root: string, feature: string | null): Pick<TaskStatusPayload, "next_command" | "next_args"> {
  const featureName = feature ?? "<feature-name>";
  const nextArgs = ["scaffold-feature-docs", featureName, "--title", "<title>", "--root", root];
  return { next_command: `coding-plugins ${nextArgs.join(" ")}`, next_args: nextArgs };
}

function nextForState(
  root: string,
  intent: string,
  state: WorkflowStateResult | null,
  mode: ReturnType<typeof inferMode>,
): Pick<TaskStatusPayload, "next_command" | "next_args"> {
  if (state) {
    const target = targetForState(state.state, intent);
    if (state.state === "not-started") {
      return nextForMissingChain(root, state.feature);
    }
    const nextArgs = [
      "workflow-guard",
      "check",
      "--root",
      root,
      "--feature",
      state.feature,
      "--doc-id",
      state.doc_id,
      "--target",
      target,
    ];
    return { next_command: `coding-plugins ${nextArgs.join(" ")}`, next_args: nextArgs };
  }

  if (mode.mode === "analysis-only") {
    return { next_command: null, next_args: [] };
  }
  return nextForMissingChain(root, null);
}

export function buildTaskStatus(options: TaskStatusOptions): TaskStatusPayload {
  const projectState = options.feature && options.docId ? null : checkState(options.root);
  const feature = options.feature ?? (projectState?.valid && projectState.feature ? projectState.feature : undefined);
  const docId = options.docId ?? (projectState?.valid && projectState.doc_id ? projectState.doc_id : undefined);
  const mode = inferMode(options.intent, { taskCount: feature ? 3 : 0 });
  const workflowState = feature && docId ? inspectDocumentChain(options.root, { feature, docId }) : null;
  const stateName = workflowState?.state ?? (mode.mode === "analysis-only" ? "analysis-only" : "unknown");
  const stateMismatch = Boolean(
    projectState?.valid
      && workflowState
      && projectState.feature === workflowState.feature
      && projectState.doc_id === workflowState.doc_id
      && projectState.state !== workflowState.state,
  );
  const warnings = stateMismatch
    ? [
      `project state '${projectState?.state}' differs from document chain state '${workflowState?.state}' for ${feature}/${docId}; repair the document chain before continuing`,
    ]
    : [];
  const target = workflowState ? targetForState(workflowState.state, options.intent) : "plan";
  const guard = workflowState
    ? checkWorkflowGuard(options.root, { feature: workflowState.feature, docId: workflowState.doc_id, target })
    : null;
  const brief = guard?.pass
    ? buildBrief(options.root, { feature: guard.feature, docId: guard.doc_id, target: guard.target })
    : null;
  const actions = actionsForState(stateName);
  const next = stateMismatch
    ? { next_command: null, next_args: [] }
    : nextForState(options.root, options.intent, workflowState, mode);

  return {
    entrypoint: `coding-plugins task ${options.action}`,
    action: options.action,
    conversation_judgment_allowed: false,
    reason: "routing must be derived from unified CLI state/schema checks before selecting skills",
    mode,
    project_state: projectState,
    workflow_state: workflowState,
    guard,
    brief,
    feature: workflowState?.feature ?? feature ?? null,
    doc_id: workflowState?.doc_id ?? docId ?? null,
    state: stateName,
    allowed_actions: actions.allowed_actions,
    blocked_actions: stateMismatch ? [...actions.blocked_actions, "continue-with-stale-project-state"] : actions.blocked_actions,
    next_skill: workflowState?.next_skill ?? (mode.mode === "analysis-only" ? "using-coding-plugins" : "spec-driven-development"),
    decision_point: decisionPointForState(stateName),
    next_command: next.next_command,
    next_args: next.next_args,
    warnings,
  };
}
