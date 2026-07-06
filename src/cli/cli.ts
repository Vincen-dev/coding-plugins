#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { cliStatus, findPluginRoot, installCliShim, type CliScope, uninstallCliShim } from "../lib/runtime/cli-shim.ts";

type Format = "text" | "json";

interface Options {
  command: string;
  scope: CliScope;
  target?: string;
  root: string;
  format: Format;
  force: boolean;
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

function parse(argv: string[]): Options {
  const command = argv[0];
  if (!command || command === "--help" || command === "-h") {
    return { command: "help", scope: "user", root: ".", format: "text", force: false };
  }
  const options: Options = {
    command,
    scope: "user",
    root: ".",
    format: "text",
    force: false,
  };
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--scope") {
      options.scope = requireValue(argv, index, arg) as CliScope;
      index += 1;
    } else if (arg === "--target") {
      options.target = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--root") {
      options.root = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--format") {
      options.format = requireValue(argv, index, arg) as Format;
      index += 1;
    } else if (arg === "--force") {
      options.force = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (options.scope !== "user" && options.scope !== "project") {
    throw new Error("--scope must be user or project.");
  }
  if (options.format !== "text" && options.format !== "json") {
    throw new Error("--format must be text or json.");
  }
  return options;
}

function print(value: unknown, format: Format): void {
  if (format === "json") {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      console.log(`${key}: ${Array.isArray(item) ? item.join(" ") : String(item)}`);
    }
  } else {
    console.log(String(value));
  }
}

function help(): void {
  console.log("Usage: coding-plugins cli <status|install|uninstall> [--scope user|project] [--target <path>] [--root <path>] [--format text|json] [--force]");
}

try {
  const options = parse(process.argv.slice(2));
  if (options.command === "help") {
    help();
    process.exit(0);
  }

  const pluginRoot = findPluginRoot(dirname(fileURLToPath(import.meta.url)));
  const common = {
    pluginRoot,
    target: options.target,
    scope: options.scope,
    root: resolve(options.root),
  };

  if (options.command === "status") {
    print(cliStatus(common), options.format);
  } else if (options.command === "install") {
    print(installCliShim({ ...common, force: options.force }), options.format);
  } else if (options.command === "uninstall") {
    print(uninstallCliShim(common), options.format);
  } else {
    throw new Error(`Unknown cli command: ${options.command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
