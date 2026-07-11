#!/usr/bin/env node
import { buildPayload, formatTextResults } from "../../../src/lib/validate-tdd-evidence.ts";
import type { ArtifactModeValue } from "../../../src/lib/documents/artifact-mode.ts";

interface Options {
  format: "text" | "json";
  strict: boolean;
  root: string;
  artifactMode?: ArtifactModeValue;
  evidenceFiles: string[];
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
    root: process.cwd(),
    evidenceFiles: [],
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
    } else if (arg === "--root") {
      options.root = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--artifact-mode") {
      const value = requireValue(argv, index, arg);
      if (value !== "tracked" && value !== "local" && value !== "external") {
        throw new Error("--artifact-mode must be tracked, local, or external.");
      }
      options.artifactMode = value;
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown argument: ${arg}`);
    } else {
      options.evidenceFiles.push(arg);
    }
  }

  if (options.evidenceFiles.length === 0) {
    throw new Error("at least one evidence file is required.");
  }
  return options;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const payload = buildPayload(options.evidenceFiles, {
    strict: options.strict,
    root: options.root,
    artifactMode: options.artifactMode,
  });
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
