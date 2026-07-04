import { rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { withBuildLock } from "./build-lock.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

withBuildLock(root, () => {
  rmSync(dist, { recursive: true, force: true });

  const result = spawnSync(process.execPath, [resolve(root, "node_modules/typescript/bin/tsc"), "-p", resolve(root, "tsconfig.build.json")], {
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
      "",
    ].join("\n"),
    "utf8",
  );

  console.log("Built dist JavaScript runtime and type declarations");
});
