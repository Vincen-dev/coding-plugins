---
title: "<功能名称>技术实现"
status: draft
lifecycle_status: draft
feature: "<feature-name>"
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: "<验证命令或人工验证记录>"
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---

# <功能名称>技术实现

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| 生命周期 | draft |
| Feature | <feature-name> |
| 需求文档 | `docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md` |
| 测试用例 | `docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md` |
| 实现计划 | `docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md` |
| TED 证据 | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

## 实现摘要

<说明实现边界、主要代码落点和不实现的内容。>

## 模块实现

| 模块 / 文件 | 实现内容 | 相关规格 ID | 相关设计决策 |
| --- | --- | --- | --- |
| `<path>` | <具体实现内容> | REQ-001 | TD-001 |

## 接口和数据结构

| 接口 / 结构 | 变更 | 兼容性 | 相关规格 ID |
| --- | --- | --- | --- |
| `<symbol>` | <字段、方法、参数或返回值变化> | <兼容策略> | REQ-001 |

## 状态和数据迁移

| 场景 | 处理方式 | 回滚方式 | 验证 |
| --- | --- | --- | --- |
| <场景> | <迁移或状态处理> | <回滚方式> | <测试或命令> |

## 实现顺序约束

| 顺序 | 约束 | 原因 |
| --- | --- | --- |
| 1 | <必须先做的实现约束> | <原因> |

## 验证映射

| 规格 ID | 测试用例 | 计划任务 | TED 证据 |
| --- | --- | --- | --- |
| REQ-001 | `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md` | <Task N> | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

## 风险和回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| <风险> | <缓解方式> | <回滚方式> |
