---
title: 增加功能模块文档交付检查
change_id: module-documentation-delivery
profile: governed
phase: complete
risk: high
current_task: 已完成当前功能模块文档交付检查切片
completion_status: complete
updated: 2026-08-28
---

# 增加功能模块文档交付检查

## 意图

让 Change Capsule 继续记录单次变更的范围、决策和证据，同时要求真正新增或实质改变功能模块时按需创建或更新长期模块文档，避免只有过程记录而没有可维护的最终交付说明。

## 风险

本变更采用 `Governed Change`，因为它修改插件公开工作流、Change Capsule 模板和完成验证契约。主要风险是把模块文档误变成所有任务的强制产物，或让模块文档与 `change.md` 重复维护状态。

## 范围

- 范围内：`Documentation Impact Check`、`change.md` 文档影响记录、按需模块文档模板、执行与完成验证规则、用户文档和静态契约测试。
- 范围外：强制所有 Profile 创建模块文档、引入文档生成运行时、修改插件安装方式、提交、发布或刷新安装缓存。
- 预计影响：入口 Skill、Change Capsule、执行与验证 Skill、模板、README、workflow chain、release notes 和测试。

## 假设与待决事项

- `Assumption`：长期模块文档应进入仓库现有产品/架构文档体系或外部事实源，而不是默认存放在 Capsule 目录。
- `Assumption`：Quick Change 仅在实际改变既有模块契约时更新模块文档，不因改动存在而强制创建。
- `Decision Point`：是否为模块文档提供可复制模板。
  - 决定：提供可选 `module-doc.md` 模板，但不计入 Profile 的必需 Capsule 产物数量。
  - 决定来源：用户接受“Capsule + 按需模块文档”的补充方案。
  - 阻止执行：否。

## 可验证契约

- [x] VC-DOC-001
  - 结果：所有实施型 Profile 在实现前评估 `none`、`update-existing`、`create-module-doc` 或 `external-doc`。
  - 边界：Inspect 不创建交付文档；Quick 不因小改动自动创建模块文档。
  - 验证：入口契约测试覆盖四态和值的触发边界。
- [x] VC-DOC-002
  - 结果：Standard、Governed 和 Critical 在 `change.md` 记录文档影响、目标、原因和验证方式。
  - 边界：模块文档不记录 phase、approval、current task 或命令过程日志，不成为第二套工作流状态。
  - 验证：Change Capsule Skill 与模板契约测试。
- [x] VC-DOC-003
  - 结果：提供按需复制到产品文档体系的最小模块文档模板，覆盖目标、边界、入口、流程、数据、外部契约、生命周期、验证和已知限制。
  - 边界：模板不是 Profile 必需产物，也不默认写入 Capsule 目录。
  - 验证：模板存在性、章节和归属契约测试。
- [x] VC-DOC-004
  - 结果：计划执行和完成验证会处理非 `none` 的文档影响，并确认文档与最终代码、API、生命周期及外部边界一致。
  - 边界：模块文档不替代测试、运行证据或外部门禁。
  - 验证：executing 与 verification Skill 静态契约测试。
- [x] VC-DOC-005
  - 结果：README、workflow chain 和 release notes 清楚区分 Capsule 与长期模块文档。
  - 边界：不恢复旧版固定文档链或运行时。
  - 验证：文档 source check 与完整 `npm test`。

## 文档影响

- 类型：`update-existing`
- 目标：`README.md`、`docs/workflow-chain.md`、`RELEASE-NOTES.md`
- 原因：本变更修改插件自身的功能模块交付规则和用户可见运行链路。
- 验证：文档描述与最终 Skill、模板及契约测试一致。

## 产物

- `change.md`：唯一全局状态源。
- `plan.md`：实现计划。
- `evidence.md`：静态契约与最终验证证据。

## 批准记录

- 2026-08-28 范围与计划批准：用户在查看“Capsule + 按需模块文档”的完整区别、规则和建议链路后回复“好的补充优化”。
- 2026-08-28 执行批准：同一条后置指令明确要求实施已展示的补充优化；未授权提交、发布或安装缓存刷新。
- 2026-08-28 集成授权：用户明确要求合并到本地 `main` 并继续直接在 `main` 开发；未要求 push、release 或缓存刷新。

## 当前任务

当前切片已完成，并纳入用户授权的本地 `main` 集成。

## 决策

- 不新增固定的 Profile 产物数量；模块文档是条件性交付物。
- `change.md` 只保存模块文档目标和交付引用，不复制模块长期内容。
- 模块文档模板供复制到仓库现有文档体系，不默认写入 `docs/coding-plugins/changes/`。

## 完成情况

- 已实现：四态文档影响判断、Capsule 与模块文档边界、可选模块文档模板、主线程/子代理执行和完成验证闭环，以及用户文档同步。
- 已验证：变更前完整套件 42/42；文档影响契约 5/5；相邻契约 24/24；最终完整套件 47/47；`git diff --check` 无错误。
- 延后项：push、发布、缓存刷新和跨模型 forward-testing。
- 剩余风险：静态契约不能证明模型在所有自然语言任务中都会正确判断文档影响；已安装的 `2.1.0` 缓存仍未包含本次源码变更。
