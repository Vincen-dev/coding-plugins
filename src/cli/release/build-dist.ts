#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { withBuildLock } from "../../lib/runtime/build-lock.ts";
import { findRepositoryRoot } from "../../lib/runtime/repository-root.ts";

function resolveRuntimeRoot(): string {
  const start = resolve(import.meta.dirname, "../../..");
  try {
    return findRepositoryRoot(start);
  } catch {
    return findRepositoryRoot(start, {
      requiredPaths: ["package.json", "skills", "dist"],
      errorMessage: "Unable to locate coding-plugins source or packaged runtime root.",
    });
  }
}

const root = resolveRuntimeRoot();
const dist = resolve(root, "dist");
const buildConfig = resolve(root, "tsconfig.build.json");
const typeScriptCompiler = resolve(root, "node_modules/typescript/bin/tsc");

function verifyPackagedDist(): void {
  const required = [resolve(dist, "index.js"), resolve(dist, "index.d.ts")];
  const missing = required.filter((path) => !existsSync(path));
  if (missing.length > 0) {
    throw new Error(`Cannot build from packaged runtime because build tooling is unavailable and dist is incomplete: ${missing.join(", ")}`);
  }
  console.log("dist is already packaged; source build tooling is unavailable in this install");
}

withBuildLock(root, () => {
  if (!existsSync(buildConfig) || !existsSync(typeScriptCompiler)) {
    verifyPackagedDist();
    return;
  }

  rmSync(dist, { recursive: true, force: true });

  const result = spawnSync(process.execPath, [typeScriptCompiler, "-p", buildConfig], {
    cwd: root,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  writeFileSync(
    resolve(dist, "index.js"),
    [
      'export { buildExecutionContract, renderExecutionContract } from "./src/lib/workflow/execution-contract.js";',
      'export { auditState, checkState, initState, transitionState } from "./src/lib/workflow/project-state.js";',
      'export { validateDocumentSchemas } from "./src/lib/documents/document-schema.js";',
      'export { inspectDocumentChain } from "./src/lib/workflow/workflow-state.js";',
      'export { checkWorkflowGuard } from "./src/lib/workflow/workflow-guard.js";',
      'export { buildTaskStatus } from "./src/lib/workflow/task-status.js";',
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    resolve(dist, "index.d.ts"),
    [
      'export { buildExecutionContract, renderExecutionContract } from "./src/lib/workflow/execution-contract.js";',
      'export { auditState, checkState, initState, transitionState } from "./src/lib/workflow/project-state.js";',
      'export { validateDocumentSchemas } from "./src/lib/documents/document-schema.js";',
      'export { inspectDocumentChain } from "./src/lib/workflow/workflow-state.js";',
      'export { checkWorkflowGuard } from "./src/lib/workflow/workflow-guard.js";',
      'export { buildTaskStatus } from "./src/lib/workflow/task-status.js";',
      "",
    ].join("\n"),
    "utf8",
  );

  console.log("Built dist JavaScript runtime and type declarations");
});
