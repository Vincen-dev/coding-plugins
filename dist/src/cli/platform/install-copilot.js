#!/usr/bin/env node
import { resolve } from "node:path";
import { installPlatform } from "../../lib/platform/project-install.js";
function value(argv, index, arg) {
    const result = argv[index + 1];
    if (!result) {
        throw new Error(`${arg} requires a value.`);
    }
    return result;
}
try {
    let root = ".";
    let format = "text";
    let force = false;
    for (let index = 0; index < process.argv.slice(2).length; index += 1) {
        const args = process.argv.slice(2);
        const arg = args[index];
        if (arg === "--root") {
            root = value(args, index, arg);
            index += 1;
        }
        else if (arg === "--format") {
            format = value(args, index, arg);
            index += 1;
        }
        else if (arg === "--force") {
            force = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    const result = installPlatform(resolve(root), "copilot", { force });
    console.log(format === "json" ? JSON.stringify(result, null, 2) : `installed: ${result.files.join(", ")}`);
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
