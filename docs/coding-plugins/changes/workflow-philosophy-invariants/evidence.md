---
title: 工作流哲学不变量证据
change_id: workflow-philosophy-invariants
updated: 2026-07-11
---

# 工作流哲学不变量证据

## 测试驱动证据

- 契约来源：`change.md` 中的 VC-001 至 VC-005。
- 测试类型：source-scan 与架构契约。
- RED 测试与命令：`node --test tests/ts/workflow-philosophy.test.mjs`。
- RED 失败：首次运行 5/5 失败，分别证明入口缺少通用不变量、TDD 允许例外、Capsule 模板缺少可验证契约字段、退役表面仍存在、完成证据术语不完整；第二轮场景 RED 2/7 失败，证明缺少确定性阶段门禁和 Quick evidence 输出。
- GREEN 变更与命令：重写活跃 Skills、prompts、模板、维护文档和契约测试，删除退役工作流文档及资产；focused 哲学测试 7/7 通过。
- REFACTOR 命令：统一 `VC-*` 追踪和活跃词汇后运行 `npm test`。

## 最终验证

- 命令或检查：`npm test`、`git diff --check`、YAML/JSON 解析、退役表面断言和活跃旧词汇扫描。
- 结果：22/22 测试通过，diff 检查通过，YAML/JSON 解析成功，退役路径不存在，活跃扫描零匹配。
- 覆盖范围：VC-001 至 VC-005、所有活跃 Skills 与 prompts、Capsule 模板、维护中的用户文档、manifests 和发行边界。

## 剩余风险

- 纯工作流规则仍由 Agent 按 Skills 执行，外部业务仓库不会被本 package 自动审计。
- 迁移和发布历史会描述退役行为，但不会参与活跃路由或契约。
