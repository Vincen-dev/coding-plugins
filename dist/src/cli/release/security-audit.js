#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
function packFiles(root) {
    const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, NPM_CONFIG_CACHE: "/private/tmp/codex-npm-cache", npm_config_cache: "/private/tmp/codex-npm-cache" },
    });
    if (result.status !== 0) {
        throw new Error(result.stderr || "npm pack --dry-run failed");
    }
    const payload = JSON.parse(result.stdout);
    return payload[0]?.files.map((file) => file.path) ?? [];
}
function runCommand(command, args, root) {
    const result = spawnSync(command, args, {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, NPM_CONFIG_CACHE: "/private/tmp/codex-npm-cache", npm_config_cache: "/private/tmp/codex-npm-cache" },
    });
    return {
        name: `${command} ${args.join(" ")}`,
        ok: result.status === 0,
        message: result.status === 0 ? "passed" : [result.stdout, result.stderr].filter(Boolean).join("\n") || `exit code ${result.status ?? 1}`,
    };
}
try {
    let root = ".";
    let format = "text";
    let strictRelease = false;
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
        else if (arg === "--strict-release") {
            strictRelease = true;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    const resolved = resolve(root);
    const strictChecks = strictRelease
        ? [
            runCommand("npm", ["run", "build"], resolved),
            runCommand("npm", ["run", "preflight"], resolved),
        ]
        : [];
    const strictFailure = strictChecks.find((check) => !check.ok);
    if (strictFailure) {
        const payload = { ok: false, root: resolved, publish: "not-executed", npm_publish: "manual-only-after-security-audit", checks: strictChecks };
        if (format === "json") {
            console.log(JSON.stringify(payload, null, 2));
        }
        else {
            for (const check of strictChecks) {
                console.log(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.message}`);
            }
            console.log("publish: not-executed");
        }
        process.exit(1);
    }
    const packageJson = JSON.parse(readFileSync(join(resolved, "package.json"), "utf8"));
    const releaseWorkflow = existsSync(join(resolved, ".github/workflows/release.yml"))
        ? readFileSync(join(resolved, ".github/workflows/release.yml"), "utf8")
        : "";
    const files = packFiles(resolved);
    const textFiles = files.filter((file) => !file.endsWith(".png") && existsSync(join(resolved, file)));
    const secretPattern = /(AKIA[0-9A-Z]{16}|BEGIN (?:RSA|OPENSSH|EC|PRIVATE) KEY|npm_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,})/;
    const secretHits = textFiles.filter((file) => secretPattern.test(readFileSync(join(resolved, file), "utf8")));
    const checks = [
        ...strictChecks,
        { name: "dist-index-js", ok: existsSync(join(resolved, "dist/index.js")), message: "dist/index.js" },
        { name: "dist-index-types", ok: existsSync(join(resolved, "dist/index.d.ts")), message: "dist/index.d.ts" },
        { name: "package-main", ok: packageJson.main === "./dist/index.js", message: String(packageJson.main ?? "") },
        { name: "package-types", ok: packageJson.types === "./dist/index.d.ts", message: String(packageJson.types ?? "") },
        { name: "npm-publish-boundary", ok: !releaseWorkflow.includes("npm publish"), message: "release workflow must not publish automatically" },
        { name: "pack-secrets", ok: secretHits.length === 0, message: secretHits.join(", ") || "no secret-like tokens in pack files" },
        { name: "env-files", ok: files.every((file) => !/(^|\/)\.env(\.|$)/.test(file)), message: "no .env files in npm pack" },
    ];
    const payload = { ok: checks.every((check) => check.ok), root: resolved, publish: "not-executed", npm_publish: "manual-only-after-security-audit", checks };
    if (format === "json") {
        console.log(JSON.stringify(payload, null, 2));
    }
    else {
        for (const check of checks) {
            console.log(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.message}`);
        }
        console.log("publish: not-executed");
    }
    process.exit(payload.ok ? 0 : 1);
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
