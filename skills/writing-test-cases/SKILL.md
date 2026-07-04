---
name: writing-test-cases
description: Use after approved requirement documents and technical documents exist, before writing TED task execution documents, to create or update TVD test case documents under docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md.
---

# 编写测试用例文档

## 总览

本技能负责把已批准需求和 TSD 技术方案文档转成测试用例文档。TVD 位于 technicals 和 TED 之间，用来固定“要验证哪些行为、用什么测试层级、覆盖哪些 Spec ID”。

**核心原则：**测试用例文档定义测试设计，不记录实际 RED/GREEN/REFACTOR 结果；实际执行证据仍写入 VED。

**可读性原则：**TVD 要让实现者快速判断“测什么、为什么测、怎么断言”。表格只用于测试用例总览和边界矩阵；单个测试用例内的目标、前置条件、步骤、断言、测试数据和证据目标优先使用清单。

开始时声明：“我正在使用 writing-test-cases 技能来编写测试用例文档。”

## 何时使用

使用本技能：

- 已有 approved requirement docs 和 TSD 技术方案文档，准备进入 TED 任务执行文档。
- 需要明确每个 MUST Spec ID 的测试层级、测试名称、测试数据、断言和边界覆盖。
- 需要在计划前固定自动测试、契约测试、source-scan、配置测试或人工验收的边界。

不使用本技能：

- 需求还没有批准：先用 `writing-requirements`。
- TSD 技术方案文档还没有明确：先用 `writing-technicals`。
- 正在写实际测试代码和记录 RED/GREEN：使用 `test-driven-development`。

## 落地路径

```text
docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
```

## 编写流程

1. 使用 `document-metadata` 读取 README、requirements、technical、plan 和 evidence 关系。
2. 读取 approved requirement docs，列出所有 MUST Spec ID。
3. 读取 `technicals/<doc-id>-TSD.md`，确认技术落点、关键决策、实现方案和测试策略。
4. 创建或更新 `test-cases/<doc-id>-TVD.md`。
5. 为每个 MUST Spec ID 写测试用例，包含测试层级、测试名称、前置条件、步骤、断言、数据和证据目标。
6. 对不需要测试用例的 Spec ID 写明豁免原因。
7. 更新 `docs/coding-plugins/INDEX.md`。

## 模板

优先使用：

```text
skills/writing-test-cases/templates/test-cases.md
```

## 内容边界

| 应写入测试用例文档 | 不写入测试用例文档 |
| --- | --- |
| 测试用例总览和独立测试用例章节 | 实际 RED/GREEN 输出 |
| 测试层级和测试类型 | 代码实现任务拆分 |
| 前置条件、步骤、断言、测试数据 | 技术选型讨论 |
| 自动化或人工验收边界 | 发布前最终测试结果 |
| 不测或人工验收的豁免原因 | VED 正文 |

## 写作质量

- `## 阅读摘要` 必须写清 MUST 覆盖范围、自动化边界、人工验收边界和高风险场景。
- 每个 `TC-xxx` 章节只验证一个主要行为或契约；如果标题里需要“和/以及”，优先拆成多个测试用例。
- 测试数据说明必须写出覆盖条件和隔离方式，不只写样例值。
- 不需要测试用例的规格必须用清单说明原因和替代验证；不能只写“无”来跳过。
- 正文不重复 VED 路径清单；证据目标用“同一 `doc_id` 的 VED”表达，具体路径由 metadata/INDEX 推导。

## 自审

- 每个 MUST Spec ID 是否有测试用例或豁免原因。
- 测试层级是否和 TSD 的测试策略一致，测试数据和断言是否覆盖 TSD 中的接口、数据结构和迁移约束。
- 是否没有把实现任务写进测试用例文档。
- 是否没有把实际执行证据写进测试用例文档。
- 是否维护 frontmatter 的 `related_docs`。
