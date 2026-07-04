#!/usr/bin/env node
import { resolve } from "node:path";
import { buildBrief, formatPlain, VALID_TARGETS } from "../../lib/workflow/workflow-brief.js";
function parseArgs(argv) {
    const options = { root: ".", target: "execute", json: false };
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
        else if (arg === "--target") {
            options.target = requireValue(argv, index, arg);
            if (!VALID_TARGETS.has(options.target)) {
                throw new Error(`invalid workflow guard target: ${options.target}`);
            }
            index += 1;
        }
        else if (arg === "--task") {
            options.task = requireValue(argv, index, arg);
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
    const payload = buildBrief(options.root, {
        feature: options.feature ?? "",
        docId: options.docId ?? "",
        target: options.target,
        task: options.task,
    });
    if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
    }
    else {
        console.log(formatPlain(payload));
    }
    process.exit(payload.pass ? 0 : 1);
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
}
