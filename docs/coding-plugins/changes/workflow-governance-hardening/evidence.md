---
title: 工作流治理加固证据
change_id: workflow-governance-hardening
updated: 2026-07-11
---

# 工作流治理加固证据

## 测试驱动证据

- 契约来源：`change.md` 中的 VC-001 至 VC-004。
- 测试类型：source-scan 与工作流架构契约。
- RED 测试与命令：新增 `tests/ts/workflow-governance-hardening.test.mjs` 后运行 `node --test tests/ts/workflow-governance-hardening.test.mjs`。
- RED 失败：4/4 失败，分别证明入口缺少共享 checkout 单写者规则、Governed/Critical 缺少不可降级 hard gate、Change Capsule 缺少 Assumption/Decision Point 门禁，以及完成验证未要求高风险变更默认运行完整相关 suite。
- GREEN 变更与命令：把通用门禁加入 `using-coding-plugins`，把隔离细节加入 `using-git-worktrees`，把假设/决策和必需能力门禁加入 `change-capsule`，把风险比例验证加入 `verification-before-completion`；focused 命令 4/4 通过。
- REFACTOR 命令：首次 `npm test` 为 30/31，通过修正本计划的中文叙述边界后再次运行，31/31 通过。

## 最终验证

- 命令或检查：最终状态上重新运行 `node --test tests/ts/workflow-governance-hardening.test.mjs`、`npm test`、Skill frontmatter YAML 与 manifest JSON 解析、`git diff --check`。
- 结果：focused 4/4 通过；全量 31/31 通过；全部 Skill frontmatter YAML 与平台 manifest JSON 解析成功；`git diff --check` 通过。
- 覆盖范围：VC-001 至 VC-004、所有活跃 Skill 契约、Change Capsule 中文模板、公开工作流摘要和平台静态清单。

## 剩余风险

- 纯工作流无法主动发现另一个 Codex 会话；单写者规则仍依赖 Agent 检查 Git 状态和识别非当前任务改动。
- 自动创建 worktree、跨会话 lock 和外部业务仓库执行审计不在本次范围内。
