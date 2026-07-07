import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { computeUpstreamHash } from "../workflow/workflow-state.ts";

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
  const tsdPath = docsPath(options.feature, "technicals", `${options.docId}-TSD.md`);
  const tvdPath = docsPath(options.feature, "test-cases", `${options.docId}-TVD.md`);
  const tedPath = docsPath(options.feature, "plans", `${options.docId}-TED.md`);
  const vedPath = docsPath(options.feature, "evidences", `${options.docId}-VED.md`);
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
        relatedDocs([tsdPath, tvdPath, tedPath, vedPath]),
    ) +
      `# ${options.title} PRD\n\n` +
      "## 需求总览\n\n" +
      "| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |\n" +
      "| --- | --- | --- | --- | --- |\n" +
      `| REQ-001 | ${options.title} | 必须 | fixture | contract 测试 |\n\n` +
      "## 成功指标\n\n" +
      "- 业务或用户指标：fixture 能稳定复现并覆盖该流程风险。\n" +
      "- 质量指标：完整文档链路通过 schema 和 preflight 校验。\n" +
      "- 观测方式：自动化测试读取生成的 PRD/TSD/TVD/TED/VED。\n\n" +
      "## 假设与依赖\n\n" +
      "- 假设：fixture 用例代表一个真实维护风险。\n" +
      "- 依赖：依赖本仓库文档 schema、workflow-state 和 preflight。\n" +
      "- 约束变化处理：fixture 风险变化时同步更新 CASE-INDEX 和文档链。\n\n" +
      "## 开放问题\n\n" +
      "- 无：fixture 只沉淀已知风险，不承载待确认产品范围。\n\n" +
      `## ${options.title}（REQ-001）\n\n` +
      "### 需求描述\n\n" +
      `${options.optimizationTarget}\n\n` +
      "## 追踪矩阵\n\n" +
      "| 规格 ID | 验证类型 | 验证证据 | 状态 |\n" +
      "| --- | --- | --- | --- |\n" +
      "| REQ-001 | contract | 同一 `doc_id` 的 VED | 已覆盖 |\n",
  );

  write(
    join(root, tsdPath),
    frontmatter(
      `${options.title} TSD`,
      options.feature,
      options.docId,
      currentDate,
      "lifecycle_status: approved\n" +
        relatedDocs([prdPath, tvdPath, tedPath, vedPath]),
    ) +
      `# ${options.title} TSD\n\n` +
      "## 规格缺口审查\n\n" +
      "- 未覆盖需求：无，REQ-001 已覆盖。\n" +
      "- 验收标准不清：无，fixture 校验目标已在 PRD 固定。\n" +
      "- 新增外部行为：无，fixture 只维护测试文档链。\n" +
      "- 处理状态：通过。\n\n" +
      "## 规格到设计映射\n\n" +
      "| 规格 ID | 技术落点 | 设计决策 | 测试策略 |\n" +
      "| --- | --- | --- | --- |\n" +
      "| REQ-001 | `tests/fixtures` | fixture 文档链路覆盖 | contract 测试 |\n\n" +
      "## 备选方案\n\n" +
      "- 方案 A：只在 CASE-INDEX 记录风险；成本低，但无法验证文档链路。\n" +
      "- 方案 B：生成完整 PRD/TSD/TVD/TED/VED fixture；可回归验证链路完整性。\n" +
      "- 取舍结论：选择方案 B，作为自动化质量证据。\n\n" +
      "## 非功能设计\n\n" +
      "- 性能：fixture 文件较小，不引入运行时性能影响。\n" +
      "- 安全 / 隐私：fixture 不包含真实用户数据或密钥。\n" +
      "- 可靠性 / 可观测性：preflight 和 schema validate 负责发现漂移。\n" +
      "- 可维护性：生成器集中维护 fixture 文档骨架。\n\n" +
      "## 上线 / 回滚\n\n" +
      "- 上线方式：随测试 fixture 和生成器一起发布。\n" +
      "- 回滚方式：回退生成器和对应 fixture 测试。\n" +
      "- 回滚验证：重新运行 fixture scaffold 测试和 preflight。\n\n" +
      "## 测试策略\n\n" +
      "- REQ-001：使用 contract/source-scan 测试验证生成链路、source_hash 和 schema。\n",
  );

  write(
    join(root, tvdPath),
    frontmatter(
      `${options.title} TVD`,
      options.feature,
      options.docId,
      currentDate,
      relatedDocs([prdPath, tsdPath, tedPath, vedPath]),
    ) +
      `# ${options.title} TVD\n\n` +
      "## 测试策略摘要\n\n" +
      "使用 contract 测试验证 fixture 文档链路、source_hash 和 schema 覆盖。\n\n" +
      "## 风险到测试映射\n\n" +
      "- REQ-001 / 风险：fixture 只记录风险但没有完整文档链。\n" +
      "  - 测试覆盖：TC-001 验证生成的 PRD/TSD/TVD/TED/VED 和 schema。\n\n" +
      "## 测试环境与数据\n\n" +
      "- 环境：本地临时目录。\n" +
      "- 数据：由 scaffoldFixtureCase 生成的 fixture 文档。\n" +
      "- 隔离：测试结束删除临时目录。\n\n" +
      "## 测试用例总览\n\n" +
      "| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |\n" +
      "| --- | --- | --- | --- | --- | --- |\n" +
      `| TC-001 | ${options.title} | REQ-001 | contract | 自动化 | VED |\n\n` +
      "## 通过 / 失败标准\n\n" +
      "- 通过标准：生成链路完整，workflow state ready-for-execution，schema validate 通过。\n" +
      "- 阻塞失败：缺少文档、source_hash stale、Spec 覆盖缺失或 schema 失败。\n" +
      "- 非阻塞风险：无。\n\n" +
      "## 自动化状态\n\n" +
      "- 自动化覆盖：TC-001 由 scaffold-fixture-case 测试覆盖。\n" +
      "- 人工验收：不需要。\n" +
      "- 暂不覆盖：无。\n",
  );

  const sourceHash = computeUpstreamHash(root, { feature: options.feature, docId: options.docId });
  if (!sourceHash) {
    throw new Error(`could not compute source_hash for ${options.feature}/${options.docId}`);
  }

  write(
    join(root, tedPath),
    frontmatter(
      `${options.title} Task Execution Document`,
      options.feature,
      options.docId,
      currentDate,
      `source_hash: ${sourceHash}\n` +
        relatedDocs([prdPath, tsdPath, tvdPath, vedPath]),
    ) +
      `# ${options.title} 任务执行文档（TED）\n\n` +
      "## 执行锁定区\n\n" +
      `- **Intent Lock:** 只执行 ${options.title} fixture 链路校验。\n` +
      "- **Scope Fence:** 包含 fixture 文档链路；不包含发布、缓存刷新或仓库集成。\n" +
      "- **Required Spec IDs:** REQ-001\n" +
      "- **Required Tests:** `npm run preflight`\n" +
      "- **Review Gates:** 检查 TED source_hash、执行简报和 TASK-001 追踪。\n" +
      "- **Rewind Triggers:** 上游 PRD/TSD/TVD 变更、source_hash 不匹配或 fixture 校验失败。\n\n" +
      "## 执行简报\n\n" +
      "- **执行来源:** 只按本 TED 的任务章节执行。\n" +
      "- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。\n" +
      "- **可跳过内容:** PRD/TSD/TVD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。\n" +
      "- **新计划策略:** 每次新计划新建 TED，不向旧 TED 追加任务。\n\n" +
      "## 任务总览\n\n" +
      "| 任务 | 标题 | 覆盖规格 | 验证方式 | VED 记录 |\n" +
      "| --- | --- | --- | --- | --- |\n" +
      `| TASK-001 | ${options.title} | REQ-001 | preflight fixture 校验 | 同一 \`doc_id\` 的 VED |\n\n` +
      "## 任务依赖与并行性\n\n" +
      "- TASK-001：无前置任务；必须串行确认 source_hash 和 schema 后完成。\n" +
      "- 可并行任务：无，fixture 生成链路需要保持同一 doc_id 一致。\n" +
      "- 任务完成定义：生成文档存在、workflow state ready-for-execution、schema validate 通过。\n\n" +
      `## ${options.title}（TASK-001 / REQ-001）\n\n` +
      "### 执行步骤\n\n" +
      "- [ ] 运行 fixture 校验。\n\n" +
      "## 中止条件\n\n" +
      "- 上游变更：PRD、TSD 或 TVD 变更导致 `source_hash` 不匹配。\n" +
      "- 范围漂移：fixture 用例开始承载真实发布、缓存刷新或仓库集成。\n" +
      "- 验证失败：schema validate、workflow state 或 preflight fixture 校验失败。\n",
  );

  write(
    join(root, vedPath),
    frontmatter(
      `${options.title} VED`,
      options.feature,
      options.docId,
      currentDate,
      relatedDocs([prdPath, tsdPath, tvdPath, tedPath]),
    ) +
      `# ${options.title} VED\n\n` +
      "## TDD 证据\n\n" +
      "- **规格/缺陷/验收:** REQ-001\n" +
      "- **测试类型:** `contract`\n" +
      "- **最终验证:** PASS：fixture 文档链路通过。\n",
  );

  return featureRoot;
}
