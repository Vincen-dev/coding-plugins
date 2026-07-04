#!/usr/bin/env node
import { resolve } from "node:path";
import { installPlatform } from "../../lib/platform/project-install.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parse(argv) {
    const options = {
        root: ".",
        dryRun: false,
        force: false,
        format: "text",
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            options.root = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--platform") {
            options.platform = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--dry-run") {
            options.dryRun = true;
        }
        else if (arg === "--force") {
            options.force = true;
        }
        else if (arg === "--format") {
            options.format = requireValue(argv, index, arg);
            index += 1;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (options.platform !== "cursor" && options.platform !== "copilot") {
        throw new Error("--platform must be cursor or copilot.");
    }
    options.root = resolve(options.root);
    return options;
}
try {
    const options = parse(process.argv.slice(2));
    const result = installPlatform(options.root, options.platform ?? "cursor", { dryRun: options.dryRun, force: options.force });
    if (options.format === "json") {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        console.log(`platform: ${result.platform}`);
        console.log(`dry_run: ${String(result.dry_run)}`);
        for (const file of result.files) {
            console.log(`file: ${file}`);
        }
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
