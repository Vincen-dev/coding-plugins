#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { validateDocumentSchemas } from "../../lib/documents/document-schema.ts";
import { checkCodexHookConfigDeclared, checkManifestVersions } from "../../lib/release/manifest-checks.ts";
import { installPlatform } from "../../lib/platform/project-install.ts";
import { checkState, STATE_FILE_NAME } from "../../lib/workflow/project-state.ts";

interface Check {
  name: string;
  ok: boolean;
  message: string;
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

try {
  let root = ".";
  let codexHome: string | null = null;
  let format = "text";
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--root") {
      root = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--format") {
      format = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--codex-home") {
      codexHome = requireValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  const resolved = resolve(root);
  const validation = validateDocumentSchemas(resolved);
  const packageJsonPath = join(resolved, "package.json");
  const packageLockPath = join(resolved, "package-lock.json");
  const isPluginRepository = existsSync(packageJsonPath) && existsSync(join(resolved, ".codex-plugin/plugin.json"));
  const checks: Check[] = [];
  checks.push({ name: "project-root", ok: existsSync(resolved), message: resolved });
  checks.push({
    name: "feature-docs",
    ok: existsSync(join(resolved, "docs/coding-plugins/features")),
    message: "docs/coding-plugins/features",
  });
  checks.push({ name: "document-schema", ok: validation.ok, message: validation.ok ? `${validation.documents.length} document(s)` : validation.errors.join("; ") });
  checks.push({ name: "node-version", ok: Number(process.versions.node.split(".")[0]) >= 22, message: `Node.js ${process.versions.node}` });

  if (isPluginRepository) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
    const packageLock = existsSync(packageLockPath) ? (JSON.parse(readFileSync(packageLockPath, "utf8")) as { version?: string; packages?: Record<string, { version?: string }> }) : null;
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
    checks.push(checkLocalSkillsEntrypoint(resolved));
    checks.push(checkWorkflowStateSource(resolved));
    checks.push(runCheck("cursor-inject-dry-run", () => installPlatform(resolved, "cursor", { dryRun: true }).files.join(", ")));
    checks.push(runCheck("copilot-inject-dry-run", () => installPlatform(resolved, "copilot", { dryRun: true }).files.join(", ")));

    if (codexHome) {
      checks.push(checkCodexCacheVersion(resolve(codexHome), packageJson.version ?? ""));
      checks.push(checkCodexPluginEnabled(resolve(codexHome), packageJson.version ?? ""));
    }
  }
  const payload = { ok: checks.every((check) => check.ok), root: resolved, checks };
  if (format === "json") {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const check of checks) {
      console.log(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.message}`);
    }
  }
  process.exitCode = payload.ok ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function runCheck(name: string, fn: () => string): Check {
  try {
    return { name, ok: true, message: fn() };
  } catch (error) {
    return { name, ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function checkLocalSkillsEntrypoint(root: string): Check {
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

function checkWorkflowStateSource(root: string): Check {
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

function checkCodexCacheVersion(codexHome: string, repositoryVersion: string): Check {
  const cacheRoot = join(codexHome, "plugins/cache/personal/coding-plugins");
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
    ? String((JSON.parse(readFileSync(manifestPath, "utf8")) as { version?: string }).version ?? latest)
    : latest;
  return {
    name: "codex-cache-version",
    ok: cacheVersion === repositoryVersion,
    message: `repository=${repositoryVersion}; cache=${cacheVersion}; cache_path=${manifestPath}`,
  };
}

function checkCodexPluginEnabled(codexHome: string, repositoryVersion: string): Check {
  const listed = spawnSync("codex", ["plugin", "list", "--json"], {
    encoding: "utf8",
    timeout: 1_000,
    env: { ...process.env, CODEX_HOME: codexHome },
  });
  if (listed.status === 0 && listed.stdout.trim()) {
    try {
      const parsed = JSON.parse(extractJson(listed.stdout)) as unknown;
      const plugins = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { plugins?: unknown[] }).plugins)
          ? ((parsed as { plugins: unknown[] }).plugins)
          : Array.isArray((parsed as { installed?: unknown[] }).installed)
            ? ((parsed as { installed: unknown[] }).installed)
          : [];
      const plugin = plugins.find((entry) => {
        const item = entry as { pluginId?: string; id?: string; name?: string };
        return [item.pluginId, item.id, item.name].some((value) => value === "coding-plugins@personal" || value === "coding-plugins");
      }) as { version?: string; installed?: boolean; enabled?: boolean; pluginId?: string; id?: string; name?: string } | undefined;
      if (!plugin) {
        return { name: "codex-plugin-enabled", ok: false, message: "coding-plugins@personal not listed by codex plugin list --json" };
      }
      const installed = plugin.installed !== false;
      const enabled = plugin.enabled === true;
      const version = String(plugin.version ?? "");
      return {
        name: "codex-plugin-enabled",
        ok: installed && enabled && version === repositoryVersion,
        message: `installed=${installed}; enabled=${enabled}; repository=${repositoryVersion}; active=${version}; source=codex plugin list --json`,
      };
    } catch (error) {
      return configTomlCodexPluginFallback(codexHome, repositoryVersion, `codex plugin list --json parse failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const fallbackReason = listed.error?.message || listed.stderr.trim() || "codex plugin list --json unavailable";
  return configTomlCodexPluginFallback(codexHome, repositoryVersion, fallbackReason);
}

function extractJson(stdout: string): string {
  const objectStart = stdout.indexOf("{");
  const arrayStart = stdout.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0).sort((left, right) => left - right);
  return starts.length > 0 ? stdout.slice(starts[0]) : stdout;
}

function configTomlCodexPluginFallback(codexHome: string, repositoryVersion: string, reason: string): Check {
  const configPath = join(codexHome, "config.toml");
  if (!existsSync(configPath)) {
    return { name: "codex-plugin-enabled", ok: false, message: `${reason}; config fallback missing: ${configPath}` };
  }
  const text = readFileSync(configPath, "utf8");
  const section = /\[plugins\."coding-plugins@personal"\]([\s\S]*?)(?:\n\[|$)/.exec(text)?.[1] ?? "";
  const enabled = /^\s*enabled\s*=\s*true\s*$/m.test(section);
  return {
    name: "codex-plugin-enabled",
    ok: enabled,
    message: `enabled=${enabled}; repository=${repositoryVersion}; source=config.toml fallback; reason=${reason}`,
  };
}

function compareSemver(left: string, right: string): number {
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
