#!/usr/bin/env node
import { resolve } from "node:path";
import { checkState } from "../../lib/workflow/project-state.js";
import { inferMode } from "../../lib/workflow/workflow-mode.js";
import { inspectDocumentChain } from "../../lib/workflow/workflow-state.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parseArgs(argv) {
    const options = { root: ".", intent: "", json: false };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            options.root = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--intent") {
            options.intent = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--feature") {
            options.feature = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--doc-id") {
            options.docId = requireValue(argv, index, arg);
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
    return options;
}
function targetForState(state, intent) {
    if (state === "ready-for-execution" || /执行|execute|继续/i.test(intent)) {
        return "execute";
    }
    return "plan";
}
function buildNextCommand(options, mode, state) {
    if (state) {
        const target = targetForState(state.state, options.intent);
        const nextArgs = [
            "workflow-guard",
            "check",
            "--root",
            options.root,
            "--feature",
            state.feature,
            "--doc-id",
            state.doc_id,
            "--target",
            target,
        ];
        return { nextArgs, nextCommand: `coding-plugins ${nextArgs.join(" ")}` };
    }
    if (mode.mode === "analysis-only") {
        return { nextArgs: [], nextCommand: null };
    }
    const nextArgs = ["scaffold-feature-docs", "<feature-name>", "--title", "<title>", "--root", options.root];
    return { nextArgs, nextCommand: `coding-plugins ${nextArgs.join(" ")}` };
}
try {
    const options = parseArgs(process.argv.slice(2));
    const mode = inferMode(options.intent, { taskCount: options.feature ? 3 : 0 });
    const activeState = options.feature && options.docId ? null : checkState(options.root);
    const feature = options.feature ?? (activeState?.valid && activeState.feature ? activeState.feature : undefined);
    const docId = options.docId ?? (activeState?.valid && activeState.doc_id ? activeState.doc_id : undefined);
    const state = feature && docId ? inspectDocumentChain(options.root, { feature, docId }) : null;
    const stateMismatch = Boolean(activeState?.valid
        && state
        && activeState.feature === state.feature
        && activeState.doc_id === state.doc_id
        && activeState.state !== state.state);
    const warnings = stateMismatch
        ? [`project state '${activeState?.state}' differs from document chain state '${state?.state}' for ${feature}/${docId}; workflow-guard remains authoritative`]
        : [];
    const { nextArgs, nextCommand } = buildNextCommand(options, mode, state);
    const payload = {
        entrypoint: "coding-plugins start",
        conversation_judgment_allowed: false,
        reason: "routing must be derived from CLI state/schema checks before selecting skills",
        mode,
        project_state: activeState,
        state,
        state_mismatch: stateMismatch,
        warnings,
        next_skill: state?.next_skill ?? (mode.mode === "analysis-only" ? "using-coding-plugins" : "spec-driven-development"),
        next_command: nextCommand,
        next_args: nextArgs,
    };
    if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
    }
    else {
        console.log(`entrypoint: ${payload.entrypoint}`);
        console.log(`conversation_judgment_allowed: false`);
        console.log(`next_skill: ${payload.next_skill}`);
        console.log(`next_command: ${payload.next_command ?? "none"}`);
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
