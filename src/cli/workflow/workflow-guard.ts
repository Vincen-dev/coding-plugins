#!/usr/bin/env node
import { resolve } from "node:path";

import { checkWorkflowGuard, VALID_TARGETS } from "../../lib/workflow/workflow-guard.ts";

interface Options {
  command?: "check";
  root: string;
  feature?: string;
  docId?: string;
  target?: string;
  json: boolean;
}

function parseArgs(argv: string[]): Options {
  const [command, ...rest] = argv;
  if (command !== "check") {
    throw new Error("command must be check.");
  }
  const options: Options = { command, root: ".", json: false };

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
    } else if (arg === "--target") {
      options.target = requireValue(rest, index, arg);
      if (!VALID_TARGETS.has(options.target)) {
        throw new Error(`invalid workflow guard target: ${options.target}`);
      }
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.feature) {
    throw new Error("--feature is required.");
  }
  if (!options.docId) {
    throw new Error("--doc-id is required.");
  }
  if (!options.target) {
    throw new Error("--target is required.");
  }
  options.root = resolve(options.root);
  return options;
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = checkWorkflowGuard(options.root, {
    feature: options.feature ?? "",
    docId: options.docId ?? "",
    target: options.target ?? "",
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`pass: ${String(result.pass).toLowerCase()}`);
    console.log(`target: ${result.target}`);
    console.log(`state: ${result.state}`);
    console.log(`next_skill: ${result.next_skill}`);
    console.log(`reason: ${result.reason}`);
    if (result.failures.length > 0) {
      console.log("failures:");
      for (const failure of result.failures) {
        console.log(`- ${failure}`);
      }
    }
  }
  process.exit(result.pass ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
