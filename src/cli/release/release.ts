#!/usr/bin/env node
import { planRelease, verifyRelease } from "../../lib/release/release-flow.ts";
import type { ReleaseCommand, ReleaseStatusInput } from "../../lib/release/release-flow.ts";

interface Options extends ReleaseStatusInput {
  command: ReleaseCommand;
  json: boolean;
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

function csv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parse(argv: string[]): Options {
  const command = argv[0] as ReleaseCommand | undefined;
  if (command !== "plan" && command !== "guard" && command !== "verify") {
    throw new Error("Usage: coding-plugins release <plan|guard|verify> [options]");
  }
  const options: Options = { command, json: false };
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--version") {
      options.version = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--packages") {
      options.packages = csv(requireValue(argv, index, arg));
      index += 1;
    } else if (arg === "--package-order") {
      options.packageOrder = csv(requireValue(argv, index, arg));
      index += 1;
    } else if (arg === "--commit-pushed") {
      options.releaseCommitPushed = true;
    } else if (arg === "--tag-pushed") {
      options.tagPushed = true;
    } else if (arg === "--workflow-ok") {
      options.workflowOk = true;
    } else if (arg === "--release-visible") {
      options.releaseVisible = true;
    } else if (arg === "--dependency-resolved") {
      options.dependencyResolved = true;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printText(result: ReturnType<typeof planRelease>): void {
  console.log(`ok: ${String(result.ok)}`);
  console.log(`command: ${result.command}`);
  console.log(`version: ${result.version ?? ""}`);
  console.log(`missing_standards: ${result.missing_standards.join(", ")}`);
  for (const violation of result.violations) {
    console.log(`violation: ${violation.id}: ${violation.message}`);
  }
}

try {
  const options = parse(process.argv.slice(2));
  const result = options.command === "plan"
    ? planRelease(options)
    : verifyRelease(options, options.command);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printText(result);
  }
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
