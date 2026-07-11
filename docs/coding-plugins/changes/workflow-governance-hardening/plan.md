---
title: 工作流治理加固计划
change_id: workflow-governance-hardening
updated: 2026-07-11
---

# 工作流治理加固计划

## 设计

在入口 Skill 增加统一的执行前硬门禁；由各责任 Skill 分别定义共享工作区隔离、决策记录和风险比例验证。Change Capsule 模板增加假设与待决事项，但不引入第二套状态源或机器运行时。

## 测试策略

- VC-001：源码扫描验证入口和 worktree Skill 的单写者约束。
- VC-002：源码扫描验证 Governed/Critical 缺少必需能力时停止且禁止降级。
- VC-003：源码扫描验证 Change Capsule 的假设、待决事项门禁和中文模板章节。
- VC-004：源码扫描验证高风险变更默认运行完整相关测试套件，以及无法运行时的窄化声明和剩余风险。

## 任务

1. 新增 `workflow-governance-hardening.test.mjs`，更新维护测试清单并观察 RED。
2. 最小修改 `using-coding-plugins`、`using-git-worktrees`、`change-capsule`、模板和 `verification-before-completion`。
3. 同步 `docs/workflow-chain.md` 的公开工作流摘要。
4. 运行聚焦测试、全量 `npm test`、YAML/frontmatter 解析检查和 `git diff --check`。
5. 更新 `evidence.md` 与 `change.md`，逐项关闭 VC-001 至 VC-004。

## 回滚

提交前可整体回退本 Change Capsule、测试和 Skill 文本。回滚不影响业务运行时代码，因为仓库没有可执行工作流服务。

## 验证

- `node --test tests/ts/workflow-governance-hardening.test.mjs`
- `npm test`
- Skill frontmatter YAML 与 manifest JSON 解析检查
- `git diff --check`
