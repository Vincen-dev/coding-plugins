#!/usr/bin/env node
import { buildCompletionReport, formatCompletionReport } from "../lib/reports/completion-report.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parse(argv) {
    const command = argv[0];
    if (command !== "completion") {
        throw new Error("Usage: coding-plugins report completion [--kind task|release] [--json]");
    }
    const options = { command, json: false };
    for (let index = 1; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--kind") {
            options.kind = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--implemented") {
            options.implemented = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--verified") {
            options.verified = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--unverified") {
            options.unverified = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--local-only") {
            options.localOnly = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--committed") {
            options.committed = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--published") {
            options.published = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--workflow-run") {
            options.workflowRun = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--remote-tag") {
            options.remoteTag = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--package-visible") {
            options.packageVisible = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--commit-pushed") {
            options.commitPushed = true;
        }
        else if (arg === "--dependency-resolved") {
            options.dependencyResolved = true;
        }
        else if (arg === "--json") {
            options.json = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return options;
}
try {
    const options = parse(process.argv.slice(2));
    const report = buildCompletionReport(options);
    if (options.json) {
        console.log(JSON.stringify(report, null, 2));
    }
    else {
        console.log(formatCompletionReport(report));
    }
    process.exitCode = report.kind === "release" && !report.release_evidence.complete ? 1 : 0;
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
