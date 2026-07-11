import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

function walk(path) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return [path];
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const child = relative(repoRoot, join(full, entry.name)).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(child) : [child];
  });
}

const activeSurfaces = [
  "README.md",
  "INSTALL.md",
  "GEMINI.md",
  "SECURITY.md",
  "docs/workflow-chain.md",
  "docs/claude-code-usage.md",
  "docs/coding-plugins/README.md",
  ...walk("skills").filter((path) => /\.(?:md|yaml)$/.test(path)),
  ...walk("docs/coding-plugins/changes").filter((path) => path.endsWith(".md")),
];

test("VC-001/003 entry defines the universal contract and systematic sequence", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");
  for (const principle of [
    "Test First",
    "Verifiable Contract",
    "Systematic Execution",
    "Simplicity",
    "Evidence Before Claims",
  ]) assert.match(entry, new RegExp(principle, "i"));
  assert.match(entry, /Outcome[\s\S]*Boundary[\s\S]*Verification/);
  assert.match(entry, /contract[\s\S]*failing evidence[\s\S]*implementation[\s\S]*fresh verification/i);
});

test("VC-002 every implementation path establishes tests before production changes", () => {
  const tdd = read("skills/test-driven-development/SKILL.md");
  const implementer = read("skills/subagent-driven-development/implementer-prompt.md");
  assert.match(tdd, /behavior change[\s\S]*failing test[\s\S]*before[\s\S]*production/i);
  assert.match(tdd, /refactor[\s\S]*characterization[\s\S]*before/i);
  assert.doesNotMatch(`${tdd}\n${implementer}`, /TDD Exception|approved exception|user-approved TDD exception|skip(?:ping)? TDD/i);
});

test("VC-001/004 Capsule templates use one Verifiable Contract model", () => {
  const change = read("skills/change-capsule/templates/change.md");
  assert.match(change, /^## 可验证契约$/m);
  assert.match(change, /VC-001[\s\S]*结果[\s\S]*边界[\s\S]*验证/);
  assert.doesNotMatch(change, /^## Acceptance$/m);
  const plan = read("skills/change-capsule/templates/plan.md");
  assert.match(plan, /编号契约项/);
  const evidence = read("skills/change-capsule/templates/evidence.md");
  assert.match(evidence, /契约来源/);
});

test("VC-004 active workflow surfaces contain no retired contract", () => {
  const legacy = /\b(?:PRD|TSD|TVD|TED|VED|DP-\d+)\b|\b(?:spec-driven-development|document-metadata|writing-requirements|writing-technicals|writing-test-cases|writing-plans)\b|\bCP_CLI\b|coding-plugins\s+(?:task|start|state|dp|validate|workflow-|doctor|cli|release|commit-guard|scope-check|preflight)\b|coding-plugins\.policies\.yaml|integrationPolicy|source_hash|runtime-state|decisions\.json/i;
  const offenders = activeSurfaces.filter((path) => legacy.test(read(path)));
  assert.deepEqual(offenders, [], `retired contract remains in: ${offenders.join(", ")}`);
  for (const path of [
    "docs/coding-plugins/features",
    "docs/coding-plugins/INDEX.md",
    "docs/coding-plugins/document-contract.md",
    "docs/coding-plugins/scenario-routing.json",
  ]) assert.equal(existsSync(join(repoRoot, path)), false, `${path} is a retired contract surface`);
});

test("VC-005 evidence precedes every completion claim", () => {
  const verification = read("skills/verification-before-completion/SKILL.md");
  const capsule = read("skills/change-capsule/SKILL.md");
  assert.match(verification, /fresh verification/i);
  assert.match(verification, /run[\s\S]*read[\s\S]*claim/i);
  assert.match(capsule, /Residual Risks/);
  assert.match(capsule, /Mark complete only after[\s\S]*fresh results/i);
});

test("VC-003/004 Capsule phases and scope drift have deterministic gates", () => {
  const capsule = read("skills/change-capsule/SKILL.md");
  assert.match(capsule, /framing to planned only after[\s\S]*Verifiable Contract/i);
  assert.match(capsule, /planned to approved only after[\s\S]*required approvals/i);
  assert.match(capsule, /verification failure[\s\S]*returns[\s\S]*executing/i);
  assert.match(capsule, /material (?:contract|plan) change[\s\S]*returns[\s\S]*planned[\s\S]*invalidates[\s\S]*approval/i);
});

test("VC-001/002/005 Quick Change reports a complete ephemeral evidence contract", () => {
  const entry = read("skills/using-coding-plugins/SKILL.md");
  assert.match(entry, /Quick Change completion report[\s\S]*可验证契约[\s\S]*测试先行证据[\s\S]*最终验证[\s\S]*剩余风险/i);
});
