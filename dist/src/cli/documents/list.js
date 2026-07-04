#!/usr/bin/env node
import { resolve } from "node:path";
import { collectFeatureRoots, featureDocIds } from "../../lib/documents/document-metadata.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
try {
    let root = ".";
    let format = "text";
    const args = process.argv.slice(2);
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--root") {
            root = requireValue(args, index, arg);
            index += 1;
        }
        else if (arg === "--format") {
            format = requireValue(args, index, arg);
            index += 1;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    const resolved = resolve(root);
    const features = collectFeatureRoots(resolved).map((featureRoot) => ({
        feature: featureRoot.split(/[\\/]/).at(-1) ?? "",
        doc_ids: featureDocIds(featureRoot),
    }));
    if (format === "json") {
        console.log(JSON.stringify({ root: resolved, features }, null, 2));
    }
    else {
        for (const feature of features) {
            console.log(`${feature.feature}: ${feature.doc_ids.join(", ") || "-"}`);
        }
    }
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
