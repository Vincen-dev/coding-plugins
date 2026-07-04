export const VALID_MODES = new Set([
    "analysis-only",
    "docs-only",
    "tdd-only",
    "full-chain",
    "maintenance-chain",
]);
const DOC_CONFIG_EXTENSIONS = new Set([
    ".md",
    ".markdown",
    ".txt",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
]);
const ANALYSIS_KEYWORDS = ["分析", "解释", "读取", "查看", "状态", "不要改代码", "不改代码", "先分析", "review"];
const DOCS_KEYWORDS = ["文档", "README", "说明", "安装", "索引", "release notes", "changelog"];
const CONTRACT_KEYWORDS = [
    "api",
    "schema",
    "interface",
    "接口",
    "契约",
    "状态机",
    "协议",
    "公开",
    "兼容",
    "验收标准",
];
const MAINTENANCE_KEYWORDS = ["重构", "迁移", "升级", "依赖", "安全", "性能", "稳定性", "缓存格式"];
const MAINTENANCE_RISK_KEYWORDS = ["外部行为", "兼容", "验证口径", "回滚", "灰度", "数据", "schema", "api", "接口"];
const BEHAVIOR_KEYWORDS = ["修复", "实现", "新增", "行为", "bug", "测试", "按钮", "流程"];
function normalize(text) {
    return text.toLowerCase();
}
function hasAny(text, keywords) {
    const lower = normalize(text);
    return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}
function suffix(path) {
    const index = path.lastIndexOf(".");
    return index === -1 ? "" : path.slice(index).toLowerCase();
}
function docOrConfigOnly(files) {
    if (files.length === 0) {
        return false;
    }
    return files.every((path) => DOC_CONFIG_EXTENSIONS.has(suffix(path)));
}
export function inferMode(intent, options = {}) {
    const files = options.files ?? [];
    const taskCount = options.taskCount ?? 0;
    const text = [intent, ...files].join(" ");
    if (options.explicitMode) {
        if (!VALID_MODES.has(options.explicitMode)) {
            throw new Error(`invalid workflow mode: ${options.explicitMode}`);
        }
        return {
            mode: options.explicitMode,
            explicit: true,
            reason: `explicit workflow mode '${options.explicitMode}' was requested`,
        };
    }
    if (hasAny(text, MAINTENANCE_KEYWORDS) && hasAny(text, MAINTENANCE_RISK_KEYWORDS)) {
        return {
            mode: "maintenance-chain",
            explicit: false,
            reason: "maintenance work has compatibility, data, API, or verification risk",
        };
    }
    if (hasAny(text, CONTRACT_KEYWORDS)) {
        return {
            mode: "full-chain",
            explicit: false,
            reason: "contract, schema, API, state-machine, compatibility, or acceptance scope detected",
        };
    }
    if (hasAny(text, ANALYSIS_KEYWORDS) && !hasAny(text, BEHAVIOR_KEYWORDS)) {
        return {
            mode: "analysis-only",
            explicit: false,
            reason: "analysis-only request without implementation intent",
        };
    }
    if (docOrConfigOnly(files) && hasAny(text, DOCS_KEYWORDS) && !hasAny(text, BEHAVIOR_KEYWORDS)) {
        return {
            mode: "docs-only",
            explicit: false,
            reason: "documentation/config-only files with no behavior keywords",
        };
    }
    if (taskCount <= 2 && files.length <= 2 && hasAny(text, BEHAVIOR_KEYWORDS)) {
        return {
            mode: "tdd-only",
            explicit: false,
            reason: "small clear behavior change: ≤2 tasks, ≤2 files, no formal contract keywords",
        };
    }
    return {
        mode: "full-chain",
        explicit: false,
        reason: "default for feature, behavior, or unclear contract work",
    };
}
