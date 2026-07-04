#!/usr/bin/env node
import { resolveRoot, runAll, writeHarnessOutput } from "../lib/agent-pressure-harness.ts";

function parseArgs(argv: string[]): { root: string; json: boolean; output?: string } {
  const options: { root: string; json: boolean; output?: string } = { root: ".", json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--root requires a value.");
      }
      options.root = value;
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--output") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--output requires a value.");
      }
      options.output = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  options.root = resolveRoot(options.root);
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const payload = runAll(options.root);
  const jsonPayload = JSON.stringify(payload, null, 2);
  if (options.output) {
    writeHarnessOutput(payload, options.output);
  }
  if (options.json) {
    console.log(jsonPayload);
  } else {
    for (const caseData of payload.cases) {
      const status = caseData.scenario_passed ? "PASS" : "FAIL";
      console.log(`${status} ${caseData.id}: ${caseData.summary}`);
    }
  }
  process.exit(payload.cases.every((caseData: any) => caseData.scenario_passed) ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
