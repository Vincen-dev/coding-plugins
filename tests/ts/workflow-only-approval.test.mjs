import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const entry = readFileSync(resolve(repoRoot, "skills/using-coding-plugins/SKILL.md"), "utf8");

test("VC-004 approvals scale with risk instead of document count", () => {
  assert.match(entry, /Quick Change[^\n]*0 approvals/i);
  assert.match(entry, /Standard Change[^\n]*scope expansion only/i);
  assert.match(entry, /Governed Change[^\n]*2 approvals[^\n]*Scope\/Plan[^\n]*Execution/i);
  assert.match(entry, /Critical Change[^\n]*3 approvals[^\n]*Scope[^\n]*Technical[^\n]*Execution/i);
  assert.doesNotMatch(entry, /\bDP-\d+\b|task approve/i);
});
