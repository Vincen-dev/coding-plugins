---
title: "<功能名称>技术实现"
status: draft
lifecycle_status: draft
feature: "<feature-name>"
doc_id: "<doc-id>"
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: "<验证命令或人工验证记录>"
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---

# <功能名称>技术实现

## 阅读摘要

- **本文结论:** <说明最终实现边界、主要代码落点和不会实现的内容。>
- **当前状态:** 草稿，等待实现方案确认。
- **先读重点:** 先看实现摘要、实现点总览，再按 `## 标题（IMPL-001 / REQ-001）` 阅读每个实现点。
- **下游同步:** TID 更新后必须同步同一 `doc_id` 的 TCD、IPD 和 TED，至少更新 `updated` 表示已评审。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| 生命周期 | draft |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | TID |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 实现摘要、实现点总览、实现点章节、风险和回滚 |

## 实现摘要

<说明实现边界、主要代码落点和不实现的内容。>

## 实现点总览

| 实现点 | 标题 | 覆盖规格 | 关联设计 | 主要落点 |
| --- | --- | --- | --- | --- |
| IMPL-001 | <实现点标题> | REQ-001 | TD-001 | `<path>::<symbol>` |

## <实现点标题>（IMPL-001 / REQ-001）

### 实现目标

<说明本实现点完成后，系统内部或外部可观察到什么变化。>

### 代码落点

| 类型 | 路径或符号 | 实现内容 | 关联设计 |
| --- | --- | --- | --- |
| 模块 | `<path>` | <具体实现内容> | TD-001 |
| 接口 / 结构 | `<symbol>` | <字段、方法、参数或返回值变化> | TD-001 |

### 数据和状态

<说明数据结构、状态迁移、缓存、持久化或兼容处理；不涉及则写“不涉及”。>

### 实现约束

- 需求来源：REQ-001
- 设计来源：TD-001
- 测试交接：TC-001 或 TCD 中对应测试用例
- 执行交接：IPD 中对应 TASK-001

## 状态和数据迁移

| 场景 | 处理方式 | 回滚方式 | 验证 |
| --- | --- | --- | --- |
| <场景> | <迁移或状态处理> | <回滚方式> | <测试或命令> |

## 实现顺序约束

| 顺序 | 约束 | 原因 |
| --- | --- | --- |
| 1 | <必须先做的实现约束> | <原因> |

## 测试交接

<说明哪些实现点必须在 TCD 中形成测试用例，哪些实现约束需要在 IPD 执行时保留 RED/GREEN/REFACTOR 证据。不要在本文记录实际测试输出。>

## 风险和回滚

| 风险 | 缓解 | 回滚 |
| --- | --- | --- |
| <风险> | <缓解方式> | <回滚方式> |
