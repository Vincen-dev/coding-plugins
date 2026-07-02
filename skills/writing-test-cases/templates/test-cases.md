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
- **先读重点:** 先看测试策略摘要、Spec ID 到测试用例映射、不需要测试用例的规格。
- **下游同步:** TCD 更新后必须同步同一 `doc_id` 的 IPD 和 TED，至少更新 `updated` 表示已评审。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 需求文档 | `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md` |
| 实现计划 | `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md` |
| TDD 证据 | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

## 测试策略摘要

<说明整体测试层级、自动化边界、人工验收边界和高风险场景。>

## Spec ID 到测试用例映射

| Spec ID | 测试类型 | 测试用例 ID | 测试名称 | 前置条件 | 步骤 | 断言 | 测试数据 | 证据目标 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | behavior | TC-001 | <测试名称> | <前置条件> | <步骤> | <断言> | <数据> | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

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
