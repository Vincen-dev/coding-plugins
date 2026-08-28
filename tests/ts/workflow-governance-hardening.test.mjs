import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

test("VC-001 shared checkouts classify ownership and isolate real overlap", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");
  const worktrees = read("skills/using-git-worktrees/SKILL.md");

  assert.match(entry, /shared checkout[\s\S]*one active write task/i);
  for (const state of ["clean", "known-unrelated", "overlapping-or-unknown", "active-writer"]) {
    assert.match(`${entry}\n${worktrees}`, new RegExp(`\\b${state}\\b`, "i"));
  }
  assert.match(entry, /known-unrelated[\s\S]*current checkout/i);
  assert.match(entry, /overlapping-or-unknown[\s\S]*stop/i);
  assert.match(worktrees, /single-writer[\s\S]*shared checkout/i);
  assert.match(worktrees, /partial staging[\s\S]*not[\s\S]*substitute[\s\S]*isolation/i);
  assert.match(`${entry}\n${worktrees}`, /codegen[\s\S]*native build[\s\S]*(?:Git index|shared resource)/i);
});

test("VC-005 worktrees are opt-in and require explicit user approval", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");
  const worktrees = read("skills/using-git-worktrees/SKILL.md");

  assert.match(entry, /current checkout[\s\S]*default/i);
  assert.match(entry, /do not invoke `using-git-worktrees`[\s\S]*explicit user approval/i);
  assert.match(entry, /overlap[\s\S]*stop[\s\S]*ask[\s\S]*worktree/i);
  assert.match(worktrees, /explicit user approval[\s\S]*precondition/i);
  assert.match(worktrees, /do not create[\s\S]*linked worktree[\s\S]*approval/i);
});

test("VC-002 required Governed and Critical capabilities cannot be downgraded", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");
  const capsule = read("skills/change-capsule/SKILL.md");

  assert.match(entry, /required (?:Skill|artifact|approval)[\s\S]*unavailable[\s\S]*stop/i);
  assert.match(entry, /must not downgrade[\s\S]*(?:Governed|Critical)/i);
  assert.match(capsule, /missing required (?:Skill|artifact|approval)[\s\S]*hard gate/i);
  assert.match(capsule, /do not replace[\s\S]*(?:Governed|Critical)[\s\S]*(?:Quick|ephemeral|conversation)/i);
});

test("VC-003 material conditional assumptions become blocking decision points", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");
  const capsule = read("skills/change-capsule/SKILL.md");
  const template = read("skills/change-capsule/templates/change.md");

  assert.match(entry, /conditional assumption[\s\S]*Decision Point/i);
  assert.match(entry, /schema[\s\S]*migration[\s\S]*compatibility[\s\S]*unresolved[\s\S]*implementation/i);
  assert.match(capsule, /unresolved material Decision Point[\s\S]*blocks[\s\S]*executing/i);
  assert.match(template, /^## 假设与待决事项$/m);
  assert.match(template, /Assumption[\s\S]*Decision Point[\s\S]*阻止执行/);
});

test("VC-004 high-risk completion defaults to the full relevant suite", () => {
  const verification = read("skills/verification-before-completion/SKILL.md");

  assert.match(
    verification,
    /public API[\s\S]*schema[\s\S]*migration[\s\S]*compatibility[\s\S]*security[\s\S]*release[\s\S]*full relevant (?:test )?suite/i,
  );
  assert.match(verification, /cannot run[\s\S]*narrow[\s\S]*claim[\s\S]*unverified[\s\S]*Residual Risks/i);
  assert.match(verification, /focused checks[\s\S]*do not[\s\S]*support[\s\S]*broad completion/i);
  for (const provenance of [
    "repository root",
    "branch/HEAD",
    "diff fingerprint",
    "entrypoint/flavor",
    "resolved dependencies",
    "generated outputs",
    "artifact/device",
  ]) assert.match(verification, new RegExp(provenance, "i"));
  assert.match(verification, /known baseline[\s\S]*(?:separate|classify)/i);
  assert.match(verification, /fresh[\s\S]*final relevant change[\s\S]*verified context/i);
});
