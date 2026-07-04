export const DECISION_POINTS = [
  {
    id: "DP-0",
    name: "进入正式链路确认",
    trigger: "方案讨论或任务意图准备从 brainstorming/analysis 转入正式 SDD 文档链路前。",
    required_input: "问题定义、目标、非目标、候选 workflow mode、是否创建正式 PRD 链路。",
    expected_output: "用户确认进入正式链路，或停留在分析/brainstorming/docs-only/tdd-only。",
    skills: ["brainstorming", "using-coding-plugins", "spec-driven-development"],
  },
  {
    id: "DP-1",
    name: "需求批准",
    trigger: "PRD 需求文档完成，准备进入 TDD/TID 技术文档前。",
    required_input: "PRD、Spec ID、MUST/SHOULD、非目标、验收和 Traceability Matrix。",
    expected_output: "用户批准 PRD，或要求回到 writing-requirements 修改。",
    skills: ["writing-requirements", "spec-driven-development"],
  },
  {
    id: "DP-2",
    name: "技术方案批准",
    trigger: "TDD/TID 技术文档完成，准备进入 TCD 测试用例前。",
    required_input: "TDD、TID、规格到设计映射、关键决策、实现边界和测试策略。",
    expected_output: "用户批准技术方案，或要求回到 writing-technicals 修改。",
    skills: ["writing-technicals"],
  },
  {
    id: "DP-3",
    name: "测试用例批准",
    trigger: "TCD 测试用例完成，准备进入 IPD 任务执行文档前。",
    required_input: "TCD、Spec ID 到测试用例映射、断言、测试数据和不可自动化验证说明。",
    expected_output: "用户批准测试设计，或要求回到 writing-test-cases 修改。",
    skills: ["writing-test-cases"],
  },
  {
    id: "DP-4",
    name: "执行计划批准",
    trigger: "IPD 任务执行文档完成，准备进入 worktree 和实现阶段前。",
    required_input: "IPD、source_hash、执行锁定区、任务总览、验证命令和 TED 目标。",
    expected_output: "用户批准执行计划，workflow_guard 通过后进入实现。",
    skills: ["writing-plans", "using-git-worktrees"],
  },
  {
    id: "DP-5",
    name: "TDD 例外或调试升级",
    trigger: "无法先写 RED、连续修复失败、bug 根因不明或需要偏离原 IPD。",
    required_input: "失败日志、RED 受阻原因、已尝试方案、替代验证和剩余风险。",
    expected_output: "用户批准 TDD 例外/调试方向，或要求回到规格、计划或实现修正。",
    skills: ["test-driven-development", "systematic-debugging"],
  },
  {
    id: "DP-6",
    name: "完成验证确认",
    trigger: "准备声明完成、修复、测试通过或进入提交前。",
    required_input: "最新验证命令、输出、规格覆盖、TED 证据和未覆盖风险。",
    expected_output: "验证通过并允许进入提交，或回到实现/调试修复失败项。",
    skills: ["verification-before-completion"],
  },
  {
    id: "DP-7",
    name: "提交和分支收尾确认",
    trigger: "验证通过后准备提交、push、PR、merge、保留或清理 worktree。",
    required_input: "diff、作者身份、提交信息、分支状态、集成选项和清理风险。",
    expected_output: "完成中文 Conventional Commit，并按用户选择完成分支收尾。",
    skills: ["git-commit", "finishing-a-development-branch"],
  },
];

export function allDecisionPoints(): Array<Record<string, unknown>> {
  return DECISION_POINTS.map((point) => ({ ...point, skills: [...point.skills] }));
}

export function getDecisionPoint(pointId: string): Record<string, unknown> {
  const point = DECISION_POINTS.find((candidate) => candidate.id === pointId);
  if (!point) {
    throw new Error(pointId);
  }
  return { ...point, skills: [...point.skills] };
}
