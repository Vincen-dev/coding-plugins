---
title: <功能名称>实现计划
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
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---

# <功能名称>实现计划

## 阅读摘要

- **本文结论:** <说明本计划要落地什么、分几类任务、最终成功标准是什么。>
- **当前状态:** 草稿，等待执行确认。
- **先读重点:** 先看目标、来源文档、技术设计快照、规格追踪和任务清单。
- **执行入口:** 使用 `subagent-driven-development` 或 `executing-plans` 按任务执行；每个任务必须记录 TED 证据。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 需求文档 | `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md` |
| 测试用例 | `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md` |
| TDD 证据 | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

## 目标

<一句话说明要构建、修改或修复什么。>

## 来源文档

**规格来源:** `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md`

**技术实现来源:** `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md`

**测试用例来源:** `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md`

## 技术设计快照

**设计摘要:** <2 到 5 句话说明本计划执行的技术方案摘要。>

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| <技术决策> | <为什么这么做> | <代价或风险> |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `<path>` | <改动说明> | REQ-001 |

**数据流 / 控制流:** <核心流程；必要时使用 Mermaid。>

**接口和契约:** <内部接口、外部 API、schema、状态机如何落地。>

**迁移 / 兼容性:** <迁移、兼容、回滚、灰度；不适用时说明原因。>

**测试策略:** <Spec ID 对应测试层级、RED/GREEN 命令和 TED 记录方式。>

**TDD 证据目标:** `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md`

## 风险和缓解

| 风险 | 缓解方案 |
| --- | --- |
| <风险> | <缓解方案> |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TED 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `tests/path/test_file.py` | `test_specific_behavior` | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` / RED-GREEN-最终验证 | 任务 1 |

## 任务清单

### 任务 1：<组件或行为名称>

**规格 ID:** REQ-001

**文件:**

- 创建: `<exact/path/to/new_file>`
- 修改: `<exact/path/to/existing_file>`
- 测试: `<tests/exact/path/to/test_file>`

- [ ] **步骤 1：根据规格 ID 写失败测试**
- [ ] **步骤 2：运行测试确认失败**
- [ ] **步骤 3：RED 后写最小实现**
- [ ] **步骤 4：运行测试确认通过**
- [ ] **步骤 5：重构并重跑相关测试**
- [ ] **步骤 6：记录 TED 证据**

## 完成检查

- [ ] 每个 MUST Spec ID 都映射到测试或豁免。
- [ ] 每个实现任务都有 RED/GREEN/REFACTOR 命令。
- [ ] TED 已记录最终验证。
- [ ] 已运行相关 validator 或 preflight。
