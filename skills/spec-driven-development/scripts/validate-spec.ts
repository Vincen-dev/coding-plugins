#!/usr/bin/env node
import { buildPayload, formatTextResults } from "../../../src/lib/validate-spec.ts";

interface Options {
  format: "text" | "json";
  strict: boolean;
  specFiles: string[];
}

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    format: "text",
    strict: false,
    specFiles: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format") {
      const value = requireValue(argv, index, arg);
      if (value !== "text" && value !== "json") {
        throw new Error("--format must be text or json.");
      }
      options.format = value;
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--help" || arg === "-h") {
      throw new Error("Usage: validate-spec [--format text|json] [--strict] <spec-files...>");
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    } else {
      options.specFiles.push(arg);
    }
  }

  if (options.specFiles.length === 0) {
    throw new Error("at least one spec file is required.");
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const payload = buildPayload(options.specFiles, options.strict);
  if (options.format === "json") {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(formatTextResults(payload.results));
  }
  process.exitCode = payload.ok ? 0 : 1;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
