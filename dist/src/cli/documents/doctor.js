#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveArtifactMode } from "../../lib/documents/artifact-mode.js";
import { validateDocumentSchemas } from "../../lib/documents/document-schema.js";
import { cliStatus, findPluginRoot } from "../../lib/runtime/cli-shim.js";
import { checkCodexHookConfigDeclared, checkManifestVersions } from "../../lib/release/manifest-checks.js";
import { installPlatform } from "../../lib/platform/project-install.js";
import { checkState, STATE_FILE_NAME } from "../../lib/workflow/project-state.js";
function requireValue(argv, index, arg) {
    const value = argv[index + 1];
    if (!value) {
        throw new Error(`${arg} requires a value.`);
    }
    return value;
}
try {
    let root = ".";
    let codexHome = null;
    let format = "text";
    const requiredEnv = new Set();
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
        else if (arg === "--codex-home") {
            codexHome = requireValue(args, index, arg);
            index += 1;
        }
        else if (arg === "--require-env") {
            for (const item of parseRequiredEnvironment(requireValue(args, index, arg))) {
                requiredEnv.add(item);
            }
            index += 1;
        }
        else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    const resolved = resolve(root);
    const validation = validateDocumentSchemas(resolved);
    const packageJsonPath = join(resolved, "package.json");
    const packageLockPath = join(resolved, "package-lock.json");
    const isPluginRepository = existsSync(packageJsonPath) && existsSync(join(resolved, ".codex-plugin/plugin.json"));
    const checks = [];
    checks.push({ name: "project-root", ok: existsSync(resolved), message: resolved });
    checks.push({
        name: "feature-docs",
        ok: existsSync(join(resolved, "docs/coding-plugins/features")),
        message: "docs/coding-plugins/features",
    });
    checks.push({ name: "document-schema", ok: validation.ok, message: validation.ok ? `${validation.documents.length} document(s)` : validation.errors.join("; ") });
    checks.push({ name: "node-version", ok: Number(process.versions.node.split(".")[0]) >= 22, message: `Node.js ${process.versions.node}` });
    checks.push({ name: "path", ok: true, message: `PATH=${process.env.PATH ?? ""}` });
    const artifactMode = resolveArtifactMode(resolved);
    checks.push({
        name: "artifact-mode",
        ok: artifactMode.errors.length === 0,
        message: [
            `mode=${artifactMode.mode}`,
            `source=${artifactMode.source}`,
            `docs_ignored=${artifactMode.docs_ignored}`,
            `formal_evidence_allowed=${artifactMode.formal_evidence_allowed}`,
            artifactMode.external_reference ? `external_reference=${artifactMode.external_reference}` : null,
            artifactMode.errors.length > 0 ? `errors=${artifactMode.errors.join("|")}` : null,
        ].filter(Boolean).join("; "),
    });
    const runtimeStatus = cliStatus({ pluginRoot: findPluginRoot(dirname(fileURLToPath(import.meta.url))), root: resolved, threadId: null });
    checks.push({
        name: "cli-status",
        ok: runtimeStatus.session_lock.ok,
        message: [
            `cli_on_path=${runtimeStatus.cli_on_path}`,
            `path_command=${runtimeStatus.path_command ?? ""}`,
            `current_cli=${runtimeStatus.current_cli}`,
            `fallback=${runtimeStatus.fallback_command}`,
            `recommended_action=${runtimeStatus.recommended_action}`,
        ].join("; "),
    });
    checks.push({
        name: "session-lock",
        ok: runtimeStatus.session_lock.ok,
        message: [
            `path=${runtimeStatus.session_lock.path}`,
            `created=${runtimeStatus.session_lock.created}`,
            `version=${runtimeStatus.session_lock.lock.plugin_version}`,
            `plugin_root=${runtimeStatus.session_lock.lock.plugin_root}`,
            `cli_path=${runtimeStatus.session_lock.lock.cli_path}`,
            runtimeStatus.session_lock.lock.thread_id ? `thread_id=${runtimeStatus.session_lock.lock.thread_id}` : null,
            runtimeStatus.session_lock.errors.length > 0 ? `errors=${runtimeStatus.session_lock.errors.join("|")}` : null,
        ].filter(Boolean).join("; "),
    });
    checks.push(...environmentDiagnosticChecks(resolved, requiredEnv));
    if (isPluginRepository) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        const packageLock = existsSync(packageLockPath) ? JSON.parse(readFileSync(packageLockPath, "utf8")) : null;
        checks.push(runCheck("manifest-versions", () => {
            checkManifestVersions(resolved);
            return `version ${packageJson.version}`;
        }));
        checks.push({
            name: "package-lock-version",
            ok: Boolean(packageLock && packageLock.version === packageJson.version && packageLock.packages?.[""]?.version === packageJson.version),
            message: packageLock
                ? `package=${packageJson.version}; lock=${packageLock.version}; root=${packageLock.packages?.[""]?.version ?? ""}`
                : "package-lock.json is missing",
        });
        checks.push({
            name: "dist-entrypoints",
            ok: existsSync(join(resolved, "dist/index.js")) && existsSync(join(resolved, "dist/index.d.ts")),
            message: "dist/index.js, dist/index.d.ts",
        });
        checks.push(runCheck("codex-hook-config", () => {
            checkCodexHookConfigDeclared(resolved);
            return "./hooks/hooks-codex.json";
        }));
        const localSkillsCheck = checkLocalSkillsEntrypoint(resolved);
        const cursorCheck = runCheck("cursor-inject-dry-run", () => installPlatform(resolved, "cursor", { dryRun: true }).files.join(", "));
        const copilotCheck = runCheck("copilot-inject-dry-run", () => installPlatform(resolved, "copilot", { dryRun: true }).files.join(", "));
        let codexCacheCheck = null;
        let codexEnabledCheck = null;
        if (codexHome) {
            codexCacheCheck = checkCodexCacheVersion(resolve(codexHome), packageJson.version ?? "");
            codexEnabledCheck = checkCodexPluginEnabled(resolve(codexHome), packageJson.version ?? "");
        }
        checks.push(buildPlatformSummary(resolved, { codexCacheCheck, codexEnabledCheck, cursorCheck, copilotCheck, localSkillsCheck }));
        checks.push(localSkillsCheck);
        checks.push(checkWorkflowStateSource(resolved));
        checks.push(cursorCheck);
        checks.push(copilotCheck);
        if (codexHome) {
            checks.push(codexCacheCheck ?? checkCodexCacheVersion(resolve(codexHome), packageJson.version ?? ""));
            checks.push(codexEnabledCheck ?? checkCodexPluginEnabled(resolve(codexHome), packageJson.version ?? ""));
        }
    }
    const payload = { ok: checks.every((check) => check.ok), root: resolved, checks };
    if (format === "json") {
        console.log(JSON.stringify(payload, null, 2));
    }
    else {
        for (const check of checks) {
            console.log(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.message}`);
        }
    }
    process.exitCode = payload.ok ? 0 : 1;
}
catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}
function parseRequiredEnvironment(value) {
    return value.split(",").map((item) => item.trim()).filter(Boolean).map((item) => {
        const normalized = item.replace(/^env-/, "").replaceAll("_", "-");
        if (normalized === "fvm-dart-cache"
            || normalized === "build-runner"
            || normalized === "github-auth"
            || normalized === "pub-auth"
            || normalized === "ssh-host-key") {
            return normalized;
        }
        throw new Error(`Unknown required environment check: ${item}`);
    });
}
function requiredMessage(name, requiredEnv) {
    return `required=${requiredEnv.has(name) ? "true" : "false"}`;
}
function environmentDiagnosticChecks(root, requiredEnv) {
    const home = process.env.HOME ?? homedir();
    const pubspecPath = join(root, "pubspec.yaml");
    const pubspec = existsSync(pubspecPath) ? readFileSync(pubspecPath, "utf8") : "";
    const fvmConfig = [join(root, ".fvmrc"), join(root, ".fvm/fvm_config.json")].find((path) => existsSync(path));
    const fvmHome = process.env.FVM_HOME ?? join(home, ".fvm");
    const dartTool = join(root, ".dart_tool");
    const packageConfigPath = join(dartTool, "package_config.json");
    const buildRunnerDeclared = /\bbuild_runner\s*:/.test(pubspec);
    const ghHosts = join(home, ".config/gh/hosts.yml");
    const pubCredentials = join(home, ".pub-cache/credentials.json");
    const knownHosts = join(home, ".ssh/known_hosts");
    const knownHostsText = existsSync(knownHosts) ? readFileSync(knownHosts, "utf8") : "";
    const githubAuthAvailable = Boolean(process.env.GH_TOKEN || process.env.GITHUB_TOKEN) || existsSync(ghHosts);
    const pubAuthAvailable = existsSync(pubCredentials);
    const sshHostKeyAvailable = knownHostsText.includes("github.com");
    const buildRunnerPackageStatus = packageConfigIncludesPackage(packageConfigPath, "build_runner");
    const buildRunnerReady = !buildRunnerDeclared || buildRunnerPackageStatus === "present";
    const fvmReady = !fvmConfig || existsSync(fvmHome);
    return [
        {
            name: "env-fvm-dart-cache",
            ok: !requiredEnv.has("fvm-dart-cache") || fvmReady,
            message: [
                requiredMessage("fvm-dart-cache", requiredEnv),
                `fvm_config=${fvmConfig ?? "not-detected"}`,
                `FVM_HOME=${fvmHome}`,
                `PUB_CACHE=${process.env.PUB_CACHE ?? join(home, ".pub-cache")}`,
                fvmReady ? "status=ready-or-not-needed" : "status=install or warm FVM cache before Flutter verification",
            ].join("; "),
        },
        {
            name: "env-build-runner",
            ok: !requiredEnv.has("build-runner") || buildRunnerReady,
            message: [
                requiredMessage("build-runner", requiredEnv),
                `build_runner=${buildRunnerDeclared ? "declared" : "not-declared"}`,
                `.dart_tool=${existsSync(dartTool) ? "present" : "missing"}`,
                `package_config=${buildRunnerPackageStatus === "present" ? "build_runner" : buildRunnerPackageStatus === "missing" ? "missing" : "missing-build_runner"}`,
                buildRunnerReady ? "status=ready-or-not-needed" : "status=run dart pub get before build_runner verification",
            ].join("; "),
        },
        {
            name: "env-github-auth",
            ok: !requiredEnv.has("github-auth") || githubAuthAvailable,
            message: [
                requiredMessage("github-auth", requiredEnv),
                `GH_TOKEN=${process.env.GH_TOKEN || process.env.GITHUB_TOKEN ? "present" : "missing"}`,
                `gh_hosts=${existsSync(ghHosts) ? "present" : "missing"}`,
                githubAuthAvailable ? "status=available" : "status=run gh auth login or set GH_TOKEN",
            ].join("; "),
        },
        {
            name: "env-pub-auth",
            ok: !requiredEnv.has("pub-auth") || pubAuthAvailable,
            message: [
                requiredMessage("pub-auth", requiredEnv),
                `pub_credentials=${existsSync(pubCredentials) ? "present" : "missing"}`,
                `PUB_HOSTED_URL=${process.env.PUB_HOSTED_URL ?? "default"}`,
                pubAuthAvailable ? "status=available" : "status=run dart pub token add or dart pub login",
            ].join("; "),
        },
        {
            name: "env-ssh-host-key",
            ok: !requiredEnv.has("ssh-host-key") || sshHostKeyAvailable,
            message: [
                requiredMessage("ssh-host-key", requiredEnv),
                `known_hosts=${existsSync(knownHosts) ? "present" : "missing"}`,
                `github.com=${sshHostKeyAvailable ? "present" : "missing"}`,
                sshHostKeyAvailable ? "status=available" : "status=run ssh-keyscan github.com before SSH git operations",
            ].join("; "),
        },
    ];
}
function packageConfigIncludesPackage(path, packageName) {
    if (!existsSync(path)) {
        return "missing";
    }
    try {
        const parsed = JSON.parse(readFileSync(path, "utf8"));
        return parsed.packages?.some((item) => item.name === packageName) ? "present" : "missing-package";
    }
    catch {
        return "missing-package";
    }
}
function runCheck(name, fn) {
    try {
        return { name, ok: true, message: fn() };
    }
    catch (error) {
        return { name, ok: false, message: error instanceof Error ? error.message : String(error) };
    }
}
function checkLocalSkillsEntrypoint(root) {
    const path = join(root, ".agents/skills");
    if (!existsSync(path)) {
        return { name: "local-skills-entrypoint", ok: false, message: ".agents/skills is missing" };
    }
    if (statSync(path).isDirectory()) {
        return {
            name: "local-skills-entrypoint",
            ok: existsSync(join(path, "using-coding-plugins/SKILL.md")),
            message: ".agents/skills directory",
        };
    }
    const text = readFileSync(path, "utf8").trim();
    return {
        name: "local-skills-entrypoint",
        ok: text === "../skills" || existsSync(join(path, "using-coding-plugins/SKILL.md")),
        message: text === "../skills" ? ".agents/skills text fallback -> ../skills" : ".agents/skills directory",
    };
}
function checkWorkflowStateSource(root) {
    const path = join(root, STATE_FILE_NAME);
    if (!existsSync(path)) {
        return { name: "workflow-state-source", ok: true, message: `${STATE_FILE_NAME} not present; document chain remains source of truth` };
    }
    const checked = checkState(root);
    return {
        name: "workflow-state-source",
        ok: checked.valid,
        message: checked.valid
            ? `${STATE_FILE_NAME} active=${checked.feature}/${checked.doc_id}; workflows=${checked.workflows.length}`
            : checked.errors.join("; "),
    };
}
function buildPlatformSummary(root, checks) {
    const codexStatus = checks.codexCacheCheck || checks.codexEnabledCheck
        ? checks.codexCacheCheck?.ok && checks.codexEnabledCheck?.ok
            ? "ok"
            : checks.codexCacheCheck && !checks.codexCacheCheck.ok
                ? "stale"
                : "unavailable"
        : "not-checked";
    const claudeStatus = existsSync(join(root, ".claude-plugin/plugin.json")) ? "ok" : "missing";
    const geminiManifestPath = join(root, "gemini-extension.json");
    const geminiStatus = existsSync(geminiManifestPath)
        ? existsSync(join(root, String(JSON.parse(readFileSync(geminiManifestPath, "utf8")).contextFileName ?? "")))
            ? "ok"
            : "missing-context"
        : "missing";
    const cursorStatus = checks.cursorCheck.ok ? "dry-run-ok" : "dry-run-failed";
    const copilotStatus = checks.copilotCheck.ok ? "dry-run-ok" : "dry-run-failed";
    const localSkillsStatus = checks.localSkillsCheck.ok ? "ok" : "missing";
    const ok = [claudeStatus, geminiStatus, cursorStatus, copilotStatus, localSkillsStatus].every((status) => status === "ok" || status === "dry-run-ok") &&
        (codexStatus === "ok" || codexStatus === "not-checked");
    return {
        name: "platform-summary",
        ok,
        message: [
            `codex=${codexStatus}`,
            `claude=${claudeStatus}`,
            `gemini=${geminiStatus}`,
            `local-skills=${localSkillsStatus}`,
            `cursor=${cursorStatus}`,
            `copilot=${copilotStatus}`,
        ].join("; "),
    };
}
function checkCodexCacheVersion(codexHome, repositoryVersion) {
    const cacheRoot = join(codexHome, "plugins/cache/coding-plugins/coding-plugins");
    if (!existsSync(cacheRoot)) {
        return { name: "codex-cache-version", ok: false, message: `cache missing: ${cacheRoot}` };
    }
    const versions = readdirSync(cacheRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(compareSemver);
    const latest = versions.at(-1);
    if (!latest) {
        return { name: "codex-cache-version", ok: false, message: `cache has no versions: ${cacheRoot}` };
    }
    const manifestPath = join(cacheRoot, latest, ".codex-plugin/plugin.json");
    const cacheVersion = existsSync(manifestPath)
        ? String(JSON.parse(readFileSync(manifestPath, "utf8")).version ?? latest)
        : latest;
    if (versions.length > 1) {
        return {
            name: "codex-cache-version",
            ok: false,
            message: `mixed cache versions: repository=${repositoryVersion}; versions=${versions.join(",")}; latest=${cacheVersion}; cache_manifest=${manifestPath}`,
        };
    }
    return {
        name: "codex-cache-version",
        ok: cacheVersion === repositoryVersion,
        message: `repository=${repositoryVersion}; cache=${cacheVersion}; cache_manifest=${manifestPath}`,
    };
}
function checkCodexPluginEnabled(codexHome, repositoryVersion) {
    const listed = spawnSync("codex", ["plugin", "list", "--json"], {
        encoding: "utf8",
        timeout: 1_000,
        env: { ...process.env, CODEX_HOME: codexHome },
    });
    if (listed.status === 0 && listed.stdout.trim()) {
        try {
            const parsed = JSON.parse(extractJson(listed.stdout));
            const plugins = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.plugins)
                    ? (parsed.plugins)
                    : Array.isArray(parsed.installed)
                        ? (parsed.installed)
                        : [];
            const plugin = plugins.find((entry) => {
                const item = entry;
                return item.pluginId === "coding-plugins@coding-plugins"
                    || item.id === "coding-plugins@coding-plugins"
                    || (item.name === "coding-plugins" && item.marketplaceName === "coding-plugins");
            });
            if (!plugin) {
                return { name: "codex-plugin-enabled", ok: false, message: "coding-plugins@coding-plugins not listed by codex plugin list --json" };
            }
            const installed = plugin.installed !== false;
            const enabled = plugin.enabled === true;
            const version = String(plugin.version ?? "");
            return {
                name: "codex-plugin-enabled",
                ok: installed && enabled && version === repositoryVersion,
                message: `installed=${installed}; enabled=${enabled}; repository=${repositoryVersion}; version=${version}; source=codex plugin list --json`,
            };
        }
        catch (error) {
            return configTomlCodexPluginFallback(codexHome, repositoryVersion, `codex plugin list --json parse failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    const fallbackReason = listed.error?.message || listed.stderr.trim() || "codex plugin list --json unavailable";
    return configTomlCodexPluginFallback(codexHome, repositoryVersion, fallbackReason);
}
function extractJson(stdout) {
    const objectStart = stdout.indexOf("{");
    const arrayStart = stdout.indexOf("[");
    const starts = [objectStart, arrayStart].filter((index) => index >= 0).sort((left, right) => left - right);
    return starts.length > 0 ? stdout.slice(starts[0]) : stdout;
}
function configTomlCodexPluginFallback(codexHome, repositoryVersion, reason) {
    const configPath = join(codexHome, "config.toml");
    if (!existsSync(configPath)) {
        return { name: "codex-plugin-enabled", ok: false, message: `${reason}; config fallback missing: ${configPath}` };
    }
    const text = readFileSync(configPath, "utf8");
    const section = /\[plugins\."coding-plugins@coding-plugins"\]([\s\S]*?)(?:\n\[|$)/.exec(text)?.[1] ?? "";
    const enabled = /^\s*enabled\s*=\s*true\s*$/m.test(section);
    return {
        name: "codex-plugin-enabled",
        ok: enabled,
        message: `enabled=${enabled}; repository=${repositoryVersion}; source=config.toml fallback; reason=${reason}`,
    };
}
function compareSemver(left, right) {
    const leftParts = left.split(".").map((part) => Number(part));
    const rightParts = right.split(".").map((part) => Number(part));
    for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
        const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }
    return left.localeCompare(right);
}
