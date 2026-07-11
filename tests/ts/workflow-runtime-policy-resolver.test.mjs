import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import * as workflow from "../../src/lib/workflow-mode.ts";
import { checkCommitGuard } from "../../src/lib/git/commit-guard.ts";

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

test("REQ-006 repository integration policy supports an explicit main-only delivery model", () => {
  const root = mkdtempSync(join(tmpdir(), "policy-main-only-"));
  try {
    writeFileSync(join(root, "coding-plugins.policies.yaml"), JSON.stringify({
      schemaVersion: 1,
      integrationPolicy: {
        strategy: "main-only",
        baseBranch: "main",
        allowDirectCommit: true,
        allowFeatureBranches: false,
        allowPullRequests: false,
        requireVersionChangePerCommit: true,
        versionFiles: ["package.json", ".version-bump.json"],
      },
      policies: [],
    }, null, 2), "utf8");

    assert.deepEqual(workflow.resolveIntegrationPolicy(root), {
      strategy: "main-only",
      baseBranch: "main",
      allowDirectCommit: true,
      allowFeatureBranches: false,
      allowPullRequests: false,
      requireVersionChangePerCommit: true,
      versionFiles: ["package.json", ".version-bump.json"],
    });

    const guard = checkCommitGuard({
      root,
      language: "zh",
      authorName: "Vincen",
      authorEmail: "hx001007@gmail.com",
      branch: "main",
      changedFiles: ["src/example.ts", "package.json", ".version-bump.json"],
    });
    assert.equal(guard.ok, true);
    assert.equal(guard.violations.some((item) => item.id === "main-branch-direct-commit"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-006 commit guard blocks commits that omit required version files", () => {
  const root = mkdtempSync(join(tmpdir(), "policy-version-per-commit-"));
  try {
    writeFileSync(join(root, "coding-plugins.policies.yaml"), JSON.stringify({
      schemaVersion: 1,
      integrationPolicy: {
        strategy: "main-only",
        baseBranch: "main",
        allowDirectCommit: true,
        allowFeatureBranches: false,
        allowPullRequests: false,
        requireVersionChangePerCommit: true,
        versionFiles: ["package.json", ".version-bump.json"],
      },
      policies: [],
    }), "utf8");

    const blocked = checkCommitGuard({
      root,
      language: "zh",
      authorName: "Vincen",
      authorEmail: "hx001007@gmail.com",
      branch: "main",
      changedFiles: ["src/example.ts"],
    });
    assert.equal(blocked.ok, false);
    assert.deepEqual(blocked.violations.find((item) => item.id === "version-change-missing")?.missing_files, [
      ".version-bump.json",
      "package.json",
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("REQ-006 skill guidance delegates branch and PR behavior to integrationPolicy", () => {
  const worktreeSkill = readFileSync(join(process.cwd(), "skills/using-git-worktrees/SKILL.md"), "utf8");
  const finishingSkill = readFileSync(join(process.cwd(), "skills/finishing-a-development-branch/SKILL.md"), "utf8");
  assert.match(worktreeSkill, /integrationPolicy/);
  assert.match(worktreeSkill, /main-only/);
  assert.match(finishingSkill, /integrationPolicy/);
  assert.match(finishingSkill, /allowPullRequests/);
});
