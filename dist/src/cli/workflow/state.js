#!/usr/bin/env node
import { resolve } from "node:path";
import { auditState, checkState, initState, transitionState } from "../../lib/workflow/project-state.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parseArgs(argv) {
    const [command, maybeTo, ...restAfterTo] = argv;
    if (!command || !["init", "check", "transition", "audit"].includes(command)) {
        throw new Error("Usage: coding-plugins state <init|check|transition|audit> [options]");
    }
    const rest = command === "transition" ? restAfterTo : argv.slice(1);
    const options = { command, root: ".", json: false, to: command === "transition" ? maybeTo : undefined };
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
        else if (arg === "--state") {
            options.state = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--workflow") {
            options.workflow = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--from") {
            options.from = requireValue(rest, index, arg);
            index += 1;
        }
        else if (arg === "--reason") {
            options.reason = requireValue(rest, index, arg);
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
function print(payload, json) {
    if (json) {
        console.log(JSON.stringify(payload, null, 2));
    }
    else {
        console.log(typeof payload === "string" ? payload : JSON.stringify(payload, null, 2));
    }
}
try {
    const options = parseArgs(process.argv.slice(2));
    if (options.command === "init") {
        if (!options.feature || !options.docId) {
            throw new Error("state init requires --feature and --doc-id.");
        }
        print(initState(options.root, { feature: options.feature, docId: options.docId, state: options.state, workflow: options.workflow }), options.json);
    }
    else if (options.command === "check") {
        print(checkState(options.root), options.json);
    }
    else if (options.command === "transition") {
        if (!options.to) {
            throw new Error("state transition requires a target state.");
        }
        print(transitionState(options.root, {
            to: options.to,
            from: options.from,
            reason: options.reason,
            feature: options.feature,
            docId: options.docId,
        }), options.json);
    }
    else {
        print(auditState(options.root), options.json);
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
