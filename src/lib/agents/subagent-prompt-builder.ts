import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findRepositoryRoot } from "../runtime/repository-root.ts";
import { buildBrief } from "../workflow/workflow-brief.ts";
import { parseFrontmatter } from "../workflow/workflow-state.ts";

export class PromptBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptBuildError";
  }
}

const REPO_ROOT = findRepositoryRoot(dirname(fileURLToPath(import.meta.url)), {
  requiredPaths: [
    "skills/subagent-driven-development/implementer-prompt.md",
    "skills/requesting-code-review/code-reviewer-prompt.md",
  ],
  errorMessage: "Unable to locate coding-plugins repository root.",
});
const SUBAGENT_SKILL_DIR = resolve(REPO_ROOT, "skills/subagent-driven-development");
const CODE_REVIEWER_TEMPLATE = resolve(REPO_ROOT, "skills/requesting-code-review/code-reviewer-prompt.md");
const TASK_HEADING_RE = /^## (?<title>.*?\b(?<task>TASK-\d+)\b.*?)\s*$/gm;
const SECTION_HEADING_RE = /^## (?!#).*$/gm;
const PROMPT_KINDS = ["implementer", "spec-reviewer", "code-quality-reviewer"] as const;
const PROMPT_BUDGET_MAX_CHARS: Record<string, number> = {
  implementer: 12_000,
  "spec-reviewer": 9_000,
  "code-quality-reviewer": 12_000,
};
const INPUT_PLACEHOLDER_MARKERS = [
  "[待实现子代理回报后填入]",
  "[commit before task]",
  "[current commit]",
  "[FULL TEXT of task from plan",
  "[FULL TEXT of task requirements]",
  "[From implementer's report]",
  "[说明该任务在整体中的位置、依赖、架构背景]",
  "[directory]",
  "{DESCRIPTION}",
  "{PLAN_OR_REQUIREMENTS}",
  "{BASE_SHA}",
  "{HEAD_SHA}",
];

