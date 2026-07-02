---
title: <功能名称>测试用例
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---

# <功能名称>测试用例

## 阅读摘要

- **本文结论:** <说明测试设计覆盖哪些 MUST 规格、自动化边界和人工验收边界。>
- **当前状态:** 草稿，等待测试设计确认。
- **先读重点:** 先看测试策略摘要、测试用例总览，再按 `## 标题（TC-001 / REQ-001）` 阅读每个测试用例。
- **下游同步:** TCD 更新后必须同步同一 `doc_id` 的 IPD 和 TED，至少更新 `updated` 表示已评审。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | TCD |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节、豁免说明 |

## 测试策略摘要

<说明整体测试层级、自动化边界、人工验收边界和高风险场景。>

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | <测试名称> | REQ-001 | behavior | 自动化 / 人工验收 | TED |

## <测试名称>（TC-001 / REQ-001）

### 测试目标

<说明该测试验证哪个用户行为、接口契约、状态变化、边界或回归风险。>

### 前置条件

- <测试执行前必须满足的状态、数据、配置或依赖。>

### 测试步骤

1. <步骤 1。>
2. <步骤 2。>
3. <步骤 3。>

### 断言

- <断言可观察结果、返回值、状态、日志、数据写入或错误语义。>

### 测试数据

| 数据项 | 取值 | 用途 |
| --- | --- | --- |
| <数据项> | <取值> | <覆盖的条件或边界> |

### 证据目标

- TED 记录：`docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md`
- 执行阶段：IPD 中对应 TASK-001 负责产生 RED/GREEN/REFACTOR 或 TDD 例外记录。

## 边界和错误用例

| Spec ID | 测试用例 ID | 条件 | 期望结果 | 测试类型 |
| --- | --- | --- | --- | --- |
| ERR-001 | TC-ERR-001 | <错误或边界条件> | <期望结果> | behavior |

## 不需要测试用例的规格

| Spec ID | 原因 | 替代验证 |
| --- | --- | --- |
| 无 | <所有 MUST 规格均有测试用例时保留本行> | 不适用 |

## 执行提示

- 实现阶段使用 `test-driven-development`。
- 实际 RED/GREEN/REFACTOR 输出写入 TED，不写入本文档。
- 如果 IPD 改变测试顺序，必须回看本文档，确认 Spec ID 覆盖没有丢失。
