#!/usr/bin/env node
import { allDecisionPoints, getDecisionPoint } from "../../../src/lib/decision-points.ts";

function parseArgs(argv: string[]): { pointId?: string; json: boolean } {
  const options: { pointId?: string; json: boolean } = { json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--id") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--id requires a value.");
      }
      options.pointId = value;
      index += 1;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const payload = options.pointId ? getDecisionPoint(options.pointId) : allDecisionPoints();
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (Array.isArray(payload)) {
    for (const point of payload) {
      console.log(`${point.id} ${point.name}: ${point.trigger}`);
    }
  } else {
    console.log(`${payload.id} ${payload.name}`);
    console.log(`trigger: ${payload.trigger}`);
    console.log(`required_input: ${payload.required_input}`);
    console.log(`expected_output: ${payload.expected_output}`);
    console.log(`skills: ${(payload.skills as string[]).join(", ")}`);
  }
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
