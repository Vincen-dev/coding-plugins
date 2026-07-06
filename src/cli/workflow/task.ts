#!/usr/bin/env node
import { resolve } from "node:path";

import { buildTaskStatus } from "../../lib/workflow/task-status.ts";
import type { TaskAction } from "../../lib/workflow/task-status.ts";

interface Options {
  action: TaskAction;
  root: string;
  intent: string;
  feature?: string;
  docId?: string;
  json: boolean;
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const [action, ...rest] = argv;
  if (action !== "start" && action !== "continue" && action !== "status") {
    throw new Error("command must be start, continue, or status.");
  }
  const options: Options = { action, root: ".", intent: "", json: false };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--root") {
      options.root = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--intent") {
      options.intent = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--feature") {
      options.feature = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--doc-id") {
      options.docId = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  options.root = resolve(options.root);
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const payload = buildTaskStatus(options);
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`entrypoint: ${payload.entrypoint}`);
    console.log(`conversation_judgment_allowed: false`);
    console.log(`feature: ${payload.feature ?? "none"}`);
    console.log(`doc_id: ${payload.doc_id ?? "none"}`);
    console.log(`state: ${payload.state}`);
    console.log(`decision_point: ${payload.decision_point ?? "none"}`);
    console.log(`next_skill: ${payload.next_skill}`);
    console.log(`allowed_actions: ${payload.allowed_actions.join(", ") || "none"}`);
    console.log(`blocked_actions: ${payload.blocked_actions.join(", ") || "none"}`);
    console.log(`next_command: ${payload.next_command ?? "none"}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
