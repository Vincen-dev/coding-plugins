import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const routingPath = join(repoRoot, "docs/coding-plugins/scenario-routing.json");
const caseIndexPath = join(repoRoot, "tests/fixtures/formal-feature-chain/CASE-INDEX.md");
const selfTestFeedbackPath = join(repoRoot, "tests/fixtures/formal-feature-chain/self-test-feedback.json");
const agentPressureResultsPath = join(repoRoot, "tests/fixtures/formal-feature-chain/agent-pressure-results.json");
const agentPressureCasesRoot = join(repoRoot, "tests/fixtures/formal-feature-chain/agent-pressure-cases");
const usingCodingPluginsPath = join(repoRoot, "skills/using-coding-plugins/SKILL.md");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function unique(values) {
  return new Set(values).size === values.length;
}

function scenarioById(routing) {
  return new Map(routing.scenarios.map((scenario) => [scenario.id, scenario]));
}

function caseIndexEntries() {
  const caseIndex = readFileSync(caseIndexPath, "utf8");
  return [...caseIndex.matchAll(/^##\s+(.+?)\n[\s\S]*?- case_id:\s*(CASE-[A-Z0-9-]+)/gm)].map((match) => ({
    heading: match[1],
    caseId: match[2],
  }));
}

test("scenario routing contract keeps schema and heading invariants", () => {
  const routing = readJson(routingPath);

  assert.equal(routing.schema_version, 2);
  assert.ok(Array.isArray(routing.scenarios));
  assert.ok(routing.scenarios.length > 0);
  assert.ok(unique(routing.scenarios.map((scenario) => scenario.id)), "scenario ids must be unique");
  assert.ok(unique(routing.scenarios.map((scenario) => scenario.doc_heading)), "scenario doc_heading values must be unique");
});

test("scenario routing references existing discoverable skills", () => {
  const routing = readJson(routingPath);
  const usingCodingPlugins = readFileSync(usingCodingPluginsPath, "utf8");

  for (const scenario of routing.scenarios) {
    assert.ok(Array.isArray(scenario.skills), `${scenario.id} must declare skills`);
    for (const skill of scenario.skills) {
      assert.ok(existsSync(join(repoRoot, "skills", skill, "SKILL.md")), `${scenario.id} references missing skill ${skill}`);
      assert.ok(usingCodingPlugins.includes(`\`${skill}\``), `${skill} must be discoverable from using-coding-plugins`);
    }
  }
});

test("using-coding-plugins makes start and workflow guard mandatory for formal chains", () => {
  const skill = readFileSync(usingCodingPluginsPath, "utf8");

  assert.match(skill, /正式 PRD\/TSD\/TVD\/TED\/VED 工作必须先运行 `coding-plugins start/);
  assert.match(skill, /`using-coding-plugins` 不能替代 `coding-plugins start`/);
  assert.match(skill, /执行 TED 前必须运行 `coding-plugins workflow-guard check/);
  assert.match(skill, /命令不可用.*node \/absolute\/path\/to\/coding-plugins\/bin\/coding-plugins\.js/s);
});

test("scenario routing gate ids all exist in gate catalog", () => {
  const routing = readJson(routingPath);
  const gateIds = new Set(Object.keys(routing.gate_catalog ?? {}));

  assert.ok(gateIds.size > 0, "gate_catalog must not be empty");
  for (const scenario of routing.scenarios) {
    assert.ok(Array.isArray(scenario.gate_ids), `${scenario.id} must declare gate_ids`);
    for (const gateId of scenario.gate_ids) {
      assert.ok(gateIds.has(gateId), `${scenario.id} references missing gate_id ${gateId}`);
    }
  }
});

test("scenario routing case ids all exist in CASE-INDEX", () => {
  const routing = readJson(routingPath);
  const knownCaseIds = new Set(caseIndexEntries().map((entry) => entry.caseId));

  assert.ok(knownCaseIds.size > 0, "CASE-INDEX must list case ids");
  for (const scenario of routing.scenarios) {
    assert.ok(Array.isArray(scenario.case_ids), `${scenario.id} must declare case_ids`);
    for (const caseId of scenario.case_ids) {
      assert.ok(knownCaseIds.has(caseId), `${scenario.id} references missing case_id ${caseId}`);
    }
  }
});

test("CASE-INDEX cases are backed by executable agent pressure evidence", () => {
  const routing = readJson(routingPath);
  const manifest = readJson(agentPressureResultsPath);
  assert.equal(manifest.cases_dir, "agent-pressure-cases");
  assert.ok(Array.isArray(manifest.case_files), "agent pressure manifest must list split case files");

  const cases = manifest.case_files.map((caseFile) => readJson(join(agentPressureCasesRoot, caseFile)));
  const casesByScenario = new Map();
  for (const caseData of cases) {
    const list = casesByScenario.get(caseData.scenario_id) ?? [];
    list.push(caseData);
    casesByScenario.set(caseData.scenario_id, list);
  }

  for (const entry of caseIndexEntries()) {
    const scenarioIds = routing.scenarios
      .filter((scenario) => (scenario.case_ids ?? []).includes(entry.caseId))
      .map((scenario) => scenario.id);
    assert.ok(scenarioIds.length > 0, `${entry.caseId} must be referenced by scenario routing`);
    assert.ok(
      scenarioIds.some((scenarioId) =>
        (casesByScenario.get(scenarioId) ?? []).some(
          (caseData) => caseData.execution_depth === "real_command" && Array.isArray(caseData.command_log) && caseData.command_log.length > 0,
        ),
      ),
      `${entry.caseId} must have real command agent pressure evidence through one of: ${scenarioIds.join(", ")}`,
    );
  }
});

test("self-test feedback expectations are covered by scenario routing", () => {
  const routing = readJson(routingPath);
  const feedback = readJson(selfTestFeedbackPath);
  const scenarios = scenarioById(routing);

  for (const feedbackCase of feedback.cases) {
    const scenario = scenarios.get(feedbackCase.expected_scenario_id);
    assert.ok(scenario, `${feedbackCase.id} references missing scenario ${feedbackCase.expected_scenario_id}`);

    const scenarioGateIds = new Set(scenario.gate_ids ?? []);
    for (const gateId of feedbackCase.expected_gate_ids ?? []) {
      assert.ok(scenarioGateIds.has(gateId), `${feedbackCase.id} expects gate_id ${gateId} not covered by ${scenario.id}`);
    }

    const scenarioCaseIds = new Set(scenario.case_ids ?? []);
    for (const caseId of feedbackCase.expected_case_ids ?? []) {
      assert.ok(scenarioCaseIds.has(caseId), `${feedbackCase.id} expects case_id ${caseId} not covered by ${scenario.id}`);
    }
  }
});
