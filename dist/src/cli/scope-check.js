#!/usr/bin/env node
import { checkScope } from "../lib/workflow/scope-check.js";
import { VALID_MODES } from "../lib/workflow/workflow-mode.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function csv(value) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}
function parse(argv) {
    const options = {
        intent: "",
        plannedFiles: [],
        actualFiles: [],
        taskCount: 0,
        featureCount: 0,
        actions: [],
        json: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--mode") {
            const value = requireValue(argv, index, arg);
            if (!VALID_MODES.has(value)) {
                throw new Error(`invalid workflow mode: ${value}`);
            }
            options.mode = value;
            index += 1;
        }
        else if (arg === "--intent") {
            options.intent = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--planned-files") {
            options.plannedFiles = csv(requireValue(argv, index, arg));
            index += 1;
        }
        else if (arg === "--actual-files") {
            options.actualFiles = csv(requireValue(argv, index, arg));
            index += 1;
        }
        else if (arg === "--task-count") {
            options.taskCount = Number.parseInt(requireValue(argv, index, arg), 10);
            if (Number.isNaN(options.taskCount)) {
                throw new Error("--task-count requires an integer.");
            }
            index += 1;
        }
        else if (arg === "--feature-count") {
            options.featureCount = Number.parseInt(requireValue(argv, index, arg), 10);
            if (Number.isNaN(options.featureCount)) {
                throw new Error("--feature-count requires an integer.");
            }
            index += 1;
        }
        else if (arg === "--actions") {
            options.actions = csv(requireValue(argv, index, arg));
            index += 1;
        }
        else if (arg === "--json") {
            options.json = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (!options.mode) {
        throw new Error("--mode is required.");
    }
    if (!options.intent) {
        throw new Error("--intent is required.");
    }
    return options;
}
function printText(result) {
    console.log(`ok: ${String(result.ok)}`);
    console.log(`mode: ${result.mode}`);
    console.log(`recommended_mode: ${result.recommended_mode}`);
    console.log(`required_action: ${result.required_action}`);
    for (const violation of result.violations) {
        console.log(`violation: ${violation.id}: ${violation.message}`);
    }
}
try {
    const options = parse(process.argv.slice(2));
    const mode = options.mode;
    if (!mode) {
        throw new Error("--mode is required.");
    }
    const result = checkScope({
        mode,
        intent: options.intent,
        plannedFiles: options.plannedFiles,
        actualFiles: options.actualFiles,
        taskCount: options.taskCount,
        featureCount: options.featureCount,
        actions: options.actions,
    });
    if (options.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        printText(result);
    }
    process.exitCode = result.ok ? 0 : 1;
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
