import { checkState } from "./project-state.js";
import { auditDecisions } from "./decision-state.js";
import { buildBrief } from "./workflow-brief.js";
import { checkWorkflowGuard } from "./workflow-guard.js";
import { evaluateWorkflowRuntime } from "./workflow-runtime.js";
import { inspectDocumentChain } from "./workflow-state.js";
import { restoreActiveChange } from "./active-change.js";
import { projectRouteDecisionV1 } from "./workflow-runtime.js";
function targetForState(state, intent) {
    void intent;
    if (state === "ready-for-execution") {
        return "execute";
    }
    return "plan";
}
function decisionPointForState(state) {
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
    if (state === "complete") {
        return "DP-6";
    }
    return "DP-4";
}
function actionsForState(state) {
    if (state === "complete") {
        return {
            allowed_actions: ["verify-completion", "request-commit-decision"],
            blocked_actions: [],
        };
    }
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
function nextForMissingChain(root, feature) {
    const featureName = feature ?? "<feature-name>";
    const nextArgs = ["scaffold-feature-docs", featureName, "--title", "<title>", "--root", root];
    return { next_command: `coding-plugins ${nextArgs.join(" ")}`, next_args: nextArgs };
}
function nextForState(root, intent, state, mode) {
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
function verificationRequirements(state) {
    const requirements = ["run-next-command-before-continuing"];
    if (state !== "analysis-only") {
        requirements.push("run-relevant-tests-before-completion", "record-tdd-evidence-or-exception");
    }
    requirements.push("use-verification-before-completion-before-claiming-done");
    return requirements;
}
function buildTaskBrief(payload) {
    const requiredSkills = ["using-coding-plugins"];
    if (payload.next_skill !== "using-coding-plugins") {
        requiredSkills.push(payload.next_skill);
    }
    const blockers = [
        ...(payload.decision_status?.missing_decisions ?? []).map((decision) => `${decision} approval required`),
        ...payload.warnings,
        ...payload.blocked_actions.filter((action) => action.startsWith("continue-with") || action.includes("stale")).map((action) => `blocked action: ${action}`),
    ];
    return {
        current_status: {
            feature: payload.feature,
            doc_id: payload.doc_id,
            state: payload.state,
            decision_point: payload.decision_point,
            next_skill: payload.next_skill,
            allowed_actions: payload.allowed_actions,
            blocked_actions: payload.blocked_actions,
        },
        required_skills: [...new Set(requiredSkills)],
        unique_next_step: Boolean(payload.next_command) && payload.next_args.length > 0,
        unique_next_command: payload.next_command,
        next_args: payload.next_args,
        blockers: [...new Set(blockers)],
        verification_requirements: verificationRequirements(payload.state),
        context_policy: payload.brief
            ? ["read-task-brief-first", "must-read-only-listed-documents", "skip-may-skip-documents-unless-rewind-trigger"]
            : ["read-task-brief-first", "do-not-reread-full-chain-unless-next-command-requires-it"],
    };
}
export function buildTaskStatus(options) {
    const activeChangeResult = restoreActiveChange(options.root, { changeId: options.changeId });
    const projectState = options.feature && options.docId ? null : checkState(options.root);
    const feature = options.feature ?? activeChangeResult.record?.feature ?? (projectState?.valid && projectState.feature ? projectState.feature : undefined);
    const docId = options.docId ?? activeChangeResult.record?.docId ?? (projectState?.valid && projectState.doc_id ? projectState.doc_id : undefined);
    const runtime = evaluateWorkflowRuntime(options.intent, {
        plannedFiles: options.plannedFiles,
        taskCount: options.taskCount ?? (feature ? 3 : undefined),
        featureCount: options.featureCount,
    });
    const workflowState = feature && docId ? inspectDocumentChain(options.root, { feature, docId }) : null;
    const formalRoute = Boolean(workflowState && runtime.decision.flow !== "inspect");
    const mode = formalRoute
        ? projectRouteDecisionV1({ ...runtime.decision, flow: "governed-change" })
        : runtime.v1;
    const stateName = workflowState?.state ?? (mode.mode === "analysis-only" ? "analysis-only" : "unknown");
    const stateMismatch = Boolean(projectState?.valid
        && workflowState
        && projectState.feature === workflowState.feature
        && projectState.doc_id === workflowState.doc_id
        && projectState.state !== workflowState.state);
    const warnings = stateMismatch
        ? [
            `project state '${projectState?.state}' differs from document chain state '${workflowState?.state}' for ${feature}/${docId}; repair the document chain before continuing`,
        ]
        : [];
    const target = workflowState ? targetForState(workflowState.state, options.intent) : "plan";
    const guard = workflowState && stateName !== "complete"
        ? checkWorkflowGuard(options.root, { feature: workflowState.feature, docId: workflowState.doc_id, target })
        : null;
    const decisionStatus = workflowState && target === "execute"
        ? auditDecisions(options.root, { feature: workflowState.feature, docId: workflowState.doc_id, target: "execute" })
        : null;
    const decisionBlocked = decisionStatus ? !decisionStatus.ok : false;
    const brief = guard?.pass && !decisionBlocked
        ? buildBrief(options.root, { feature: guard.feature, docId: guard.doc_id, target: guard.target })
        : null;
    const actions = actionsForState(stateName);
    const next = stateMismatch
        ? { next_command: null, next_args: [] }
        : decisionBlocked && workflowState
            ? {
                next_command: `coding-plugins dp request --root ${options.root} --feature ${workflowState.feature} --doc-id ${workflowState.doc_id} --id ${decisionStatus?.missing_decisions[0] ?? "DP-4"}`,
                next_args: [
                    "dp",
                    "request",
                    "--root",
                    options.root,
                    "--feature",
                    workflowState.feature,
                    "--doc-id",
                    workflowState.doc_id,
                    "--id",
                    decisionStatus?.missing_decisions[0] ?? "DP-4",
                ],
            }
            : nextForState(options.root, options.intent, workflowState, mode);
    const allowedActions = decisionBlocked
        ? [`request-decision:${decisionStatus?.missing_decisions[0] ?? "DP-4"}`]
        : actions.allowed_actions;
    const blockedActions = [
        ...(stateMismatch ? [...actions.blocked_actions, "continue-with-stale-project-state"] : actions.blocked_actions),
        ...(decisionBlocked ? ["workflow-guard:execute", "workflow-brief", "execute-ted"] : []),
    ];
    const routeDecision = formalRoute
        ? {
            ...runtime.decision,
            flow: "governed-change",
            state: stateName,
            scope: {
                ...runtime.decision.scope,
                relation: activeChangeResult.record ? "within-scope" : runtime.decision.scope.relation,
            },
            next: stateName === "complete"
                ? { action: "report-completion", skill: "verification-before-completion" }
                : {
                    action: decisionBlocked ? "request-approval" : stateName === "ready-for-execution" ? "execute-approved-plan" : "continue-governed-change",
                    skill: workflowState?.next_skill,
                    command: {
                        name: "task",
                        args: [
                            "continue",
                            "--root",
                            options.root,
                            "--feature",
                            workflowState?.feature ?? feature ?? "",
                            "--doc-id",
                            workflowState?.doc_id ?? docId ?? "",
                            "--contract-version",
                            "2",
                            "--json",
                        ],
                    },
                },
            allowedActions,
            blockedActions: [...new Set(blockedActions)],
        }
        : runtime.decision;
    const payload = {
        entrypoint: `coding-plugins task ${options.action}`,
        action: options.action,
        conversation_judgment_allowed: false,
        reason: "routing must be derived from unified CLI state/schema checks before selecting skills",
        mode,
        route_decision: routeDecision,
        active_change: activeChangeResult.record,
        project_state: projectState,
        workflow_state: workflowState,
        guard,
        brief,
        decision_status: decisionStatus,
        feature: workflowState?.feature ?? feature ?? null,
        doc_id: workflowState?.doc_id ?? docId ?? null,
        state: stateName,
        allowed_actions: [...new Set(allowedActions)],
        blocked_actions: [...new Set(blockedActions)],
        next_skill: workflowState?.next_skill ?? (mode.mode === "analysis-only" ? "using-coding-plugins" : "spec-driven-development"),
        decision_point: decisionPointForState(stateName),
        next_command: next.next_command,
        next_args: next.next_args,
        warnings,
    };
    return {
        ...payload,
        task_brief: buildTaskBrief(payload),
    };
}
export function buildTaskStatusV2(payload) {
    const blockers = [
        ...payload.task_brief.blockers,
        ...(payload.guard?.failures ?? []),
    ];
    return {
        ...payload.route_decision,
        context: {
            feature: payload.feature,
            docId: payload.doc_id,
            decisionPoint: payload.decision_point,
            currentTask: payload.brief?.current_task ?? null,
        },
        activeChange: payload.active_change,
        blockers: [...new Set(blockers)],
        warnings: [...payload.warnings],
    };
}
