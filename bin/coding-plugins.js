#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [command, ...args] = process.argv.slice(2);
const registryScript = existsSync(resolve(root, "dist/src/lib/runtime/command-registry.js"))
  ? resolve(root, "dist/src/lib/runtime/command-registry.js")
  : resolve(root, "src/lib/runtime/command-registry.ts");
const { COMMAND_REGISTRY, commandByName } = await import(pathToFileURL(registryScript).href);

if (!command || command === "--help" || command === "-h") {
  console.log("Usage: coding-plugins <command> [args]");
  console.log("");
  console.log("Commands:");
  for (const entry of COMMAND_REGISTRY) {
    console.log(`  ${entry.usage}`);
  }
  process.exit(0);
}

const entry = commandByName(command);
if (!entry) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

function runtimeScript(path) {
  if (!path.endsWith(".ts")) {
    return resolve(root, path);
  }
  const compiled = resolve(root, "dist", path.replace(/\.ts$/, ".js"));
  return existsSync(compiled) ? compiled : resolve(root, path);
}

const result = spawnSync(process.execPath, [runtimeScript(entry.script), ...args], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
