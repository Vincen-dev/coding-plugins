import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const inventoryPath = "docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md";
const inventoryColumns = [
  "skill",
  "primary_role",
  "agent_guidance",
  "guard_authority",
  "duplication_risk",
  "migration_action",
  "verification",
];

const highRiskGuardDetailRules = [
  {
    id: "commit-author-identity-detail",
    recommendation: "Delegate author identity rejection to commit-guard and keep only the command entry in the skill.",
    pattern: /\b(?:author|identity)\b[\s\S]{0,220}\b(?:Codex|ChatGPT|OpenAI|AI-generated|bot)\b[\s\S]{0,220}\b(?:block|reject|fail|forbid)\b/i,
  },
  {
    id: "release-completion-standards-detail",
    recommendation: "Delegate release completion criteria to release guard and keep only the command entry in the skill.",
    pattern: /\btag\b[\s\S]{0,220}\b(?:pushed|publish|published)\b[\s\S]{0,220}\b(?:not enough|insufficient|must not|cannot)\b/i,
  },
  {
    id: "artifact-mode-decision-detail",
    recommendation: "Delegate artifact mode decisions to validate-tdd-evidence and document validators.",
    pattern: /\bartifact mode\b[\s\S]{0,220}\b(?:tracked|local|external)\b[\s\S]{0,220}\b(?:ignored|gitignore|formal evidence)\b/i,
  },
  {
    id: "workflow-state-stale-detail",
    recommendation: "Delegate stale workflow state decisions to workflow-state, workflow-guard, or workflow-brief.",
    pattern: /\bsource_hash\b[\s\S]{0,220}\b(?:stale|plan-stale|mismatch)\b[\s\S]{0,220}\b(?:block|reject|must not|cannot)\b/i,
  },
  {
    id: "dp-full-list-detail",
    recommendation: "Delegate the DP catalog to decision-points and DP state commands.",
    pattern: /\bDP-0\b[\s\S]{0,900}\bDP-7\b/,
  },
  {
    id: "artifact-mode-enumeration-detail",
    recommendation: "Replace artifact mode enumeration with a validator command reference.",
    pattern: /\bartifact mode\b[\s\S]{0,260}\btracked\b[\s\S]{0,260}\blocal\b[\s\S]{0,260}\bexternal\b/i,
  },
  {
    id: "source-hash-stale-state-detail",
    recommendation: "Replace source_hash state matrices with workflow-state or workflow-guard command references.",
    pattern: /\bsource_hash\b[\s\S]{0,260}\bplan-draft\b[\s\S]{0,260}\bplan-stale\b/i,
  },
  {
    id: "commit-author-ai-detail",
    recommendation: "Replace AI author rejection details with a commit-guard command reference.",
    pattern: /\bReject AI authors\b[\s\S]{0,160}\bAI co-authors\b[\s\S]{0,160}\bAI-generated\b/i,
  },
];

const allowedGuardReferenceRules = [
  /\bworkflow-guard\b/i,
  /\bcommit-guard\b/i,
  /\brelease guard\b/i,
  /\bscope-check\b/i,
  /\btask status\b/i,
  /\bdp audit\b/i,
];

function skillFiles() {
  return readdirSync(join(repoRoot, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skills/${entry.name}/SKILL.md`)
    .filter((path) => statSync(join(repoRoot, path), { throwIfNoEntry: false })?.isFile())
    .sort();
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseInventory(text) {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => {
    const cells = splitMarkdownRow(line);
    return inventoryColumns.every((column) => cells.includes(column));
  });
  assert.notEqual(headerIndex, -1, `inventory must define columns: ${inventoryColumns.join(", ")}`);

  const headers = splitMarkdownRow(lines[headerIndex]);
  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) {
      break;
    }
    const cells = splitMarkdownRow(line);
    if (cells.length !== headers.length) {
      continue;
    }
    rows.push(Object.fromEntries(headers.map((header, index) => [header, cells[index]])));
  }
  return rows;
}

function guardDetailMatches(text) {
  return highRiskGuardDetailRules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.id);
}

function guardDetailFindings(path, text) {
  return highRiskGuardDetailRules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => `${path}: ${rule.id}: ${rule.recommendation}`);
}

function hasAllowedGuardReference(text) {
  return allowedGuardReferenceRules.some((pattern) => pattern.test(text));
}

test("REQ-002 inventory covers every skill with stable boundary fields", () => {
  assert.ok(existsSync(join(repoRoot, inventoryPath)), `${inventoryPath} must exist`);

  const rows = parseInventory(readFileSync(join(repoRoot, inventoryPath), "utf8"));
  const actualSkills = skillFiles().map((path) => path.split("/")[1]);
  const inventorySkills = rows.map((row) => row.skill).sort();

  assert.deepEqual(inventorySkills, actualSkills);
  for (const row of rows) {
    for (const column of inventoryColumns) {
      assert.ok(row[column], `${row.skill} must define ${column}`);
      assert.notEqual(row[column], "-", `${row.skill} must not leave ${column} empty`);
    }
  }
});

test("REQ-002 inventory has no unresolved migration actions", () => {
  const rows = parseInventory(readFileSync(join(repoRoot, inventoryPath), "utf8"));
  const unresolved = rows
    .filter((row) => /\b(candidate|first-batch|future)\b|后续|候选/i.test(row.migration_action))
    .map((row) => `${row.skill}: ${row.migration_action}`);

  assert.deepEqual(unresolved, []);
});

test("REQ-003 boundary samples reject full guard internals and allow command references", () => {
  const duplicateGuardDetail = [
    "When commit author identity contains Codex, ChatGPT, OpenAI, AI-generated, or bot, commit-guard must reject and block the commit.",
    "A release tag pushed to remote is not enough for completion; release guard must reject publish claims until package verification is complete.",
    "Artifact mode tracked/local/external decides whether ignored formal evidence is rejected by gitignore checks.",
    "When source_hash mismatch makes workflow state plan-stale, workflow-guard must block execute.",
  ].join("\n");
  const allowedSummary = [
    "Run workflow-guard before executing a TED.",
    "Run commit-guard before committing.",
    "Use release guard for release completion checks.",
    "Use scope-check when the touched files expand beyond the planned mode.",
  ].join("\n");

  assert.deepEqual(guardDetailMatches(duplicateGuardDetail), [
    "commit-author-identity-detail",
    "release-completion-standards-detail",
    "artifact-mode-decision-detail",
    "workflow-state-stale-detail",
    "artifact-mode-enumeration-detail",
  ]);
  assert.deepEqual(guardDetailMatches(allowedSummary), []);
  assert.equal(hasAllowedGuardReference(allowedSummary), true);
});

test("REQ-003 boundary findings include path, category, and recommendation", () => {
  const findings = guardDetailFindings(
    "skills/example/SKILL.md",
    "When commit author identity contains Codex, ChatGPT, OpenAI, AI-generated, or bot, commit-guard must reject and block the commit.",
  );

  assert.deepEqual(findings, [
    "skills/example/SKILL.md: commit-author-identity-detail: Delegate author identity rejection to commit-guard and keep only the command entry in the skill.",
  ]);
});

test("REQ-001 skills avoid duplicating high-risk guard internals", () => {
  const offenders = [];
  for (const file of skillFiles()) {
    const text = readFileSync(join(repoRoot, file), "utf8");
    offenders.push(...guardDetailFindings(file, text));
  }

  assert.deepEqual(offenders, []);
});