export function sha256Text(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function readFencedText(path: string): string {
  const text = readFileSync(path, "utf8");
  const marker = "```text\n";
  let start = text.indexOf(marker);
  if (start === -1) {
    throw new PromptBuildError(`prompt template has no text fence: ${path}`);
  }
  start += marker.length;
  const end = text.indexOf("\n```", start);
  if (end === -1) {
    throw new PromptBuildError(`prompt template text fence is not closed: ${path}`);
  }
  return text.slice(start, end).trimEnd();
}

function readAfterFence(path: string): string {
  const text = readFileSync(path, "utf8");
  const marker = "\n```\n";
  const end = text.indexOf(marker);
  if (end === -1) {
    return "";
  }
  return text.slice(end + marker.length).trim();
}

export function extractTaskSection(planText: string, task: string): [string, string] {
  const matches = [...planText.matchAll(TASK_HEADING_RE)];
  for (const match of matches) {
    if (match.groups?.task !== task) {
      continue;
    }
    const start = match.index ?? 0;
    SECTION_HEADING_RE.lastIndex = (match.index ?? 0) + match[0].length;
    const nextSection = SECTION_HEADING_RE.exec(planText);
    const end = nextSection?.index ?? planText.length;
    return [match.groups.title.trim(), planText.slice(start, end).trim()];
  }
  throw new PromptBuildError(`requested task ${task} was not found in TED`);
}

export function reviewInputFailures(options: {
  kind: string;
  json: boolean;
  implementerReport: string;
  baseSha: string;
  headSha: string;
  expectedSourceHash?: string;
}): string[] {
  const failures: string[] = [];
  const emitsImplementerPrompt = options.kind === "implementer" || options.kind === "all";
  if (emitsImplementerPrompt && !options.expectedSourceHash) {
    failures.push("--expected-source-hash is required for implementer prompts");
  }
  const emitsReviewPrompts = ["spec-reviewer", "code-quality-reviewer"].includes(options.kind) || (options.kind === "all" && options.json);
  if (!emitsReviewPrompts) {
    return failures;
  }
  if (options.implementerReport === "[待实现子代理回报后填入]") {
    failures.push("--implementer-report is required for review prompts");
  }
  const emitsCodeQualityPrompt = ["all", "code-quality-reviewer"].includes(options.kind);
  if (emitsCodeQualityPrompt) {
    if (options.baseSha === "[commit before task]") {
      failures.push("--base-sha is required for code-quality-reviewer prompts");
    }
    if (options.headSha === "[current commit]") {
      failures.push("--head-sha is required for code-quality-reviewer prompts");
    }
  }
  return failures;
}

export function compactTaskName(title: string, task: string): string {
  let cleaned = title.replace(new RegExp(`[（(]\\s*${escapeRegExp(task)}\\s*/.*?[）)]`, "g"), "").trim();
  cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(task)}\\b`, "g"), "").trim().replace(/^[-:/\s]+|[-:/\s]+$/g, "");
  return cleaned || task;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildContextBlock(brief: Record<string, any>, options: { tedPath: string; sourceHash: string; task: string }): string {
  const mustRead = (brief.must_read.length ? brief.must_read : ["-"]).map((path: string) => `- ${path}`).join("\n");
  const maySkip = (brief.may_skip.length ? brief.may_skip : ["-"]).map((path: string) => `- ${path}`).join("\n");
  const focusSections = (brief.focus_sections.length ? brief.focus_sections : ["-"]).map((section: string) => `- ${section}`).join("\n");
  return `TED path: ${options.tedPath}
TED source_hash: ${options.sourceHash}
Brief command: coding-plugins workflow-brief --task ${options.task} --feature ${brief.feature} --doc-id ${brief.doc_id} --target execute --json
Execution source: ${brief.execution_source}
New plan policy: ${brief.new_plan_policy}

Must read:
${mustRead}

May skip unless rewind triggers fire:
${maySkip}

Focus sections:
${focusSections}

Context rule: Do not read the full TED or upstream PRD/TSD/TVD on your own. Work only from the task text, execution-lock summary, and necessary context pasted by the main agent. If rewind triggers fire or context is insufficient, return NEEDS_CONTEXT.`;
}

function buildImplementerPrompt(options: { task: string; taskName: string; taskSection: string; context: string; workdir: string }): string {
  const template = readFencedText(resolve(SUBAGENT_SKILL_DIR, "implementer-prompt.md"));
  return template
    .replaceAll("任务 N: [task name]", `任务 ${options.task}: ${options.taskName}`)
    .replaceAll("Task N: [task name]", `Task ${options.task}: ${options.taskName}`)
    .replaceAll("[FULL TEXT of task from plan - 粘贴在这里，不要让子代理自己读文件]", options.taskSection)
    .replaceAll("[FULL TEXT of the task from the plan - paste it here; do not make the agent read files on its own]", options.taskSection)
    .replaceAll("[说明该任务在整体中的位置、依赖、架构背景]", options.context)
    .replaceAll("[Explain where this task sits in the overall work, dependencies, and architecture background]", options.context)
    .replaceAll("工作目录：[directory]", `工作目录：${options.workdir}`)
    .replaceAll("Working directory: [directory]", `Working directory: ${options.workdir}`);
}

function buildSpecReviewerPrompt(options: { task: string; taskSection: string; implementerReport: string }): string {
  const template = readFencedText(resolve(SUBAGENT_SKILL_DIR, "spec-reviewer-prompt.md"));
  const specIds = [...new Set(options.taskSection.match(/\bREQ-\d+\b/g) ?? [])].join(", ") || options.task;
  return template
    .replaceAll("Review spec compliance for 任务 N", `Review spec compliance for 任务 ${options.task}`)
    .replaceAll("[FULL TEXT of task requirements]", options.taskSection)
    .replaceAll("[From implementer's report]", options.implementerReport)
    .replaceAll("[SPEC_IDS]", specIds)
    .replaceAll("[TASK_TEXT]", options.taskSection)
    .replaceAll("[SUMMARY]", options.implementerReport)
    .replaceAll("[EVIDENCE]", options.implementerReport);
}

function buildCodeQualityPrompt(options: {
  task: string;
  taskName: string;
  taskSection: string;
  implementerReport: string;
  baseSha: string;
  headSha: string;
}): string {
  const template = readFencedText(CODE_REVIEWER_TEMPLATE);
  const description = options.implementerReport.trim() || `任务 ${options.task}: ${options.taskName}`;
  const requirements = `任务 ${options.task}: ${options.taskName}\n\n${options.taskSection}`;
  let prompt = template
    .replaceAll("{DESCRIPTION}", description)
    .replaceAll("{PLAN_OR_REQUIREMENTS}", requirements)
    .replaceAll("{BASE_SHA}", options.baseSha)
    .replaceAll("{HEAD_SHA}", options.headSha);
  const extra = readAfterFence(resolve(SUBAGENT_SKILL_DIR, "code-quality-reviewer-prompt.md"));
  if (extra) {
    prompt = `${prompt}\n\n## 子代理代码质量补充检查\n\n${extra}`;
  }
  return prompt;
}

