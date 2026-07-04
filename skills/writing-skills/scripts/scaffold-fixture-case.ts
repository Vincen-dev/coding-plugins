#!/usr/bin/env node
import { resolve } from "node:path";

import { scaffoldFixtureCase } from "../../../src/lib/scaffold-fixture-case.ts";

type Options = {
  root?: string;
  feature?: string;
  docId?: string;
  title?: string;
  caseId?: string;
  sourceType?: string;
  sourceReference?: string;
  optimizationTarget?: string;
  coveredRisk?: string;
  currentDate?: string;
};

const ARG_MAP: Record<string, keyof Options> = {
  "--feature": "feature",
  "--doc-id": "docId",
  "--title": "title",
  "--case-id": "caseId",
  "--source-type": "sourceType",
  "--source-reference": "sourceReference",
  "--optimization-target": "optimizationTarget",
  "--covered-risk": "coveredRisk",
  "--date": "currentDate",
};

function parseArgs(argv: string[]): Required<Omit<Options, "currentDate">> & Pick<Options, "currentDate"> {
  const [root, ...rest] = argv;
  if (!root || root.startsWith("--")) {
    throw new Error("root path is required.");
  }
  const options: Options = { root };
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    const key = ARG_MAP[arg];
    if (!key) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    const value = rest[index + 1];
    if (!value) {
      throw new Error(`${arg} requires a value.`);
    }
    options[key] = value;
    index += 1;
  }
  for (const key of ["feature", "docId", "title", "caseId", "sourceType", "sourceReference", "optimizationTarget", "coveredRisk"] as const) {
    if (!options[key]) {
      throw new Error(`${key} is required.`);
    }
  }
  return {
    root: resolve(options.root ?? "."),
    feature: options.feature ?? "",
    docId: options.docId ?? "",
    title: options.title ?? "",
    caseId: options.caseId ?? "",
    sourceType: options.sourceType ?? "",
    sourceReference: options.sourceReference ?? "",
    optimizationTarget: options.optimizationTarget ?? "",
    coveredRisk: options.coveredRisk ?? "",
    currentDate: options.currentDate,
  };
}

try {
  const options = parseArgs(process.argv.slice(2));
  scaffoldFixtureCase(options.root, options);
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
