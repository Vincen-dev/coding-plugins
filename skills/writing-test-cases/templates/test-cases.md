---
title: <功能名称>测试用例
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/specs/feature.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/implementation.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md
---

# <功能名称>测试用例

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| 需求文档 | `docs/coding-plugins/features/<feature-name>/specs/feature.md` |
| 技术方案 | `docs/coding-plugins/features/<feature-name>/technical/technical-design.md` |
| 实现计划 | `docs/coding-plugins/features/<feature-name>/plans/implementation.md` |
| TDD 证据 | `docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md` |

## 测试策略摘要

<说明整体测试层级、自动化边界、人工验收边界和高风险场景。>

## Spec ID 到测试用例映射

| Spec ID | 测试类型 | 测试用例 ID | 测试名称 | 前置条件 | 步骤 | 断言 | 测试数据 | 证据目标 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | behavior | TC-001 | <测试名称> | <前置条件> | <步骤> | <断言> | <数据> | `docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md` |

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
- 实际 RED/GREEN/REFACTOR 输出写入 TDD evidence，不写入本文档。
- 如果 implementation plan 改变测试顺序，必须回看本文档，确认 Spec ID 覆盖没有丢失。
