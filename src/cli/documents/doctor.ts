#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { validateDocumentSchemas } from "../../lib/documents/document-schema.ts";

interface Check {
  name: string;
  ok: boolean;
  message: string;
}

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
  const resolved = resolve(root);
  const validation = validateDocumentSchemas(resolved);
  const checks: Check[] = [
    { name: "project-root", ok: existsSync(resolved), message: resolved },
    {
      name: "feature-docs",
      ok: existsSync(join(resolved, "docs/coding-plugins/features")),
      message: "docs/coding-plugins/features",
    },
    { name: "document-schema", ok: validation.ok, message: `${validation.documents.length} document(s)` },
    { name: "node-version", ok: Number(process.versions.node.split(".")[0]) >= 22, message: `Node.js ${process.versions.node}` },
  ];
  const payload = { ok: checks.every((check) => check.ok), root: resolved, checks };
  if (format === "json") {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    for (const check of checks) {
      console.log(`${check.ok ? "ok" : "fail"} ${check.name}: ${check.message}`);
    }
  }
  process.exit(payload.ok ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
