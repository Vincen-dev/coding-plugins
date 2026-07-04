#!/usr/bin/env node
import {
  auditPushPermissions,
  auditRelease,
  auditTag,
  buildRemoteCommands,
  runJson,
  runText,
} from "../lib/remote-audit.ts";

interface Options {
  owner?: string;
  repo?: string;
  tag?: string;
  expectedPushers: string[];
  printCommandsJson: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { expectedPushers: [], printCommandsJson: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--owner") {
      options.owner = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--repo") {
      options.repo = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--tag") {
      options.tag = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--expected-pusher") {
      options.expectedPushers.push(requireValue(argv, index, arg));
      index += 1;
    } else if (arg === "--print-commands-json") {
      options.printCommandsJson = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  for (const field of ["owner", "repo", "tag"] as const) {
    if (!options[field]) {
      throw new Error(`--${field} is required.`);
    }
  }
  if (options.expectedPushers.length === 0) {
    throw new Error("--expected-pusher is required.");
  }
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
  const commands = buildRemoteCommands(options.owner ?? "", options.repo ?? "", options.tag ?? "");
  if (options.printCommandsJson) {
    console.log(JSON.stringify(commands, null, 2));
    process.exit(0);
  }

  const tagOutput = runText(commands[0]);
  const release = runJson(commands[1]);
  const collaborators = runJson(commands[2]);
  const protection = runJson(commands[3]);
  if (!Array.isArray(collaborators)) {
    throw new Error("Collaborator API response must be a list.");
  }
  auditTag(tagOutput, options.tag ?? "");
  const releaseSummary = auditRelease(release as Record<string, unknown>, options.tag ?? "");
  const pushers = auditPushPermissions(collaborators as Array<Record<string, unknown>>, new Set(options.expectedPushers));

  console.log(`Remote tag: ${options.tag}`);
  console.log(`GitHub Release: ${releaseSummary}`);
  console.log(`Direct push-capable collaborators: ${pushers.join(", ")}`);
  console.log(`Main protection queried: ${protection && typeof protection === "object" && !Array.isArray(protection) ? "yes" : "unknown"}`);
  console.log("Remote audit passed.");
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(`Remote audit failed: ${message}`);
  process.exit(1);
}
