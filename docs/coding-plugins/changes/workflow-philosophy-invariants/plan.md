---
title: 工作流哲学不变量计划
change_id: workflow-philosophy-invariants
updated: 2026-07-11
---

# 工作流哲学不变量计划

## 设计

在入口 Skill 定义五项通用不变量，让所有实现工作从最小 Verifiable Contract 开始，并通过 source-scan 测试和最新验证保持静态约束。所有活跃表面都删除退役工作流文档和词汇。

## 测试策略

- VC-001：扫描入口路由和 Capsule 模板中的结果、边界和验证方式。
- VC-002：扫描 TDD 与 implementer prompts，确认测试先行且不存在事后例外。
- VC-003：扫描系统化调试、计划执行和完成顺序。
- VC-004：禁止活跃表面出现退役词汇，并检查产物预算和已删除文档目录。
- VC-005：检查最新验证和剩余风险证据要求。

## 任务

1. 新增哲学不变量契约测试并观察 RED。
2. 重写入口、TDD、执行、Review、worktree、subagent 和 Skill 维护契约。
3. 将 Change Capsule 模板升级为 Verifiable Contract 模型。
4. 删除退役正式文档、模板和 fixtures。
5. 更新维护文档和迁移边界。
6. 运行 focused 与全量验证，扫描活跃表面并记录证据。

## 回滚

提交前把本次变更作为一个整体回退。不得恢复 CLI/runtime；若某项不变量过严，应同时修订规则和测试。

## 验证

- `node --test tests/ts/workflow-philosophy.test.mjs`
- `npm test`
- 活跃表面退役词汇扫描
- `git diff --check`
