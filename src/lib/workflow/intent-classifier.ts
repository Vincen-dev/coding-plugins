export type IntentKind = "inspect" | "change" | "continue" | "approve" | "complete";
export type ScopeKnowledge = "known" | "unknown";
export type RiskLevel = "low" | "medium" | "high";

export interface IntentClassificationOptions {
  plannedFiles?: string[];
  taskCount?: number;
  featureCount?: number;
}

export interface IntentClassification {
  intentKind: IntentKind;
  requestedAction: string;
  scopeKnowledge: ScopeKnowledge;
  riskLevel: RiskLevel;
  riskSignals: string[];
  confidence: "certain" | "uncertain";
}

const READ_ONLY_MARKERS = ["分析", "比较", "解释", "查看", "读取", "review", "评审", "状态"];
const EXECUTION_MARKERS = [
  "开始实现",
  "开始修改",
  "开始进行",
  "帮我修改",
  "请实现",
  "直接实现",
  "落地实现",
  "修改",
  "改为",
  "修复",
  "新增",
  "优化",
];

const RISK_RULES: Array<[string, string[]]> = [
  ["public-api", ["public api", "公开 api", "公开接口", "public interface"]],
  ["schema", ["schema", "protobuf", "数据库结构", "数据结构迁移"]],
  ["migration", ["migration", "迁移", "兼容窗口"]],
  ["compatibility", ["compatibility", "兼容"]],
  ["security", ["security", "安全", "权限", "密钥"]],
  ["release", ["release", "发布", "上线"]],
  ["sdk", [" sdk", "sdk ", "sdk、", "sdk，"]],
  ["cross-repository", ["跨仓库", "cross-repository", "multiple repositories"]],
  ["multi-feature", ["多 feature", "多个 feature", "multiple features"]],
];

function includesAny(text: string, markers: string[]): boolean {
  return markers.some((marker) => text.includes(marker));
}

function detectRiskSignals(text: string): string[] {
  return RISK_RULES.filter(([, markers]) => includesAny(text, markers)).map(([signal]) => signal);
}

function scopeIsKnown(options: IntentClassificationOptions): boolean {
  return options.plannedFiles !== undefined || options.taskCount !== undefined || options.featureCount !== undefined;
}

export function classifyIntent(intent: string, options: IntentClassificationOptions = {}): IntentClassification {
  const text = intent.trim().toLowerCase();
  const hasReadOnlyMarker = includesAny(text, READ_ONLY_MARKERS);
  const hasExecutionMarker = includesAny(text, EXECUTION_MARKERS);
  const riskSignals = detectRiskSignals(` ${text} `);

  let intentKind: IntentKind;
  if (/^(继续|continue|resume)\b/i.test(text) || text.startsWith("继续")) {
    intentKind = "continue";
  } else if (includesAny(text, ["批准", "approve"])) {
    intentKind = "approve";
  } else if (includesAny(text, ["完成", "complete", "结束任务"])) {
    intentKind = "complete";
  } else if (hasReadOnlyMarker && !hasExecutionMarker) {
    intentKind = "inspect";
  } else {
    intentKind = "change";
  }

  return {
    intentKind,
    requestedAction: intentKind,
    scopeKnowledge: scopeIsKnown(options) ? "known" : "unknown",
    riskLevel: riskSignals.length > 0 ? "high" : hasExecutionMarker ? "medium" : "low",
    riskSignals,
    confidence: text ? "certain" : "uncertain",
  };
}
