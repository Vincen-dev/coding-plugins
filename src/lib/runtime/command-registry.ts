export interface CommandDefinition {
  name: string;
  script: string;
  usage: string;
}

export const COMMAND_REGISTRY = [
  {
    name: "agent-pressure-harness",
    script: "src/cli/agent-pressure-harness.ts",
    usage: "agent-pressure-harness [--root <path>] [--json] [--output <artifact.json>]",
  },
  {
    name: "agent-pressure-ingest",
    script: "src/cli/agent-pressure-ingest.ts",
    usage: "agent-pressure-ingest --input <raw.json> --output <artifact.json> [--split-cases]",
  },
  { name: "bump-version", script: "src/cli/bump-version.ts", usage: "bump-version <version> [--root <path>]" },
  { name: "cli", script: "src/cli/cli.ts", usage: "cli <status|install|uninstall> [--scope user|project] [--target <path>] [--root <path>] [--format text|json] [--force]" },
  { name: "command-registry", script: "src/cli/command-registry.ts", usage: "command-registry [--format text|json]" },
  { name: "decision-points", script: "skills/using-coding-plugins/scripts/decision-points.ts", usage: "decision-points [--id <DP-n>] [--json]" },
  { name: "dp", script: "src/cli/dp.ts", usage: "dp <status|request|approve|audit> --feature <name> --doc-id <id> [--id <DP-n>] [--target <execute|commit|tag|release|publish>] [--root <path>] [--json]" },
  { name: "doctor", script: "src/cli/doctor.ts", usage: "doctor [--root <path>] [--format text|json]" },
  { name: "document-contract-migration", script: "skills/document-metadata/scripts/document-contract-migration.ts", usage: "document-contract-migration [--root <path>] [--dry-run]" },
  {
    name: "execution-contract",
    script: "src/cli/execution-contract.ts",
    usage: "execution-contract generate --feature <name> --doc-id <id> [--root <path>] [--format text|json|markdown] [--write]",
  },
  { name: "inject", script: "src/cli/inject.ts", usage: "inject --platform <cursor|copilot> [--root <path>] [--dry-run] [--force] [--format text|json]" },
  { name: "install-copilot", script: "src/cli/install-copilot.ts", usage: "install-copilot [--root <path>] [--force] [--format text|json]" },
  { name: "install-cursor", script: "src/cli/install-cursor.ts", usage: "install-cursor [--root <path>] [--force] [--format text|json]" },
  { name: "list", script: "src/cli/list.ts", usage: "list [--root <path>] [--format text|json]" },
  { name: "manifest-check", script: "src/cli/manifest-check.ts", usage: "manifest-check [--root <path>]" },
  { name: "preflight", script: "src/cli/preflight.ts", usage: "preflight [--write-index] [--check-external-references]" },
  { name: "prepare-release", script: "src/cli/prepare-release.ts", usage: "prepare-release [--root <path>] [--version <version>]" },
  { name: "release", script: "src/cli/release.ts", usage: "release <plan|guard|verify> [--version <version>] [--packages <names>] [--package-order <names>] [--commit-pushed] [--tag-pushed] [--workflow-ok] [--release-visible] [--dependency-resolved] [--json]" },
  { name: "remote-audit", script: "src/cli/remote-audit.ts", usage: "remote-audit --owner <owner> --repo <repo> --tag <tag> --expected-pusher <login>" },
  { name: "scaffold-feature-docs", script: "skills/spec-driven-development/scripts/scaffold-feature-docs.ts", usage: "scaffold-feature-docs <feature-name> --title <title> [--doc-id <id>] [--root <path>]" },
  { name: "scaffold-fixture-case", script: "skills/writing-skills/scripts/scaffold-fixture-case.ts", usage: "scaffold-fixture-case <root> --feature <name> --doc-id <id> --title <title> ..." },
  { name: "security-audit", script: "src/cli/security-audit.ts", usage: "security-audit [--root <path>] [--strict-release] [--format text|json]" },
  { name: "scope-check", script: "src/cli/scope-check.ts", usage: "scope-check --mode <mode> --intent <text> [--planned-files <paths>] [--actual-files <paths>] [--task-count <n>] [--feature-count <n>] [--actions <actions>] [--json]" },
  { name: "start", script: "src/cli/start.ts", usage: "start --intent <text> [--feature <name>] [--doc-id <id>] [--root <path>] [--json]" },
  { name: "state", script: "src/cli/state.ts", usage: "state <init|check|transition|audit> [--root <path>] [--json]" },
  {
    name: "subagent-prompt-builder",
    script: "skills/subagent-driven-development/scripts/subagent-prompt-builder.ts",
    usage: "subagent-prompt-builder --feature <name> --doc-id <id> --task <task> [--kind <kind>] --expected-source-hash <sha256> [--root <path>]",
  },
  { name: "task", script: "src/cli/task.ts", usage: "task <start|continue|status> --intent <text> [--feature <name>] [--doc-id <id>] [--root <path>] [--json]" },
  { name: "validate", script: "src/cli/validate.ts", usage: "validate [--root <path>] [--format text|json] [--include-sections] [--allow-evidence-only|--strict-chain]" },
  { name: "validate-spec", script: "skills/spec-driven-development/scripts/validate-spec.ts", usage: "validate-spec [--format text|json] [--strict] <spec-files...>" },
  { name: "validate-technicals", script: "skills/writing-technicals/scripts/validate-technicals.ts", usage: "validate-technicals [--root <path>] [--format text|json] [--strict] [technical-files...]" },
  { name: "validate-tdd-evidence", script: "skills/test-driven-development/scripts/validate-tdd-evidence.ts", usage: "validate-tdd-evidence [--format text|json] [--strict] [--root <path>] [--artifact-mode tracked|local|external] <evidence-files...>" },
  { name: "workflow-brief", script: "src/cli/workflow-brief.ts", usage: "workflow-brief --feature <name> --doc-id <id> [--target <plan|execute>] [--task <task>] [--root <path>]" },
  { name: "workflow-guard", script: "src/cli/workflow-guard.ts", usage: "workflow-guard check --feature <name> --doc-id <id> --target <plan|execute> [--root <path>]" },
  { name: "workflow-mode", script: "skills/using-coding-plugins/scripts/workflow-mode.ts", usage: "workflow-mode --intent <text> [--files <paths>] [--task-count <n>] [--mode <mode>]" },
  { name: "workflow-state", script: "src/cli/workflow-state.ts", usage: "workflow-state <inspect|hash> --feature <name> --doc-id <id> [--root <path>]" },
] satisfies CommandDefinition[];

export function commandByName(name: string): CommandDefinition | undefined {
  return COMMAND_REGISTRY.find((command) => command.name === name);
}