function kindsToGenerate(kind: string): string[] {
  if (kind === "all") {
    return [...PROMPT_KINDS];
  }
  if (!PROMPT_KINDS.includes(kind as any)) {
    throw new PromptBuildError(`unknown prompt kind: ${kind}`);
  }
  return [kind];
}

function promptPlaceholderLeaks(prompt: string): string[] {
  return INPUT_PLACEHOLDER_MARKERS.filter((marker) => prompt.includes(marker));
}

function fileCountFromTaskSection(taskSection: string): number {
  return new Set([...taskSection.matchAll(/`([^`]+\.[A-Za-z0-9]+)`/g)].map((match) => match[1])).size;
}

function riskLevelForTask(taskSection: string): [string, string[]] {
  const riskTerms: Record<string, string[]> = {
    security: ["安全", "secret", "credential", "token", "权限"],
    data: ["数据", "schema", "migration", "迁移", "删除"],
    release: ["release", "发布", "CI", "preflight"],
  };
  const matched: string[] = [];
  const lowered = taskSection.toLowerCase();
  for (const [reason, terms] of Object.entries(riskTerms)) {
    if (terms.some((term) => lowered.includes(term.toLowerCase()))) {
      matched.push(reason);
    }
  }
  if (matched.length >= 2) {
    return ["high", matched];
  }
  if (matched.length > 0) {
    return ["medium", matched];
  }
  return ["low", ["mechanical-task"]];
}

export function recommendModelTier(kind: string, options: { taskSection: string; promptChars: number }): [string, string[]] {
  const fileCount = fileCountFromTaskSection(options.taskSection);
  const [riskLevel, riskReasons] = riskLevelForTask(options.taskSection);
  const reasonCodes = [...riskReasons];
  if (fileCount >= 6) {
    reasonCodes.push("many-files");
  }
  if (options.promptChars > 10_000) {
    reasonCodes.push("large-prompt");
  }

  if (kind === "implementer") {
    if (riskLevel === "low" && fileCount <= 3 && options.promptChars <= 8_000) {
      return ["low-cost", ["mechanical-implementation", ...reasonCodes]];
    }
    return ["standard", ["implementation-needs-context", ...reasonCodes]];
  }
  if (kind === "spec-reviewer") {
    return ["standard", ["spec-compliance-review", ...reasonCodes]];
  }
  if (riskLevel === "high" || fileCount >= 6) {
    return ["strong", ["code-quality-review-high-risk", ...reasonCodes]];
  }
  return ["standard", ["code-quality-review", ...reasonCodes]];
}

function promptBudgetEntry(kind: string, prompt: string, taskSection: string): Record<string, any> {
  const [tier, reasonCodes] = recommendModelTier(kind, { taskSection, promptChars: prompt.length });
  const maxChars = PROMPT_BUDGET_MAX_CHARS[kind];
  const estimatedTokens = Math.max(1, Math.ceil(prompt.length / 4));
  const maxEstimatedTokens = Math.ceil(maxChars / 4);
  return {
    chars: prompt.length,
    max_chars: maxChars,
    estimated_tokens: estimatedTokens,
    max_estimated_tokens: maxEstimatedTokens,
    within_budget: prompt.length <= maxChars,
    placeholder_leaks: promptPlaceholderLeaks(prompt),
    recommended_model_tier: tier,
    reason_codes: reasonCodes,
  };
}

function costStrategyEntry(kind: string, budget: Record<string, any>, taskSection: string): Record<string, any> {
  return {
    recommended_model_tier: budget.recommended_model_tier,
    reason_codes: budget.reason_codes,
    inputs: {
      kind,
      prompt_chars: budget.chars,
      estimated_tokens: budget.estimated_tokens,
      task_section_chars: taskSection.length,
      file_count: fileCountFromTaskSection(taskSection),
      risk_level: riskLevelForTask(taskSection)[0],
    },
  };
}

export function buildPrompts(
  root: string,
  options: {
    feature: string;
    docId: string;
    task: string;
    kind?: string;
    workdir?: string;
    implementerReport?: string;
    baseSha?: string;
    headSha?: string;
    expectedSourceHash?: string;
  },
): Record<string, any> {
  const kind = options.kind ?? "all";
  const implementerReport = options.implementerReport ?? "[待实现子代理回报后填入]";
  const baseSha = options.baseSha ?? "[commit before task]";
  const headSha = options.headSha ?? "[current commit]";
  const brief = buildBrief(root, { feature: options.feature, docId: options.docId, target: "execute", task: options.task });
  if (!brief.pass) {
    const failures = brief.failures.join("; ") || brief.reason;
    throw new PromptBuildError(`workflow brief did not pass: ${failures}`);
  }
  if (brief.must_read.length === 0) {
    throw new PromptBuildError("workflow brief did not identify a TED path");
  }

  const tedRel = brief.must_read[0];
  const tedPath = resolve(root, tedRel);
  const tedText = readFileSync(tedPath, "utf8");
  const [taskTitle, taskSection] = extractTaskSection(tedText, options.task);
  const taskName = compactTaskName(taskTitle, options.task);
  const sourceHash = parseFrontmatter(tedPath).source_hash;
  if (!sourceHash) {
    throw new PromptBuildError("TED source_hash is missing");
  }
  if (options.expectedSourceHash && options.expectedSourceHash !== sourceHash) {
    throw new PromptBuildError(`expected source_hash mismatch: expected ${options.expectedSourceHash}, current ${sourceHash}`);
  }

  const context = buildContextBlock(brief, { tedPath: tedRel, sourceHash, task: options.task });
  const resolvedWorkdir = options.workdir ?? root;
  const generatedKinds = kindsToGenerate(kind);
  const prompts: Record<string, string> = {};
  if (generatedKinds.includes("implementer")) {
    prompts.implementer = buildImplementerPrompt({
      task: options.task,
      taskName,
      taskSection,
      context,
      workdir: resolvedWorkdir,
    });
  }
  if (generatedKinds.includes("spec-reviewer")) {
    prompts["spec-reviewer"] = buildSpecReviewerPrompt({
      task: options.task,
      taskSection,
      implementerReport,
    });
  }
  if (generatedKinds.includes("code-quality-reviewer")) {
    prompts["code-quality-reviewer"] = buildCodeQualityPrompt({
      task: options.task,
      taskName,
      taskSection,
      implementerReport,
      baseSha,
      headSha,
    });
  }

  const promptBudget = Object.fromEntries(Object.entries(prompts).map(([name, prompt]) => [name, promptBudgetEntry(name, prompt, taskSection)]));

  return {
    feature: options.feature,
    doc_id: options.docId,
    task_id: options.task,
    task_title: taskTitle,
    task_name: taskName,
    ted_path: tedRel,
    source_hash: sourceHash,
    brief,
    generated_kinds: generatedKinds,
    context_compression: {
      strategy: "task-section-plus-brief",
      task_section_chars: taskSection.length,
      context_block_chars: context.length,
      must_read_count: brief.must_read.length,
      may_skip_count: brief.may_skip.length,
      source_hash: sourceHash,
      boundary: "current TED task section plus workflow brief; upstream docs stay in may_skip unless rewind triggers fire",
    },
    prompt_budget: promptBudget,
    cost_strategy: Object.fromEntries(Object.entries(promptBudget).map(([name, budget]) => [name, costStrategyEntry(name, budget as Record<string, any>, taskSection)])),
    prompt_hashes: Object.fromEntries(Object.entries(prompts).map(([name, prompt]) => [name, sha256Text(prompt)])),
    prompts,
  };
}

export function outputPayloadForKind(payload: Record<string, any>, kind: string): Record<string, any> {
  if (kind === "all") {
    return payload;
  }
  return {
    ...payload,
    prompt_hashes: { [kind]: payload.prompt_hashes[kind] },
    prompts: { [kind]: payload.prompts[kind] },
  };
}
