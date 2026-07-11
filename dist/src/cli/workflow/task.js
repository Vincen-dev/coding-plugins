#!/usr/bin/env node
import { resolve } from "node:path";
import { buildTaskStatus, buildTaskStatusV2 } from "../../lib/workflow/task-status.js";
import { approveGovernedDecision, auditFormalCompletion } from "../../lib/workflow/governed-orchestrator.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parseArgs(argv) {
    const [action, ...rest] = argv;
    if (action !== "start" && action !== "continue" && action !== "status" && action !== "brief" && action !== "approve" && action !== "complete") {
        throw new Error("command must be start, continue, status, brief, approve, or complete.");
    }
    const options = { action, root: ".", intent: "", plannedFiles: [], contractVersion: "1", json: false };
    for (let index = 0; index < rest.length; index += 1) {
        const arg = rest[index];
        if (arg === "--root") {
            options.root = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--intent") {
            options.intent = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--feature") {
            options.feature = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--doc-id") {
            options.docId = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--change-id") {
            options.changeId = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--planned-file") {
            options.plannedFiles.push(requireValue(rest, index, arg));
            index += 1;
        }
        else if (arg === "--task-count") {
            options.taskCount = Number(requireValue(rest, index, arg));
            index += 1;
        }
        else if (arg === "--feature-count") {
            options.featureCount = Number(requireValue(rest, index, arg));
            index += 1;
        }
        else if (arg === "--id") {
            const value = requireValue(rest, index, arg);
            if (value !== "DP-1" && value !== "DP-2" && value !== "DP-3") {
                throw new Error("--id must be DP-1, DP-2, or DP-3 for the task facade.");
            }
            options.id = value;
            index += 1;
        }
        else if (arg === "--reason") {
            options.reason = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--contract-version") {
            const value = requireValue(rest, index, arg);
            if (value !== "1" && value !== "2") {
                throw new Error("--contract-version must be 1 or 2.");
            }
            options.contractVersion = value;
            index += 1;
        }
        else if (arg === "--json") {
            options.json = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    options.root = resolve(options.root);
    if ((options.action === "approve" || options.action === "complete") && (!options.feature || !options.docId)) {
        throw new Error(`task ${options.action} requires --feature and --doc-id.`);
    }
    if (options.action === "approve" && (!options.id || !options.reason)) {
        throw new Error("task approve requires --id and --reason.");
    }
    return options;
}
try {
    const options = parseArgs(process.argv.slice(2));
    if (options.action === "approve") {
        const result = approveGovernedDecision(options.root, {
            feature: options.feature ?? "",
            docId: options.docId ?? "",
            id: options.id ?? "DP-1",
            reason: options.reason ?? "",
        });
        const output = result.decision ?? result;
        console.log(JSON.stringify(output, null, 2));
        if (!result.ok) {
            process.exitCode = 1;
        }
    }
    else if (options.action === "complete") {
        const result = auditFormalCompletion(options.root, {
            feature: options.feature ?? "",
            docId: options.docId ?? "",
        });
        console.log(JSON.stringify(result, null, 2));
        if (!result.formalCompletionAllowed) {
            process.exitCode = 1;
        }
    }
    else {
        const payload = buildTaskStatus({
            ...options,
            action: options.action,
            plannedFiles: options.plannedFiles.length > 0 ? options.plannedFiles : undefined,
        });
        const output = options.contractVersion === "2" ? buildTaskStatusV2(payload) : payload;
        if (options.json) {
            console.log(JSON.stringify(output, null, 2));
        }
        else if (options.contractVersion === "2") {
            console.log(JSON.stringify(output, null, 2));
        }
        else {
            console.log(`entrypoint: ${payload.entrypoint}`);
            console.log(`conversation_judgment_allowed: false`);
            console.log(`feature: ${payload.feature ?? "none"}`);
            console.log(`doc_id: ${payload.doc_id ?? "none"}`);
            console.log(`state: ${payload.state}`);
            console.log(`decision_point: ${payload.decision_point ?? "none"}`);
            console.log(`next_skill: ${payload.next_skill}`);
            console.log(`allowed_actions: ${payload.allowed_actions.join(", ") || "none"}`);
            console.log(`blocked_actions: ${payload.blocked_actions.join(", ") || "none"}`);
            console.log(`next_command: ${payload.next_command ?? "none"}`);
            if (payload.action === "brief") {
                console.log(`required_skills: ${payload.task_brief.required_skills.join(", ") || "none"}`);
                console.log(`verification_requirements: ${payload.task_brief.verification_requirements.join(", ") || "none"}`);
            }
        }
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
