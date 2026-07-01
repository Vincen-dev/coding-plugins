---
title: <功能名称>需求文档
type: feature
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <检索标签>
related_code:
  - <代码路径>
related_specs: []
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---

# <功能名称>需求文档

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | PRD |
| 技术设计 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md` |
| 测试用例 | `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md` |
| 实现计划 | `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md` |
| TDD 证据 | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

关联关系以 frontmatter 的 `related_*` 字段为准；本表只提供人工阅读摘要。当前 feature 尚未沉淀的下游文档，应从 frontmatter 和本表中删除对应路径，或写明 `不适用：<原因>`。

## 目标

<一句话说明要交付的能力和成功状态。>

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | <明确不做什么> |

## 背景

- 当前行为：
- 目标用户或调用方：
- 约束：

## Feature 需求

不适用：<如果本 PRD 不包含用户流程或可见行为，说明原因。>

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | <可测试需求> | <单元测试、集成测试、端到端测试或人工验收证据> |

## API / SDK / CLI 契约

不适用：<如果本 PRD 不涉及外部接口契约，说明原因。>

| 编号 | 优先级 | 契约 | 验证方式 |
| --- | --- | --- | --- |
| API-001 | 必须 | <请求、响应、命令参数或公开方法约定> | <契约测试或人工验收证据> |

## Schema / 数据契约

不适用：<如果本 PRD 不涉及数据结构、配置或事件 payload，说明原因。>

| 编号 | 优先级 | 字段或结构 | 约束 | 验证方式 |
| --- | --- | --- | --- | --- |
| SCHEMA-001 | 必须 | <字段或结构> | <类型、必填、默认值或兼容规则> | <schema 校验或测试> |

## 状态机 / 生命周期

不适用：<如果本 PRD 不涉及状态迁移或生命周期，说明原因。>

| 编号 | 优先级 | 状态或迁移 | 期望行为 | 验证方式 |
| --- | --- | --- | --- | --- |
| STATE-001 | 必须 | <状态 A -> 状态 B> | <触发条件和结果> | <状态机测试或验收证据> |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | <场景名> | <前置条件> | <动作> | <期望结果> |

## 维护 / 迁移 / 回归约束

不适用：<如果本 PRD 不涉及维护、迁移或回归风险，说明原因。>

| 编号 | 优先级 | 约束 | 验证方式 |
| --- | --- | --- | --- |
| NFR-001 | 必须 | <兼容、迁移、性能、安全、回归或可观测性约束> | <验证方式> |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | <错误或边界> | <明确结果> | <测试或验收证据> |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | <单元测试、集成测试、契约校验或人工验收> | `<命令或证据路径>` | <任务编号或不适用> | 计划中 |
