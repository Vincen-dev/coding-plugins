import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { artifactDirectories, artifactFile } from "./document-metadata.js";
const FEATURE_NAME_RE = /^[A-Za-z0-9_.-]+$/;
export function validateFeatureName(feature) {
    if (!FEATURE_NAME_RE.test(feature)) {
        throw new Error("feature-name 只能包含字母、数字、点、下划线和连字符，不能包含路径分隔符。");
    }
}
function yamlList(values, fallback) {
    if (values.length > 0) {
        return values.map((value) => `  - ${value}`).join("\n");
    }
    if (fallback !== undefined) {
        return `  - ${fallback}`;
    }
    return "[]";
}
export function renderReadme(feature, title, status, updated, tags) {
    return ("---\n" +
        `title: ${title}\n` +
        `status: ${status}\n` +
        `feature: ${feature}\n` +
        `updated: ${updated}\n` +
        "tags:\n" +
        `${yamlList(tags, feature)}\n` +
        "---\n\n" +
        `# ${title}\n\n` +
        "## 文档信息\n\n" +
        "| 字段 | 内容 |\n" +
        "| --- | --- |\n" +
        `| 状态 | ${status} |\n` +
        `| Feature | ${feature} |\n\n` +
        "## 总览\n\n" +
        "请在本节用 2 到 4 句话说明 feature 目标、当前状态和主要文档入口。\n");
}
export function renderPrd(feature, docId, title, status, currentDate, tags) {
    const tagsText = yamlList(tags, feature);
    return ("---\n" +
        `title: ${title}需求文档\n` +
        "type: feature\n" +
        `status: ${status}\n` +
        `feature: ${feature}\n` +
        `doc_id: ${docId}\n` +
        `created: ${currentDate}\n` +
        `updated: ${currentDate}\n` +
        "tags:\n" +
        `${tagsText}\n` +
        "related_code: []\n" +
        "related_docs: []\n" +
        "---\n\n" +
        `# ${title}需求文档\n\n` +
        "## 文档信息\n\n" +
        "| 字段 | 内容 |\n" +
        "| --- | --- |\n" +
        `| 状态 | ${status} |\n` +
        `| Feature | ${feature} |\n` +
        `| Doc ID | ${docId} |\n` +
        "| 文档类型 | PRD |\n\n" +
        "关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。\n\n" +
        "## 目标\n\n" +
        "请写明要交付的能力、成功状态和可观察结果。\n\n" +
        "## 非目标\n\n" +
        "- NON-001：请写明本次明确不做的范围，以及不做的原因。\n\n" +
        "## 背景\n\n" +
        "- 当前行为：请写明现在系统或流程如何工作。\n" +
        "- 目标用户或调用方：请写明谁会使用或调用该能力。\n" +
        "- 约束：请写明兼容性、平台、性能、安全或时间限制。\n\n" +
        "## 成功指标\n\n" +
        "- 业务或用户指标：请写明完成后可观察的业务、用户或流程改善。\n" +
        "- 质量指标：请写明错误率、性能、稳定性、兼容性、人工验收或回归风险下降口径。\n" +
        "- 观测方式：请写明日志、测试、埋点、发布检查、人工验收或其他证据来源。\n\n" +
        "## 假设与依赖\n\n" +
        "- 假设：请写明本需求成立所依赖的业务、用户、数据或技术假设。\n" +
        "- 依赖：请写明外部系统、上游接口、权限、资源、时间窗口或版本约束。\n" +
        "- 约束变化处理：请写明假设或依赖不成立时，回到哪个需求点或决策点。\n\n" +
        "## 开放问题\n\n" +
        "- 无：没有开放问题时保留本项，并说明已确认范围。\n" +
        "- Q-001：请写明尚未确认但会影响范围、验收、兼容或测试的问题。\n\n" +
        "## 需求总览\n\n" +
        "| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |\n" +
        "| --- | --- | --- | --- | --- |\n" +
        "| REQ-001 | 请写明需求点标题。 | 必须 | feature | 请写明验证类型或人工验收证据。 |\n\n" +
        "## 请写明需求点标题（REQ-001）\n\n" +
        "### 用户或系统价值\n\n" +
        "请说明这个需求点解决谁的问题，以及完成后可观察到什么变化。\n\n" +
        "### 需求描述\n\n" +
        "请用业务语言说明这个需求点要什么，不写技术方案、代码文件或任务步骤。\n\n" +
        "### 行为规则\n\n" +
        "- 规则 1：请写明触发条件、期望行为和结果。\n" +
        "- 规则 2：请写明需要固定的业务约束、兼容要求或状态语义。\n\n" +
        "### 输入与输出\n\n" +
        "- 输入：请写明用户动作、调用参数、事件、状态或数据来源。\n" +
        "- 输出：请写明页面结果、API 响应、状态变化、数据写入或可观察日志。\n\n" +
        "### 关联契约\n\n" +
        "- API / SDK / CLI：不涉及。\n" +
        "- Schema / 数据：不涉及。\n" +
        "- 状态机 / 生命周期：不涉及。\n" +
        "- 维护 / 迁移 / 回归：不涉及。\n\n" +
        "### 错误和边界\n\n" +
        "| 编号 | 条件 | 期望行为 | 验证方式 |\n" +
        "| --- | --- | --- | --- |\n" +
        "| ERR-001 | 请写明错误或边界条件。 | 请写明明确结果。 | 请写明测试或验收证据。 |\n\n" +
        "### 验收标准\n\n" +
        "- AC-001：请写明场景名。\n" +
        "  - 前置条件：请写明前置条件。\n" +
        "  - 操作：请写明用户或系统动作。\n" +
        "  - 期望结果：请写明可观察结果。\n\n" +
        "### 验证方式\n\n" +
        "- 验证类型：请写明单元测试、集成测试、契约校验、端到端测试或人工验收。\n" +
        "- 覆盖对象：请写明需求点中的具体行为、契约、状态或边界。\n" +
        "- 后续沉淀：具体测试用例写入 TVD，执行任务写入 TED，实际证据写入 VED。\n\n" +
        "## 追踪矩阵\n\n" +
        "| 规格 ID | 验证类型 | 验证证据 | 状态 |\n" +
        "| --- | --- | --- | --- |\n" +
        "| REQ-001 | 请写明验证类型。 | TVD/VED 创建前写验证口径，创建后回填证据路径或命令。 | 计划中 |\n");
}
function writeFile(path, content, force) {
    if (existsSync(path) && !force) {
        return false;
    }
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content, "utf8");
    return true;
}
export function scaffoldFeature(root, feature, title, options = {}) {
    validateFeatureName(feature);
    const docId = options.docId ?? feature;
    validateFeatureName(docId);
    const status = options.status ?? "draft";
    const currentDate = options.currentDate ?? new Date().toISOString().slice(0, 10);
    const tags = options.tags && options.tags.length > 0 ? options.tags : [feature];
    const force = options.force ?? false;
    const featureRoot = join(root, "docs", "coding-plugins", "features", feature);
    for (const directory of artifactDirectories()) {
        mkdirSync(join(featureRoot, directory), { recursive: true });
    }
    const targets = new Map([
        [join(featureRoot, "README.md"), renderReadme(feature, title, status, currentDate, tags)],
        [artifactFile(featureRoot, "PRD", docId), renderPrd(feature, docId, title, status, currentDate, tags)],
    ]);
    const created = [];
    const skipped = [];
    for (const [path, content] of targets) {
        if (writeFile(path, content, force)) {
            created.push(path);
        }
        else {
            skipped.push(path);
        }
    }
    return { created, skipped };
}
