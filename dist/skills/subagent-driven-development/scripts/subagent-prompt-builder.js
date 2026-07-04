#!/usr/bin/env node
import { resolve } from "node:path";
import { buildPrompts, outputPayloadForKind, reviewInputFailures } from "../../../src/lib/subagent-prompt-builder.js";
function parseArgs(argv) {
    const options = {
        root: ".",
        kind: "all",
        implementerReport: "[待实现子代理回报后填入]",
        baseSha: "[commit before task]",
        headSha: "[current commit]",
        json: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            options.root = requireValue(argv, index, arg);
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
        else if (arg === "--task") {
            options.task = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--kind") {
            options.kind = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--workdir") {
            options.workdir = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--implementer-report") {
            options.implementerReport = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--base-sha") {
            options.baseSha = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--head-sha") {
            options.headSha = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--json") {
            options.json = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (!options.feature) {
        throw new Error("--feature is required.");
    }
    if (!options.docId) {
        throw new Error("--doc-id is required.");
    }
    if (!options.task) {
        throw new Error("--task is required.");
    }
    options.root = resolve(options.root);
    return options;
}
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
try {
    const options = parseArgs(process.argv.slice(2));
    const inputFailures = reviewInputFailures({
        kind: options.kind,
        json: options.json,
        implementerReport: options.implementerReport,
        baseSha: options.baseSha,
        headSha: options.headSha,
    });
    if (inputFailures.length > 0) {
        console.log(`ERROR: ${inputFailures.join("; ")}`);
        process.exit(1);
    }
    const payload = buildPrompts(options.root, {
        feature: options.feature ?? "",
        docId: options.docId ?? "",
        task: options.task ?? "",
        kind: options.kind,
        workdir: options.workdir,
        implementerReport: options.implementerReport,
        baseSha: options.baseSha,
        headSha: options.headSha,
    });
    if (options.json) {
        console.log(JSON.stringify(outputPayloadForKind(payload, options.kind), null, 2));
    }
    else if (options.kind === "all") {
        const summary = {
            feature: payload.feature,
            doc_id: payload.doc_id,
            task_id: payload.task_id,
            prompt_hashes: payload.prompt_hashes,
        };
        console.log(JSON.stringify(summary, null, 2));
    }
    else {
        console.log(payload.prompts[options.kind]);
    }
    process.exit(0);
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`ERROR: ${message}`);
    process.exit(1);
}
