#!/usr/bin/env node
import { inferMode, VALID_MODES } from "../../../src/lib/workflow-mode.js";
function parseArgs(argv) {
    const options = {
        files: [],
        taskCount: 0,
        json: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--intent") {
            options.intent = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--files") {
            options.files = requireValue(argv, index, arg)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
            index += 1;
        }
        else if (arg === "--task-count") {
            const value = Number.parseInt(requireValue(argv, index, arg), 10);
            if (Number.isNaN(value)) {
                throw new Error("--task-count requires an integer.");
            }
            options.taskCount = value;
            index += 1;
        }
        else if (arg === "--mode") {
            options.explicitMode = requireValue(argv, index, arg);
            if (!VALID_MODES.has(options.explicitMode)) {
                throw new Error(`invalid workflow mode: ${options.explicitMode}`);
            }
            index += 1;
        }
        else if (arg === "--json") {
            options.json = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (!options.intent) {
        throw new Error("--intent is required.");
    }
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
    const result = inferMode(options.intent, {
        files: options.files,
        taskCount: options.taskCount,
        explicitMode: options.explicitMode,
    });
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(`mode: ${result.mode}`);
        console.log(`explicit: ${String(result.explicit).toLowerCase()}`);
        console.log(`reason: ${result.reason}`);
    }
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
}
