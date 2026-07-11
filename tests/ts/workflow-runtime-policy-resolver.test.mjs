import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";

function registry(recommendedVersion = "1") {
  return {
    schemaVersion: 1,
    profiles: [{ id: "typescript-cli-plugin", repositoryKinds: ["typescript"] }],
    policies: [
      {
        id: "POL-TS-001",
        version: "1",
        level: "required",
        source: { kind: "repository", ref: "policies/typescript.md" },
        appliesWhen: { repositoryKinds: ["typescript"], paths: ["src/**/*.ts"] },
        verification: [{ kind: "command", ref: "npm run typecheck" }],
      },
      {
        id: "POL-REC-001",
        version: recommendedVersion,
        level: "recommended",
        source: { kind: "versioned-plugin", ref: "coding-plugins@1.1.1/recommended" },
        appliesWhen: { repositoryKinds: ["typescript"] },
        verification: [],
      },
    ],
    skillBindings: [{
      name: "typescript-standards",
      source: "versioned-plugin",
      version: "1.1.1",
      appliesPolicyIds: ["POL-TS-001"],
    }],
  };
}

test("REQ-006 resolves applicable required policies and portable skill bindings", () => {
  assert.equal(typeof workflow.resolvePolicyBundle, "function", "policy resolver is missing");

  const root = mkdtempSync(join(tmpdir(), "policy-resolver-"));
  try {
    mkdirSync(join(root, "policies"), { recursive: true });
    writeFileSync(join(root, "policies/typescript.md"), "# TypeScript policy\n", "utf8");

    const result = workflow.resolvePolicyBundle({
      root,
      registry: registry(),
      repositoryKind: "typescript",
      plannedFiles: ["src/lib/workflow/runtime.ts"],
    });

    assert.deepEqual(result.required.map((policy) => policy.id), ["POL-TS-001"]);
    assert.deepEqual(result.recommended.map((policy) => policy.id), ["POL-REC-001"]);
    assert.equal(result.skillBindings[0].portable, true);
    assert.equal(result.skillBindings[0].requiredForExecution, true);
    assert.deepEqual(result.conflicts, []);
    assert.deepEqual(result.missingSources, []);
    assert.match(result.requiredPolicyHash, /^sha256:/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-006 keeps personal absolute skills advisory and redacts their paths", () => {
  assert.equal(typeof workflow.resolvePolicyBundle, "function", "policy resolver is missing");

  const root = mkdtempSync(join(tmpdir(), "policy-personal-"));
  try {
    mkdirSync(join(root, "policies"), { recursive: true });
    writeFileSync(join(root, "policies/typescript.md"), "# TypeScript policy\n", "utf8");
    const result = workflow.resolvePolicyBundle({
      root,
      registry: registry(),
      repositoryKind: "typescript",
      plannedFiles: ["src/main.ts"],
      explicitSkills: [{ name: "my-private-skill", source: "personal", path: "/Users/example/private/SKILL.md" }],
    });

    const personal = result.skillBindings.find((binding) => binding.name === "my-private-skill");
    assert.equal(personal.portable, false);
    assert.equal(personal.requiredForExecution, false);
    assert.equal(JSON.stringify(result).includes("/Users/example"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-006 reports missing, escaping, and conflicting required policy sources", () => {
  assert.equal(typeof workflow.resolvePolicyBundle, "function", "policy resolver is missing");
  const root = mkdtempSync(join(tmpdir(), "policy-conflict-"));
  try {
    const broken = registry();
    broken.policies[0].source.ref = "../outside.md";
    broken.policies.push({
      id: "POL-TS-002",
      version: "1",
      level: "required",
      source: { kind: "versioned-plugin", ref: "coding-plugins@1.1.1/conflict" },
      appliesWhen: { repositoryKinds: ["typescript"] },
      verification: [],
      conflictsWith: ["POL-TS-001"],
    });

    const result = workflow.resolvePolicyBundle({ root, registry: broken, repositoryKind: "typescript", plannedFiles: ["src/main.ts"] });
    assert.deepEqual(result.missingSources, ["POL-TS-001"]);
    assert.deepEqual(result.conflicts, ["POL-TS-001<->POL-TS-002"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-006 required policy hash ignores recommended and advisory changes", () => {
  assert.equal(typeof workflow.resolvePolicyBundle, "function", "policy resolver is missing");
  const root = mkdtempSync(join(tmpdir(), "policy-hash-"));
  try {
    mkdirSync(join(root, "policies"), { recursive: true });
    writeFileSync(join(root, "policies/typescript.md"), "# TypeScript policy\n", "utf8");
    const input = { root, repositoryKind: "typescript", plannedFiles: ["src/main.ts"] };
    const first = workflow.resolvePolicyBundle({ ...input, registry: registry("1") });
    const second = workflow.resolvePolicyBundle({
      ...input,
      registry: registry("2"),
      explicitSkills: [{ name: "personal-v2", source: "personal", path: "/tmp/private" }],
    });
    assert.equal(second.requiredPolicyHash, first.requiredPolicyHash);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
