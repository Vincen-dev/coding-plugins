#!/usr/bin/env node
import { resolve } from "node:path";
import { computeUpstreamHash, inspectDocumentChain } from "../../lib/workflow/workflow-state.js";
function parseArgs(argv) {
    const [command, ...rest] = argv;
    if (command !== "inspect" && command !== "hash") {
        throw new Error("command must be inspect or hash.");
    }
    const options = {
        command,
        root: ".",
        json: false,
    };
    for (let index = 0; index < rest.length; index += 1) {
        const arg = rest[index];
        if (arg === "--root") {
            options.root = requireValue(rest, index, arg);
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
    const feature = options.feature;
    const docId = options.docId;
    if (!feature || !docId) {
        throw new Error("--feature and --doc-id are required.");
    }
    if (options.command === "hash") {
        console.log(computeUpstreamHash(options.root, { feature, docId }) ?? "null");
    }
    else {
        const result = inspectDocumentChain(options.root, { feature, docId });
        if (options.json) {
            console.log(JSON.stringify(result, null, 2));
        }
        else {
            console.log(`state: ${result.state}`);
            console.log(`next_skill: ${result.next_skill}`);
            console.log(`reason: ${result.reason}`);
            console.log(`chain_hash: ${result.chain_hash ?? "null"}`);
            console.log(`plan_source_hash: ${result.plan_source_hash ?? "null"}`);
            console.log(`missing_artifacts: ${result.missing_artifacts.join(", ") || "-"}`);
        }
    }
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
}
