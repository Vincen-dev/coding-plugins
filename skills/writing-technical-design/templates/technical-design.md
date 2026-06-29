---
title: "<功能名称>技术设计"
status: draft
area: "<area>"
capability: "<capability>"
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<area>/<capability>/specs/feature.md
related_plans:
  - docs/coding-plugins/features/<area>/<capability>/plans/implementation.md
related_evidence:
  - docs/coding-plugins/features/<area>/<capability>/evidence/tdd-evidence.md
---

# <功能名称>技术设计

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| 领域 | <area> |
| 能力 | <capability> |
| 规格 | `docs/coding-plugins/features/<area>/<capability>/specs/feature.md` |
| 计划 | `docs/coding-plugins/features/<area>/<capability>/plans/implementation.md` |
| TDD Evidence | `docs/coding-plugins/features/<area>/<capability>/evidence/tdd-evidence.md` |

## 设计摘要

<2 到 5 句话说明整体技术方案。>

## 规格缺口审查

| 检查项 | 结论 |
| --- | --- |
| 未覆盖需求 | <无；如存在，停止本技术设计并回到 spec 更新。> |
| 验收标准不清 | <无；如存在，停止本技术设计并回到 spec 更新。> |
| 新增外部行为 | <无；如存在，停止本技术设计并回到 spec 更新。> |
| 处理状态 | <通过，未发现需要回写 spec 的缺口。> |

## 规格到设计映射

| Spec ID | 技术落点 | 设计决策 | 测试策略 |
| --- | --- | --- | --- |
| REQ-001 | `<path>` | <该规格如何落地> | <测试命令或测试名称> |

## 无需技术设计的规格

| Spec ID | 原因 |
| --- | --- |
| 无 | <如所有 MUST 规格都有技术落点，保留本行；否则逐项写明无需技术设计的原因。> |

## 关键决策

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| <技术决策> | <为什么这么做> | <代价或风险> |

## 影响组件

| 组件 | 变更 | 相关 Spec ID |
| --- | --- | --- |
| `<path>` | <改动说明> | REQ-001 |

## 数据流 / 控制流

<核心流程，必要时使用 Mermaid。>

## 接口和契约

<内部接口、外部 API、schema、状态机如何落地。>

## 迁移 / 兼容性

<迁移、兼容、回滚、灰度；不适用时说明原因。>

## 测试策略

<Spec ID 对应测试层级、RED/GREEN 命令和 TDD Evidence 记录方式。>

## 风险和缓解

| 风险 | 缓解方案 |
| --- | --- |
| <风险> | <缓解方案> |
