#!/usr/bin/env node
import { resolve } from "node:path";

import { inferMode } from "../../lib/workflow/workflow-mode.ts";
import { inspectDocumentChain } from "../../lib/workflow/workflow-state.ts";

interface Options {
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
  const options: Options = { root: ".", intent: "", json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      options.root = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--intent") {
      options.intent = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--feature") {
      options.feature = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--doc-id") {
      options.docId = requireValue(argv, index, arg);
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

function targetForState(state: string, intent: string): "plan" | "execute" {
  if (state === "ready-for-execution" || /执行|execute|继续/i.test(intent)) {
    return "execute";
  }
  return "plan";
}

try {
  const options = parseArgs(process.argv.slice(2));
  const mode = inferMode(options.intent, { taskCount: options.feature ? 3 : 0 });
  const state = options.feature && options.docId ? inspectDocumentChain(options.root, { feature: options.feature, docId: options.docId }) : null;
  const target = state ? targetForState(state.state, options.intent) : null;
  const nextArgs =
    state && target
      ? [
          "workflow-guard",
          "check",
          "--root",
          options.root,
          "--feature",
          state.feature,
          "--doc-id",
          state.doc_id,
          "--target",
          target,
        ]
      : ["scaffold-feature-docs", "<feature-name>", "--title", "<title>", "--root", options.root];
  const nextCommand = `coding-plugins ${nextArgs.join(" ")}`;
  const payload = {
    entrypoint: "coding-plugins start",
    conversation_judgment_allowed: false,
    reason: "routing must be derived from CLI state/schema checks before selecting skills",
    mode,
    state,
    next_skill: state?.next_skill ?? (mode.mode === "analysis-only" ? "using-coding-plugins" : "spec-driven-development"),
    next_command: nextCommand,
    next_args: nextArgs,
  };
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`entrypoint: ${payload.entrypoint}`);
    console.log(`conversation_judgment_allowed: false`);
    console.log(`next_skill: ${payload.next_skill}`);
    console.log(`next_command: ${payload.next_command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
