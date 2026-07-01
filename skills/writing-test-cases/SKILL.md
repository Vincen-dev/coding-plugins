---
name: writing-test-cases
description: Use after approved requirement documents and technical documents exist, before writing IPD implementation plans, to create or update TCD test case documents under docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md.
---

# 编写测试用例文档

## 总览

本技能负责把已批准需求、TDD 技术设计和 TID 技术实现转成测试用例文档。TCD 位于 technicals 和 IPD 之间，用来固定“要验证哪些行为、用什么测试层级、覆盖哪些 Spec ID”。

**核心原则：**测试用例文档定义测试设计，不记录实际 RED/GREEN/REFACTOR 结果；实际执行证据仍写入 TED。

开始时声明：“我正在使用 writing-test-cases 技能来编写测试用例文档。”

## 何时使用

使用本技能：

- 已有 approved requirement docs 和 TDD 技术设计；如存在 TID 技术实现，也必须读取，准备进入 IPD 实现计划。
- 需要明确每个 MUST Spec ID 的测试层级、测试名称、测试数据、断言和边界覆盖。
- 需要在计划前固定自动测试、契约测试、source-scan、配置测试或人工验收的边界。

不使用本技能：

- 需求还没有批准：先用 `writing-requirements`。
- 技术方案还没有明确：先用 `writing-technicals`。
- 正在写实际测试代码和记录 RED/GREEN：使用 `test-driven-development`。

## 落地路径

```text
docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md
```

## 编写流程

1. 使用 `document-metadata` 读取 README、requirements、technical、plan 和 evidence 关系。
2. 读取 approved requirement docs，列出所有 MUST Spec ID。
3. 读取 `technicals/<feature-name>-TDD.md`，确认技术落点、关键决策和测试策略；如果存在 `technicals/<feature-name>-TID.md`，继续读取模块实现、接口结构、迁移约束和实现顺序约束。
4. 创建或更新 `test-cases/<feature-name>-TCD.md`。
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
| Spec ID 到测试用例的映射 | 实际 RED/GREEN 输出 |
| 测试层级和测试类型 | 代码实现任务拆分 |
| 前置条件、步骤、断言、测试数据 | 技术选型讨论 |
| 自动化或人工验收边界 | 发布前最终测试结果 |
| 不测或人工验收的豁免原因 | TED 正文 |

## 自审

- 每个 MUST Spec ID 是否有测试用例或豁免原因。
- 测试层级是否和 TDD 的测试策略一致，测试数据和断言是否覆盖 TID 中的接口、数据结构和迁移约束。
- 是否没有把实现任务写进测试用例文档。
- 是否没有把实际执行证据写进测试用例文档。
- 是否维护 frontmatter 的 `related_specs`、`related_technical`、`related_plans`、`related_evidence`；同一 feature 下存在 TID 时，`related_technical` 必须同时包含 TDD 和 TID。
