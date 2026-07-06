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
    assert.ok(payload.cases.length >= 7);
    assert.ok(payload.cases.some((caseData) => caseData.scenario_id === "existing_ted_execution"));
    assert.ok(payload.cases.some((caseData) => caseData.scenario_id === "subagent_prompt_execution"));
    assert.ok(
      payload.cases.some((caseData) => caseData.observed_behaviors?.includes("kept_task_scope_after_long_session_pressure")),
      "harness must include a long-session compression pressure sample",
    );
    assert.ok(
      payload.cases.some((caseData) => caseData.observed_behaviors?.includes("rejected_stale_ted_after_upstream_change")),
      "harness must include a stale TED pressure sample",
    );
    assert.ok(
      payload.cases.some((caseData) => caseData.observed_behaviors?.includes("reported_platform_installation_summary_with_unavailable_codex")),
      "harness must include a multi-platform unavailable pressure sample",
    );
    for (const expected of [
      "blocked_full_chain_implementation_without_approved_ted",
      "rejected_ignored_evidence_as_formal_completion",
      "required_task_status_after_continue",
      "blocked_tag_pushed_only_release_completion",
      "reported_mixed_plugin_cache_versions",
    ]) {
      assert.ok(
        payload.cases.some((caseData) => caseData.observed_behaviors?.includes(expected)),
        `harness must include P2 review pressure sample: ${expected}`,
      );
    }
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
