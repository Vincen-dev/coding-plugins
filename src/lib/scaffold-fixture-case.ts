import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { computeUpstreamHash } from "./workflow-state.ts";

const SLUG_RE = /^[A-Za-z0-9_.-]+$/;

export interface ScaffoldFixtureCaseOptions {
  feature: string;
  docId: string;
  title: string;
  caseId: string;
  sourceType: string;
  sourceReference: string;
  optimizationTarget: string;
  coveredRisk: string;
  currentDate?: string;
}

export function validateSlug(label: string, value: string): void {
  if (!SLUG_RE.test(value)) {
    throw new Error(`${label} must be a flat slug using letters, digits, dots, underscores or hyphens: ${value}`);
  }
}

export function docsPath(feature: string, directory: string, filename: string): string {
  return `docs/coding-plugins/features/${feature}/${directory}/${filename}`;
}

function write(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function appendCaseIndex(root: string, options: ScaffoldFixtureCaseOptions): void {
  const indexPath = join(root, "CASE-INDEX.md");
  let text: string;
  if (existsSync(indexPath)) {
    text = `${readFileSync(indexPath, "utf8").trimEnd()}\n\n`;
    if (text.includes(`## ${options.feature}`)) {
      throw new Error(`CASE-INDEX.md already contains feature: ${options.feature}`);
    }
  } else {
    text = "# Formal Feature Chain Case Index\n\n本索引用于说明 fixture 中每个案例的来源、优化目标和覆盖风险。\n\n";
  }
  text +=
    `## ${options.feature}\n\n` +
    `- case_id: ${options.caseId}\n` +
    `- source_type: ${options.sourceType}\n` +
    `- source_reference: ${options.sourceReference}\n` +
    `- optimization_target: ${options.optimizationTarget}\n` +
    "- covered_risks:\n" +
    `  - ${options.coveredRisk}\n`;
  writeFileSync(indexPath, text, "utf8");
}

function frontmatter(title: string, feature: string, docId: string, date: string, extra = ""): string {
  return (
    "---\n" +
    `title: ${title}\n` +
    "status: approved\n" +
    `feature: ${feature}\n` +
    `doc_id: ${docId}\n` +
    `created: ${date}\n` +
    `updated: ${date}\n` +
    extra +
    "---\n"
  );
}

function relatedDocs(paths: string[]): string {
  if (paths.length === 0) {
    return "related_docs: []\n";
  }
  return "related_docs:\n" + paths.map((path) => `  - ${path}\n`).join("");
}

export function scaffoldFixtureCase(root: string, options: ScaffoldFixtureCaseOptions): string {
  validateSlug("feature", options.feature);
  validateSlug("doc_id", options.docId);
  const currentDate = options.currentDate ?? new Date().toISOString().slice(0, 10);

  const prdPath = docsPath(options.feature, "requirements", `${options.docId}-PRD.md`);
  const tddPath = docsPath(options.feature, "technicals", `${options.docId}-TDD.md`);
  const tidPath = docsPath(options.feature, "technicals", `${options.docId}-TID.md`);
  const tcdPath = docsPath(options.feature, "test-cases", `${options.docId}-TCD.md`);
  const ipdPath = docsPath(options.feature, "plans", `${options.docId}-IPD.md`);
  const tedPath = docsPath(options.feature, "evidences", `${options.docId}-TED.md`);
  const featureRoot = join(root, "docs/coding-plugins/features", options.feature);

  appendCaseIndex(root, options);

  write(
    join(featureRoot, "README.md"),
    "---\n" +
      `title: ${options.title}\n` +
      "status: approved\n" +
      `feature: ${options.feature}\n` +
      `updated: ${currentDate}\n` +
      "tags:\n" +
      "  - fixture\n" +
      "---\n" +
      `# ${options.title}\n\n` +
      "## 文档信息\n\n" +
      "| 字段 | 内容 |\n" +
      "| --- | --- |\n" +
      "| 状态 | approved |\n" +
      `| Feature | ${options.feature} |\n`,
  );

  write(
    join(root, prdPath),
    frontmatter(
      `${options.title} PRD`,
      options.feature,
      options.docId,
      currentDate,
      "type: feature\n" +
        relatedDocs([tddPath, tidPath, tcdPath, ipdPath, tedPath]),
    ) +
      `# ${options.title} PRD\n\n` +
      "## 需求总览\n\n" +
      "| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |\n" +
      "| --- | --- | --- | --- | --- |\n" +
      `| REQ-001 | ${options.title} | 必须 | fixture | contract 测试 |\n\n` +
      `## ${options.title}（REQ-001）\n\n` +
      "### 需求描述\n\n" +
      `${options.optimizationTarget}\n\n`,
  );

  write(
    join(root, tddPath),
    frontmatter(
      `${options.title} TDD`,
      options.feature,
      options.docId,
      currentDate,
      "lifecycle_status: approved\n" +
        relatedDocs([prdPath, tidPath, tcdPath, ipdPath, tedPath]),
    ) +
      `# ${options.title} TDD\n\n` +
      "## 规格到设计映射\n\n" +
      "| 规格 ID | 技术落点 | 设计决策 | 测试策略 |\n" +
      "| --- | --- | --- | --- |\n" +
      "| REQ-001 | `tests/fixtures` | fixture 文档链路覆盖 | contract 测试 |\n",
  );

  write(
    join(root, tidPath),
    frontmatter(
      `${options.title} TID`,
      options.feature,
      options.docId,
      currentDate,
      "lifecycle_status: approved\n" +
        relatedDocs([prdPath, tddPath, tcdPath, ipdPath, tedPath]),
    ) +
      `# ${options.title} TID\n\n` +
      "## 实现点总览\n\n" +
      "| 实现点 | 标题 | 覆盖规格 | 关联设计 | 主要落点 |\n" +
      "| --- | --- | --- | --- | --- |\n" +
      `| IMPL-001 | ${options.title} | REQ-001 | TD-001 | \`tests/fixtures\` |\n`,
  );

  write(
    join(root, tcdPath),
    frontmatter(
      `${options.title} TCD`,
      options.feature,
      options.docId,
      currentDate,
      relatedDocs([prdPath, tddPath, tidPath, ipdPath, tedPath]),
    ) +
      `# ${options.title} TCD\n\n` +
      "## 测试用例总览\n\n" +
      "| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |\n" +
      "| --- | --- | --- | --- | --- | --- |\n" +
      `| TC-001 | ${options.title} | REQ-001 | contract | 自动化 | TED |\n`,
  );

  const sourceHash = computeUpstreamHash(root, { feature: options.feature, docId: options.docId });
  if (!sourceHash) {
    throw new Error(`could not compute source_hash for ${options.feature}/${options.docId}`);
  }

  write(
    join(root, ipdPath),
    frontmatter(
      `${options.title} Implementation Procedure Document`,
      options.feature,
      options.docId,
      currentDate,
      `source_hash: ${sourceHash}\n` +
        relatedDocs([prdPath, tddPath, tidPath, tcdPath, tedPath]),
    ) +
      `# ${options.title} 任务执行文档（IPD）\n\n` +
      "## 执行锁定区\n\n" +
      `- **Intent Lock:** 只执行 ${options.title} fixture 链路校验。\n` +
      "- **Scope Fence:** 包含 fixture 文档链路；不包含发布、缓存刷新或仓库集成。\n" +
      "- **Required Spec IDs:** REQ-001\n" +
      "- **Required Tests:** `npm run preflight`\n" +
      "- **Review Gates:** 检查 IPD source_hash、执行简报和 TASK-001 追踪。\n" +
      "- **Rewind Triggers:** 上游 PRD/TDD/TID/TCD 变更、source_hash 不匹配或 fixture 校验失败。\n\n" +
      "## 执行简报\n\n" +
      "- **执行来源:** 只按本 IPD 的任务章节执行。\n" +
      "- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。\n" +
      "- **可跳过内容:** PRD/TDD/TID/TCD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。\n" +
      "- **新计划策略:** 每次新计划新建 IPD，不向旧 IPD 追加任务。\n\n" +
      "## 任务总览\n\n" +
      "| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |\n" +
      "| --- | --- | --- | --- | --- |\n" +
      `| TASK-001 | ${options.title} | REQ-001 | preflight fixture 校验 | \`${tedPath}\` |\n\n` +
      `## ${options.title}（TASK-001 / REQ-001）\n\n` +
      "### 执行步骤\n\n" +
      "- [ ] 运行 fixture 校验。\n",
  );

  write(
    join(root, tedPath),
    frontmatter(
      `${options.title} TED`,
      options.feature,
      options.docId,
      currentDate,
      relatedDocs([prdPath, tddPath, tidPath, tcdPath, ipdPath]),
    ) +
      `# ${options.title} TED\n\n` +
      "## TDD 证据\n\n" +
      "- **规格/缺陷/验收:** REQ-001\n" +
      "- **测试类型:** `contract`\n" +
      "- **最终验证:** PASS：fixture 文档链路通过。\n",
  );

  return featureRoot;
}
