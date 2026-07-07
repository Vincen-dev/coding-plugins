---
title: <功能名称>测试用例
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
---

# <功能名称>测试用例

## 阅读摘要

- **本文结论:** <说明测试设计覆盖哪些 MUST 规格、自动化边界和人工验收边界。>
- **当前状态:** 草稿，等待测试设计确认。
- **先读重点:** 先看测试策略摘要、测试用例总览，再按 `## 标题（TC-001 / REQ-001）` 阅读每个测试用例。
- **下游同步:** TVD 更新后必须同步同一 `doc_id` 的 TED 和 VED，至少更新 `updated` 表示已评审。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节、豁免说明 |

## 测试策略摘要

<说明整体测试层级、自动化边界、人工验收边界和高风险场景。>

## 风险到测试映射

- REQ-001 / 风险：<高风险行为、契约、状态或边界。>
  - 测试覆盖：<对应 TC ID、测试类型和断言重点。>
  - 未覆盖说明：<无法覆盖时说明原因、替代验证和残余风险。>

## 测试环境与数据

- 环境：<本地、CI、设备、浏览器、账号、权限或外部依赖。>
- 数据：<fixture、mock、seed、输入边界、清理策略或“不需要”的原因。>
- 隔离：<如何避免污染用户数据、共享环境或其他测试。>

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | <测试名称> | REQ-001 | behavior | 自动化 / 人工验收 | VED |

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

- 主要数据：<取值或构造方式。>
- 覆盖条件：<该数据覆盖的正常路径、边界或错误条件。>
- 数据隔离：<是否需要清理、mock、fixture、账号或环境前置。>

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应 TASK-001 负责产生 RED/GREEN/REFACTOR 或 TDD 例外记录。

## 边界和错误用例

| Spec ID | 测试用例 ID | 条件 | 期望结果 | 测试类型 |
| --- | --- | --- | --- | --- |
| ERR-001 | TC-ERR-001 | <错误或边界条件> | <期望结果> | behavior |

## 通过 / 失败标准

- 通过标准：<哪些自动化测试、人工验收或质量门禁必须通过。>
- 阻塞失败：<哪些失败必须停止执行、回到 PRD/TSD/TVD 或补测试。>
- 非阻塞风险：<允许延期的风险、原因和后续追踪方式。>

## 自动化状态

- 自动化覆盖：<列出已计划自动化的 TC ID 和命令来源。>
- 人工验收：<列出必须人工确认的 TC ID、步骤和证据目标。>
- 暂不覆盖：<列出暂不覆盖项、原因、替代验证和补齐条件。>

## 不需要测试用例的规格

- 无：<所有 MUST 规格均有测试用例时保留本行。>
- <Spec ID>：<确实不需要独立测试用例时，说明原因和替代验证。>

## 执行提示

- 实现阶段使用 `test-driven-development`。
- 实际 RED/GREEN/REFACTOR 输出写入 VED，不写入本文档。
- 如果 TED 改变测试顺序，必须回看本文档，确认 Spec ID 覆盖没有丢失。
