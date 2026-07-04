#!/usr/bin/env node
import { resolve } from "node:path";

import { buildExecutionContract, writeExecutionContract } from "../../lib/workflow/execution-contract.ts";

interface Options {
  command: string;
  root: string;
  feature?: string;
  docId?: string;
  format: "text" | "json" | "markdown";
  write: boolean;
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const [command, ...rest] = argv;
  if (command !== "generate") {
    throw new Error("Usage: coding-plugins execution-contract generate --feature <name> --doc-id <id> [--root <path>] [--format text|json|markdown] [--write]");
  }
  const options: Options = { command, root: ".", format: "text", write: false };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--root") {
      options.root = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--feature") {
      options.feature = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--doc-id") {
      options.docId = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--format") {
      options.format = requireValue(rest, index, arg) as Options["format"];
      index += 1;
    } else if (arg === "--write") {
      options.write = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!["text", "json", "markdown"].includes(options.format)) {
    throw new Error("--format must be text, json, or markdown.");
  }
  if (!options.feature || !options.docId) {
    throw new Error("--feature and --doc-id are required.");
  }
  options.root = resolve(options.root);
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  let result = buildExecutionContract(options.root, { feature: options.feature ?? "", docId: options.docId ?? "" });
  if (options.write) {
    result = writeExecutionContract(options.root, result);
  }
  if (options.format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else if (options.format === "markdown") {
    console.log(result.markdown);
  } else {
    console.log(`path: ${result.path}`);
    console.log(`source_hash: ${result.contract.source_hash ?? "null"}`);
    console.log(`failures: ${result.failures.join("; ") || "-"}`);
  }
  process.exit(result.failures.length === 0 ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
