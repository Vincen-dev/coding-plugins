import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("TypeScript agent pressure harness writes command/workspace artifact", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-agent-pressure-harness-"));
  try {
    const output = join(root, "agent-pressure-harness.json");
    const result = spawnSync("node", [join(repoRoot, "src/cli/agent-pressure-harness.ts"), "--root", repoRoot, "--json", "--output", output], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes('"agent-pressure-harness"'));
    const payload = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(payload.artifact.kind, "agent-pressure-harness");
    assert.equal(payload.cases.length, 4);
    assert.ok(payload.cases.some((caseData) => caseData.scenario_id === "existing_ted_execution"));
    assert.ok(payload.cases.some((caseData) => caseData.scenario_id === "subagent_prompt_execution"));
    for (const caseData of payload.cases) {
      assert.equal(caseData.transcript.source, "command_log");
      assert.equal(caseData.transcript.format, "command-log-v1");
      assert.equal(caseData.transcript.command_count, caseData.command_log.length);
      assert.match(caseData.transcript.sha256, /^sha256:[0-9a-f]{64}$/);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
