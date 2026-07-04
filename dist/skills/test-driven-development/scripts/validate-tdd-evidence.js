#!/usr/bin/env node
import { buildPayload, formatTextResults } from "../../../src/lib/validate-tdd-evidence.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parseArgs(argv) {
    const options = {
        format: "text",
        strict: false,
        evidenceFiles: [],
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--format") {
            const value = requireValue(argv, index, arg);
            if (value !== "text" && value !== "json") {
                throw new Error("--format must be text or json.");
            }
            options.format = value;
            index += 1;
        }
        else if (arg === "--strict") {
            options.strict = true;
        }
        else if (arg.startsWith("-")) {
            throw new Error(`Unknown argument: ${arg}`);
        }
        else {
            options.evidenceFiles.push(arg);
        }
    }
    if (options.evidenceFiles.length === 0) {
        throw new Error("at least one evidence file is required.");
    }
    return options;
}
try {
    const options = parseArgs(process.argv.slice(2));
    const payload = buildPayload(options.evidenceFiles, options.strict);
    if (options.format === "json") {
        console.log(JSON.stringify(payload, null, 2));
    }
    else {
        console.log(formatTextResults(payload.results));
    }
    process.exitCode = payload.ok ? 0 : 1;
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
}
