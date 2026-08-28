import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), "utf8");

test("VC-CAL-006 plan execution does not imply Git integration", () => {
  const execute = read("skills/executing-plans/SKILL.md");
  const finish = read("skills/finishing-a-development-branch/SKILL.md");

  assert.match(execute, /do not invoke[\s\S]*finishing-a-development-branch[\s\S]*unless[\s\S]*user/i);
  assert.match(finish, /do not pull[\s\S]*unless[\s\S]*user/i);
  assert.match(finish, /discard[\s\S]*only[\s\S]*(?:requests|explicit)/i);
});

test("VC-CAL-006 commit attribution and checkpoint commits follow repository or user intent", () => {
  const commit = read("skills/using-git-commit/SKILL.md");
  const messageShape = commit.slice(commit.indexOf("## Message Shape"));

  assert.match(commit, /Authored-by[\s\S]*(?:optional|repository|user)/i);
  assert.match(messageShape, /optional[^\n]*Authored-by/i);
  assert.match(commit, /checkpoint|partial commit/i);
  assert.match(commit, /does not authorize[\s\S]*(?:push|pull|merge)/i);
});

test("VC-CAL-006 worktree setup avoids unapproved repository and dependency mutations", () => {
  const worktrees = read("skills/using-git-worktrees/SKILL.md");

  assert.match(worktrees, /do not automatically (?:edit|modify)[\s\S]*\.gitignore/i);
  assert.match(worktrees, /dependency setup[\s\S]*(?:only when|required)[\s\S]*verification/i);
  assert.match(worktrees, /lockfile|lock file/i);
  assert.match(worktrees, /network|download/i);
});

test("VC-CAL-006 review output is findings-first across skill and prompt", () => {
  const skill = read("skills/requesting-code-review/SKILL.md");
  const prompt = read("skills/requesting-code-review/code-reviewer-prompt.md");

  assert.match(skill, /findings first/i);
  assert.match(prompt, /findings first/i);
  assert.ok(prompt.indexOf("### Issues") < prompt.indexOf("### Strengths"), "review prompt must place issues before strengths");
  for (const target of ["commit range", "staged diff", "unstaged diff", "PR diff"]) {
    assert.match(`${skill}\n${prompt}`, new RegExp(target, "i"));
  }
});

test("VC-CAL-006 review depth follows the selected risk profile", () => {
  const skill = read("skills/requesting-code-review/SKILL.md");

  assert.match(skill, /Standard[\s\S]*combined review/i);
  assert.match(skill, /Governed|Critical/i);
  assert.match(skill, /split[\s\S]*contract[\s\S]*quality/i);
});

test("VC-CAL-006 parallel work checks shared mutable resources, not only files", () => {
  const dispatch = read("skills/dispatching-parallel-agents/SKILL.md");
  const subagent = read("skills/subagent-driven-development/SKILL.md");
  const combined = `${dispatch}\n${subagent}`;

  assert.match(dispatch, /two or more independent tasks/i);
  assert.match(combined, /codegen/i);
  assert.match(combined, /native build/i);
  assert.match(combined, /Git index/i);
  assert.match(combined, /shared mutable resources/i);
});

test("VC-CAL-006 skill maintenance distinguishes static contracts from behavioral evaluation", () => {
  const writing = read("skills/writing-skills/SKILL.md");

  assert.match(writing, /static contract tests[\s\S]*do not prove[\s\S]*agent behavior/i);
  assert.match(writing, /scenario|forward-testing/i);
  assert.match(writing, /contradiction/i);
});

test("VC-CAL-006 brainstorming and review intake do not manufacture alternatives or stale work", () => {
  const brainstorming = read("skills/brainstorming/SKILL.md");
  const receiving = read("skills/receiving-code-review/SKILL.md");

  assert.match(brainstorming, /do not invent[\s\S]*alternative/i);
  assert.match(brainstorming, /only one viable option/i);
  assert.match(receiving, /revision|SHA/i);
  assert.match(receiving, /stale/i);
});
