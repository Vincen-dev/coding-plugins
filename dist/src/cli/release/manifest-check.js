#!/usr/bin/env node
import { resolve } from "node:path";
import { checkAllManifests } from "../../lib/release/manifest-checks.js";
function parseArgs(argv) {
    let root = ".";
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            const value = argv[index + 1];
            if (!value) {
                throw new Error("--root requires a path.");
            }
            root = value;
            index += 1;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return { root: resolve(root) };
}
try {
    const options = parseArgs(process.argv.slice(2));
    checkAllManifests(options.root);
    console.log("Manifest checks passed");
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Manifest checks failed: ${message}`);
    process.exit(1);
}
