#!/usr/bin/env node
import { normalizePayload, readJsonFile, writePayload } from "../../lib/agents/agent-pressure-ingest.js";
function parseArgs(argv) {
    const options = {
        splitCases: false,
        casesDir: "agent-pressure-cases",
        fixtureManifest: false,
        pruneStale: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--input") {
            options.input = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--output") {
            options.output = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--split-cases") {
            options.splitCases = true;
        }
        else if (arg === "--cases-dir") {
            options.casesDir = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--fixture-manifest") {
            options.fixtureManifest = true;
        }
        else if (arg === "--run-id") {
            options.runId = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--source-contract") {
            options.sourceContract = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--prune-stale") {
            options.pruneStale = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (!options.input) {
        throw new Error("--input is required.");
    }
    if (!options.output) {
        throw new Error("--output is required.");
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
    const normalized = normalizePayload(readJsonFile(options.input ?? ""));
    writePayload(normalized, options.output ?? "", {
        splitCases: options.splitCases,
        casesDir: options.casesDir,
        fixtureManifest: options.fixtureManifest,
        runId: options.runId,
        sourceContract: options.sourceContract,
        pruneStale: options.pruneStale,
    });
    console.log(`ingested ${normalized.cases.length} cases -> ${options.output}`);
    process.exit(0);
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`agent pressure ingest failed: ${message}`);
    process.exit(1);
}
