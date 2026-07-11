---
title: 工作流治理加固
change_id: workflow-governance-hardening
profile: governed
phase: complete
risk: medium
current_task: complete
completion_status: complete
updated: 2026-07-11
---

# 工作流治理加固

## 意图

把真实多会话复盘暴露出的并发、治理降级、条件性假设和验证强度问题固化为可执行的 Agent 工作流契约，避免单次任务只能依赖 Agent 临场补救。

## 风险

本次修改会改变所有实现型工作流的入口判断，以及 Governed/Critical、worktree 和完成验证行为。主要风险是规则过严导致无必要的阻塞，或规则分散在多个 Skill 后出现相互矛盾。

## 范围

- 范围内：共享 checkout 写入隔离、必需 Skill/Artifact 不可降级、条件性假设和 Decision Point、公共契约与 schema 变更的验证强度、Change Capsule 模板及静态契约测试。
- 范围外：重新引入 CLI/runtime、隐藏 session lock、自动创建 worktree、修改外部业务仓库、发布新版本。
- 预计影响的文件或系统：`skills/using-coding-plugins/`、`skills/change-capsule/`、`skills/using-git-worktrees/`、`skills/verification-before-completion/`、`docs/workflow-chain.md`、`tests/ts/`。

## 假设与待决事项

- Assumption：当前 checkout 位于功能分支、工作树在任务开始时干净，因此本次无需创建第二个 worktree；状态已由 `git status` 验证。
- Decision Point：是否重新引入 runtime/session lock；决定为否，保持纯工作流并通过单写者规则约束。
  - 决定来源：2.0 产品边界和用户确认的优化方向。
  - 阻止执行：否。

## 可验证契约

- [x] VC-001
  - 结果：实现型任务在共享 checkout 已存在无关或重叠写入时，必须隔离到独立 worktree 或停止等待；不得把复杂 staging 当作默认并发策略。
  - 边界：只定义 Agent 行为，不引入隐藏锁、后台服务或自动外部变更。
  - 验证：source-scan 检查入口与 `using-git-worktrees` 的单写者规则、重叠写入处理和安全退出条件。
- [x] VC-002
  - 结果：Governed/Critical 所需 Skill、Artifact 或批准不可用时必须停止，不得降级为 Quick/临时会话契约继续实现。
  - 边界：Inspect、Quick 和 Standard 的正常最小流程不增加无关批准。
  - 验证：source-scan 检查入口和 `change-capsule` 的 hard gate 与禁止降级规则。
- [x] VC-003
  - 结果：影响范围的条件性假设必须记录为 Assumption 或 Decision Point；未解决且会改变行为、兼容、schema、迁移、回滚或验证的事项会阻止执行。
  - 边界：不恢复退役的 `DP-*` 运行时协议；使用 Change Capsule 内的简洁人工决策记录。
  - 验证：模板和 Skill 契约测试检查假设/决策章节、阻塞条件和批准失效规则。
- [x] VC-004
  - 结果：公共 API、schema、migration、兼容、安全和发布类变更在完成前默认运行完整相关 suite；无法运行时不得做宽泛完成声明，并必须记录未验证范围和剩余风险。
  - 边界：Quick/Standard 仍按风险选择 focused checks，不要求所有项目无条件运行全仓测试。
  - 验证：source-scan 检查 `verification-before-completion` 的风险比例、完整 suite 默认值和降级证据要求。

## 产物

- `change.md`：整个变更的唯一状态源。
- `plan.md`：经确认的最小实施计划。
- `evidence.md`：RED/GREEN/REFACTOR 与最终验证证据。

## 批准记录

- 2026-07-11 范围/计划：用户认可四会话复盘提出的四项优先优化方向。
- 2026-07-11 执行：用户明确回复“好的开始进行优化”。

## 当前任务

已完成。四项治理门禁、模板、公开摘要和契约测试均已实现并通过最终验证。

## 决策

- 保持 2.0 纯工作流边界，不恢复 CLI、隐藏状态或跨会话 runtime lock。
- 通用 hard gate 归 `using-coding-plugins`，worktree 操作归 `using-git-worktrees`，决策记录归 `change-capsule`，完成证据归 `verification-before-completion`。
- 当前 checkout 位于功能分支且工作树干净，本次不额外创建 worktree。

## 完成情况

- 已实现：共享 checkout 单写者规则、Governed/Critical 不可降级门禁、Assumption/Decision Point 门禁、高风险完整相关 suite 默认值及公开文档同步。
- 已验证：focused 4/4、全量 31/31、Skill frontmatter YAML、manifest JSON 与 `git diff --check` 全部通过。
- 延后项：自动检测 Codex 其他会话和自动创建 worktree，不在纯工作流插件范围内。
- 剩余风险：纯工作流仍依赖 Agent 检查 Git 状态；跨会话自动 lock 与外部仓库执行审计未实现。
