import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const skillOwnedScripts = {
  "decision-points": "skills/using-coding-plugins/scripts/decision-points.ts",
  "document-contract-migration": "skills/document-metadata/scripts/document-contract-migration.ts",
  "scaffold-feature-docs": "skills/spec-driven-development/scripts/scaffold-feature-docs.ts",
  "scaffold-fixture-case": "skills/writing-skills/scripts/scaffold-fixture-case.ts",
  "subagent-prompt-builder": "skills/subagent-driven-development/scripts/subagent-prompt-builder.ts",
  "validate-spec": "skills/spec-driven-development/scripts/validate-spec.ts",
  "validate-tdd-evidence": "skills/test-driven-development/scripts/validate-tdd-evidence.ts",
  "validate-technicals": "skills/writing-technicals/scripts/validate-technicals.ts",
  "workflow-mode": "skills/using-coding-plugins/scripts/workflow-mode.ts",
};

const sharedRuntimeScripts = [
  "src/cli/agent-pressure-harness.ts",
  "src/cli/agent-pressure-ingest.ts",
  "src/cli/bump-version.ts",
  "src/cli/manifest-check.ts",
  "src/cli/preflight.ts",
  "src/cli/prepare-release.ts",
  "src/cli/remote-audit.ts",
  "src/cli/workflow-brief.ts",
  "src/cli/workflow-guard.ts",
  "src/cli/workflow-state.ts",
];

test("skill-owned CLI scripts live under their owning skill", () => {
  for (const [command, scriptPath] of Object.entries(skillOwnedScripts)) {
    assert.equal(existsSync(join(repoRoot, scriptPath)), true, `${command} should live at ${scriptPath}`);
    assert.equal(existsSync(join(repoRoot, "src/cli", `${command}.ts`)), false, `${command} should not remain in src/cli`);
  }
  for (const scriptPath of sharedRuntimeScripts) {
    assert.equal(existsSync(join(repoRoot, scriptPath)), true, `${scriptPath} should remain a shared runtime script`);
  }
});

test("package scripts and bin dispatcher point at skill-owned scripts", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const binSource = readFileSync(join(repoRoot, "bin/coding-plugins.js"), "utf8");

  for (const [command, scriptPath] of Object.entries(skillOwnedScripts)) {
    const npmScript = `${command}:ts`;
    if (packageJson.scripts[npmScript]) {
      assert.equal(packageJson.scripts[npmScript], `node ${scriptPath}`);
    }
    assert.ok(binSource.includes(`"${command}": "${scriptPath}"`), `bin dispatcher must route ${command}`);
  }
});
