#!/usr/bin/env node
import { buildPayload, formatTextResult, validateRepository } from "../../../src/lib/validate-technicals.ts";

interface Options {
  root: string;
  strict: boolean;
  format: "text" | "json";
  technicalFiles: string[];
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
    root: ".",
    strict: false,
    format: "text",
    technicalFiles: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      options.root = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--format") {
      const value = requireValue(argv, index, arg);
      if (value !== "text" && value !== "json") {
        throw new Error("--format must be text or json.");
      }
      options.format = value;
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    } else {
      options.technicalFiles.push(arg);
    }
  }

  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = validateRepository(options.root, {
    strict: options.strict,
    technicalFiles: options.technicalFiles.length > 0 ? options.technicalFiles : undefined,
  });

  if (options.format === "json") {
    console.log(JSON.stringify(buildPayload(result), null, 2));
  } else {
    console.log(formatTextResult(result));
  }
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
