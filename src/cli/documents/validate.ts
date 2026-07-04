#!/usr/bin/env node
import { resolve } from "node:path";

import { validateDocumentSchemas } from "../../lib/documents/document-schema.ts";

function requireValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${arg} requires a value.`);
  }
  return value;
}

try {
  let root = ".";
  let format = "text";
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--root") {
      root = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--format") {
      format = requireValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  const result = validateDocumentSchemas(resolve(root));
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`ok: ${String(result.ok)}`);
    console.log(`documents: ${result.documents.length}`);
    for (const error of result.errors) {
      console.log(`error: ${error}`);
    }
  }
  process.exit(result.ok ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
