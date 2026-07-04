#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [command, ...args] = process.argv.slice(2);

const commands = {
  "agent-pressure-harness": "src/cli/agent-pressure-harness.ts",
  "agent-pressure-ingest": "src/cli/agent-pressure-ingest.ts",
  "bump-version": "src/cli/bump-version.ts",
  "decision-points": "skills/using-coding-plugins/scripts/decision-points.ts",
  "document-contract-migration": "skills/document-metadata/scripts/document-contract-migration.ts",
  "manifest-check": "src/cli/manifest-check.ts",
  "preflight": "src/cli/preflight.ts",
  "prepare-release": "src/cli/prepare-release.ts",
  "remote-audit": "src/cli/remote-audit.ts",
  "scaffold-feature-docs": "skills/spec-driven-development/scripts/scaffold-feature-docs.ts",
  "scaffold-fixture-case": "skills/writing-skills/scripts/scaffold-fixture-case.ts",
  "subagent-prompt-builder": "skills/subagent-driven-development/scripts/subagent-prompt-builder.ts",
  "validate-spec": "skills/spec-driven-development/scripts/validate-spec.ts",
  "validate-technicals": "skills/writing-technicals/scripts/validate-technicals.ts",
  "validate-tdd-evidence": "skills/test-driven-development/scripts/validate-tdd-evidence.ts",
  "workflow-brief": "src/cli/workflow-brief.ts",
  "workflow-guard": "src/cli/workflow-guard.ts",
  "workflow-mode": "skills/using-coding-plugins/scripts/workflow-mode.ts",
  "workflow-state": "src/cli/workflow-state.ts",
};

if (!command || command === "--help" || command === "-h") {
  console.log("Usage: coding-plugins <command> [args]");
  console.log("");
  console.log("Commands:");
  console.log("  agent-pressure-harness [--root <path>] [--json] [--output <artifact.json>]");
  console.log("  agent-pressure-ingest --input <raw.json> --output <artifact.json> [--split-cases]");
  console.log("  bump-version <version> [--root <path>]");
  console.log("  decision-points [--id <DP-n>] [--json]");
  console.log("  document-contract-migration [--root <path>] [--dry-run]");
  console.log("  manifest-check [--root <path>]");
  console.log("  preflight [--write-index] [--check-external-references]");
  console.log("  prepare-release [--root <path>] [--version <version>]");
  console.log("  remote-audit --owner <owner> --repo <repo> --tag <tag> --expected-pusher <login>");
  console.log("  scaffold-feature-docs <feature-name> --title <title> [--doc-id <id>] [--root <path>]");
  console.log("  scaffold-fixture-case <root> --feature <name> --doc-id <id> --title <title> ...");
  console.log("  subagent-prompt-builder --feature <name> --doc-id <id> --task <task> [--kind <kind>] [--root <path>]");
  console.log("  validate-spec [--format text|json] [--strict] <spec-files...>");
  console.log("  validate-technicals [--root <path>] [--format text|json] [--strict] [technical-files...]");
  console.log("  validate-tdd-evidence [--format text|json] [--strict] <evidence-files...>");
  console.log("  workflow-brief --feature <name> --doc-id <id> [--target <plan|execute>] [--task <task>] [--root <path>]");
  console.log("  workflow-guard check --feature <name> --doc-id <id> --target <plan|execute> [--root <path>]");
  console.log("  workflow-mode --intent <text> [--files <paths>] [--task-count <n>] [--mode <mode>]");
  console.log("  workflow-state <inspect|hash> --feature <name> --doc-id <id> [--root <path>]");
  process.exit(0);
}

const script = commands[command];
if (!script) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [resolve(root, script), ...args], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
