#!/usr/bin/env node
import { scaffoldFeature } from "../../../src/lib/scaffold-feature-docs.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function parseArgs(argv) {
    const options = {
        status: "draft",
        tags: [],
        root: ".",
        force: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--doc-id") {
            options.docId = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--title") {
            options.title = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--status") {
            options.status = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--date") {
            options.date = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--tag") {
            options.tags.push(requireValue(argv, index, arg));
            index += 1;
        }
        else if (arg === "--root") {
            options.root = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--force") {
            options.force = true;
        }
        else if (arg.startsWith("-")) {
            throw new Error(`Unknown argument: ${arg}`);
        }
        else if (!options.featureName) {
            options.featureName = arg;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    if (!options.featureName) {
        throw new Error("feature_name is required.");
    }
    if (!options.title) {
        throw new Error("--title is required.");
    }
    return options;
}
try {
    const options = parseArgs(process.argv.slice(2));
    if (!options.featureName || !options.title) {
        throw new Error("feature_name and --title are required.");
    }
    const result = scaffoldFeature(options.root, options.featureName, options.title, {
        docId: options.docId,
        status: options.status,
        currentDate: options.date,
        tags: options.tags.length > 0 ? options.tags : [options.featureName],
        force: options.force,
    });
    for (const path of result.created) {
        console.log(`created ${path}`);
    }
    for (const path of result.skipped) {
        console.log(`skipped existing ${path}`);
    }
    console.log("next: npm run preflight -- --write-index");
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message}`);
    process.exit(2);
}
