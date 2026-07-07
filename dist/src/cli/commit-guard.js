#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { checkCommitGuard } from "../lib/git/commit-guard.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function csv(value) {
    return value.split(/[,\r\n]+/).map((item) => item.trim()).filter(Boolean);
}
function git(root, args) {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    return result.status === 0 ? result.stdout.trim() : undefined;
}
function parse(argv) {
    const options = {
        root: ".",
        allowMain: false,
        json: false,
    };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--root") {
            options.root = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--feature") {
            options.feature = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--doc-id") {
            options.docId = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--language") {
            const value = requireValue(argv, index, arg);
            if (value !== "zh" && value !== "en") {
                throw new Error("--language must be zh or en.");
            }
            options.language = value;
            index += 1;
        }
        else if (arg === "--author-name") {
            options.authorName = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--author-email") {
            options.authorEmail = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--branch") {
            options.branch = requireValue(argv, index, arg);
            index += 1;
        }
        else if (arg === "--changed-files") {
            options.changedFiles = csv(requireValue(argv, index, arg));
            index += 1;
        }
        else if (arg === "--allow-main") {
            options.allowMain = true;
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
function withGitDefaults(options) {
    const root = resolve(options.root);
    return {
        ...options,
        root,
        authorName: options.authorName ?? git(root, ["config", "user.name"]),
        authorEmail: options.authorEmail ?? git(root, ["config", "user.email"]),
        branch: options.branch ?? git(root, ["branch", "--show-current"]),
        changedFiles: options.changedFiles ?? csv(git(root, ["diff", "--name-only", "--cached"]) ?? ""),
    };
}
function printText(result) {
    console.log(`ok: ${String(result.ok)}`);
    console.log(`language_confirmed: ${String(result.language_confirmed)}`);
    console.log(`author_valid: ${String(result.author.valid)}`);
    console.log(`branch: ${result.branch ?? ""}`);
    for (const item of result.violations) {
        console.log(`violation: ${item.id}: ${item.message}`);
    }
}
try {
    const options = withGitDefaults(parse(process.argv.slice(2)));
    const result = checkCommitGuard({
        root: options.root,
        feature: options.feature,
        docId: options.docId,
        language: options.language,
        authorName: options.authorName,
        authorEmail: options.authorEmail,
        branch: options.branch,
        changedFiles: options.changedFiles,
        allowMain: options.allowMain,
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
