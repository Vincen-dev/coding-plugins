#!/usr/bin/env node
import { resolve } from "node:path";

import { approveDecision, auditDecisions, getDecisionStatus, requestDecision } from "../../lib/workflow/decision-state.ts";
import type { DecisionAuditTarget } from "../../lib/workflow/decision-state.ts";

interface Options {
  command: "status" | "request" | "approve" | "audit";
  root: string;
  json: boolean;
  feature?: string;
  docId?: string;
  id?: string;
  reason?: string;
  target?: DecisionAuditTarget;
}

const TARGETS = new Set(["execute", "commit", "tag", "release", "publish"]);

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const [command, ...rest] = argv;
  if (command !== "status" && command !== "request" && command !== "approve" && command !== "audit") {
    throw new Error("Usage: coding-plugins dp <status|request|approve|audit> [options]");
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
    } else if (arg === "--id") {
      options.id = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--reason") {
      options.reason = requireValue(rest, index, arg);
      index += 1;
    } else if (arg === "--target") {
      const target = requireValue(rest, index, arg);
      if (!TARGETS.has(target)) {
        throw new Error(`invalid decision audit target: ${target}`);
      }
      options.target = target as DecisionAuditTarget;
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.feature || !options.docId) {
    throw new Error("dp requires --feature and --doc-id.");
  }
  if (options.command !== "audit" && !options.id) {
    throw new Error("dp status/request/approve require --id.");
  }
  if (options.command === "audit" && !options.target) {
    throw new Error("dp audit requires --target.");
  }
  options.root = resolve(options.root);
  return options;
}

function print(payload: unknown, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  const base = { feature: options.feature ?? "", docId: options.docId ?? "", id: options.id ?? "" };
  const payload = options.command === "status"
    ? getDecisionStatus(options.root, base)
    : options.command === "request"
      ? requestDecision(options.root, { ...base, reason: options.reason })
      : options.command === "approve"
        ? approveDecision(options.root, { ...base, reason: options.reason })
        : auditDecisions(options.root, { feature: options.feature ?? "", docId: options.docId ?? "", target: options.target ?? "execute" });
  print(payload, options.json);
  if ("ok" in Object(payload) && Object(payload).ok === false) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
