#!/usr/bin/env node
import { resolve } from "node:path";
import { migrateRoot } from "../../../src/lib/document-contract-migration.js";
function parseArgs(argv) {
    const options = { root: ".", dryRun: false };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            const value = argv[index + 1];
            if (!value) {
                throw new Error("--root requires a value.");
            }
            options.root = value;
            index += 1;
        }
        else if (arg === "--dry-run") {
            options.dryRun = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return { root: resolve(options.root), dryRun: options.dryRun };
}
try {
    const options = parseArgs(process.argv.slice(2));
    const changed = migrateRoot(options.root, { dryRun: options.dryRun });
    console.log(changed ? "Migration changes needed." : "Document contract is already current.");
    process.exit(0);
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
}
