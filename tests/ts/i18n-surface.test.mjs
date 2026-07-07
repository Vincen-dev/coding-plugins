import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cjkPattern = /\p{Script=Han}/u;
const legacyProductNamePattern = /\b(?:Superpowers|using-superpowers)\b/i;
const ignoredDirectories = new Set([".git", "node_modules"]);
const distributionSurfaceFiles = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  "plugin.json",
  "gemini-extension.json",
  "package.json",
  "GEMINI.md",
  "hooks/session-start-codex",
];
const packagedBrandSurfaceFiles = [
  ...distributionSurfaceFiles,
  "assets/coding-plugins.svg",
];
const localizedSkillSupportFiles = new Set([
  "skills/systematic-debugging/concept-check.md",
  "skills/systematic-debugging/condition-based-waiting.md",
  "skills/systematic-debugging/defense-in-depth.md",
  "skills/systematic-debugging/pressure-scenario-flaky-ci.md",
  "skills/systematic-debugging/pressure-scenario-repeated-patches.md",
  "skills/systematic-debugging/pressure-scenario-signing-chain.md",
  "skills/systematic-debugging/root-cause-tracing.md",
  "skills/systematic-debugging/skill-creation-log.md",
  "skills/test-driven-development/test-pressure-bugfix-urgent.md",
  "skills/test-driven-development/test-pressure-refactor-no-behavior-change.md",
  "skills/test-driven-development/test-pressure-simple-change.md",
  "skills/test-driven-development/testing-anti-patterns.md",
  "skills/writing-skills/anthropic-best-practices.md",
  "skills/writing-skills/persuasion-principles.md",
  "skills/writing-skills/testing-skills-with-subagents.md",
]);

function walk(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  const stats = statSync(fullPath, { throwIfNoEntry: false });
  if (!stats) {
    return [];
  }
  if (stats.isFile()) {
    return [relativePath];
  }
  if (!stats.isDirectory() || ignoredDirectories.has(relativePath.split("/").at(-1))) {
    return [];
  }

  const files = [];
  for (const child of readdirSync(fullPath).sort()) {
    const childPath = relative(repoRoot, join(fullPath, child)).replaceAll("\\", "/");
    if (ignoredDirectories.has(child)) {
      continue;
    }
    files.push(...walk(childPath));
  }
  return files;
}

function isAgentFacingSkillSurface(path) {
  return (
    /^skills\/[^/]+\/SKILL\.md$/.test(path) ||
    /^skills\/[^/]+\/agents\/openai\.yaml$/.test(path) ||
    /^skills\/.+\/[^/]+-prompt\.md$/.test(path)
  );
}

function isLocalizedSkillSupportSurface(path) {
  return (
    /^skills\/[^/]+\/templates\/.+\.md$/.test(path) ||
    /^skills\/[^/]+\/examples\/.+\.md$/.test(path) ||
    /^skills\/[^/]+\/references\/.+\.md$/.test(path) ||
    /^skills\/[^/]+\/scripts\/fixtures\/.+\.md$/.test(path) ||
    localizedSkillSupportFiles.has(path)
  );
}

function hasApprovedChineseException(path, line) {
  const normalized = line.trim();
  return normalized.startsWith("<!-- i18n-allow:") && path.startsWith("skills/");
}

function collectUnapprovedChinese(files) {
  const offenders = [];
  for (const file of files) {
    const lines = readFileSync(join(repoRoot, file), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (cjkPattern.test(line) && !hasApprovedChineseException(file, line)) {
        offenders.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  return offenders;
}

function summarizeOffenders(offenders) {
  const countsByFile = new Map();
  for (const offender of offenders) {
    const file = offender.slice(0, offender.indexOf(":"));
    countsByFile.set(file, (countsByFile.get(file) ?? 0) + 1);
  }

  const fileSummary = [...countsByFile.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([file, count]) => `${file} (${count})`);
  const samples = offenders.slice(0, 20).join("\n");
  return [
    `Found ${offenders.length} unapproved Chinese lines in ${countsByFile.size} agent-facing files.`,
    "Files:",
    ...fileSummary,
    "Samples:",
    samples,
  ].join("\n");
}

function collectLegacyProductNames(files) {
  const offenders = [];
  for (const file of files) {
    const lines = readFileSync(join(repoRoot, file), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (legacyProductNamePattern.test(line)) {
        offenders.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  return offenders;
}

test("REQ-002 agent-facing skill surface defaults to English", () => {
  const files = walk("skills").filter(isAgentFacingSkillSurface);
  assert.ok(files.length > 0, "expected agent-facing skill files to be scanned");

  const offenders = collectUnapprovedChinese(files);
  assert.equal(offenders.length, 0, summarizeOffenders(offenders));
});

test("REQ-005 Chinese skill support docs are explicit localized allowlist", () => {
  const chineseSkillSupportFiles = walk("skills").filter((file) => {
    if (isAgentFacingSkillSurface(file) || !file.endsWith(".md")) {
      return false;
    }
    return cjkPattern.test(readFileSync(join(repoRoot, file), "utf8"));
  });
  const unexpected = chineseSkillSupportFiles.filter((file) => !isLocalizedSkillSupportSurface(file));

  assert.deepEqual(unexpected, []);
  assert.ok(
    chineseSkillSupportFiles.some((file) => /^skills\/[^/]+\/templates\//.test(file)),
    "expected localized Chinese document templates to stay in the explicit allowlist",
  );
});

test("REQ-001 Chinese user entrypoints remain localized", () => {
  const userEntryFiles = ["README.md", "INSTALL.md"];
  const localizedEntrypoints = userEntryFiles.filter((file) => {
    const text = readFileSync(join(repoRoot, file), "utf8");
    return cjkPattern.test(text);
  });

  assert.deepEqual(localizedEntrypoints, userEntryFiles);
});

test("REQ-003 distribution copy is English and consistent across platforms", () => {
  const offenders = collectUnapprovedChinese(distributionSurfaceFiles);
  assert.equal(offenders.length, 0, summarizeOffenders(offenders));

  for (const file of distributionSurfaceFiles) {
    const text = readFileSync(join(repoRoot, file), "utf8");
    assert.match(text, /Chinese-first/i, `${file} should state the Chinese-first user positioning`);
    assert.match(text, /English agent-facing/i, `${file} should state the English agent-facing skill surface`);
  }
});

test("REQ-003 packaged agent docs use Coding Plugins naming", () => {
  const files = [
    ...packagedBrandSurfaceFiles,
    ...walk("skills").filter((file) => file.endsWith(".md") || file.endsWith(".yaml")),
  ];
  const offenders = collectLegacyProductNames(files);

  assert.equal(offenders.length, 0, offenders.slice(0, 20).join("\n"));
});
