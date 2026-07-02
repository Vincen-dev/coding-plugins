---
name: brainstorming
description: Use when users want idea exploration, solution comparison, product direction discussion, feasibility judgment, or pre-SDD problem framing before formal Coding Plugins documents are created.
---

# Brainstorming

## Overview

`brainstorming` 是 SDD 前置的构思收敛技能。它负责把未定型想法收敛成清楚的问题定义、边界、方案选择和下一步决策，但不创建正式 SDD 文档。

核心原则：先判断“是否值得进入正式文档链路”，再决定是否交给 `spec-driven-development`。

## When to Use

使用本技能：

- 用户说“头脑风暴”“先讨论”“有哪些方案”“要不要做”“怎么设计更合理”。
- 产品方向、功能边界、用户价值、成功标准或非目标还不清。
- 存在多个可行方案，需要比较代价、风险和推荐路径。
- 用户明确表示暂时不要写文档、不要实现或先分析。
- 需求可能很大，需要先拆分成可落地的子问题。

不使用本技能：

- 用户已经明确要求进入文档落地、编写 PRD、开始实现或创建计划：用 `spec-driven-development` 或对应下游技能。
- 已有 approved PRD：直接进入 `writing-technicals`、`writing-test-cases` 或 `writing-plans`。
- 已有清晰 bug 复现：用 `systematic-debugging`。
- 小型明确变更且验收标准清楚：用 `test-driven-development`。
- 用户只要求解释、读取、搜索、状态查询或 review：普通分析或对应技能。

## Hard Gates

- 不写代码、不搭脚手架、不调用实现技能。
- 不创建 README、PRD、TDD、TID、TCD、IPD 或 TED。
- 不维护正式 `document-metadata`、`related_*`、README 或 `docs/coding-plugins/INDEX.md`。
- 不把探索性判断包装成 approved 需求。
- 用户没有确认进入落地前，不得转入 `writing-requirements`、`writing-technicals`、`writing-test-cases` 或 `writing-plans`。

## Process

1. **读取上下文**：检查相关代码、文档、已有约定和最近变更；没有仓库上下文时说明基于当前信息判断。
2. **确认问题类型**：区分产品方向、用户流程、技术方案、维护风险、迁移、调试或纯解释。
3. **澄清关键缺口**：一次只问一个会影响目标、边界、方案或验收的问题；能合理假设时直接说明假设。
4. **拆分问题**：如果范围过大，先拆成独立子问题，并建议第一个应落地的子问题。
5. **提出方案**：给出 2-3 个可行方案，说明适用场景、代价、风险和不适用情况。
6. **给出推荐**：明确推荐方案和理由，并列出仍需确认的问题。
7. **决定下一步**：只有用户确认进入落地，才交给 `spec-driven-development`；否则停留在分析和方案讨论。

## Output Shape

默认只在对话中输出，不沉淀正式文档。输出应包含：

- 问题定义。
- 目标和非目标。
- 已知约束。
- 方案对比。
- 推荐方案。
- 风险和开放问题。
- 是否建议进入 `spec-driven-development`。

如果用户明确要求沉淀临时讨论记录，只能创建非正式 notes，并说明它不是 PRD、TDD、TCD、IPD 或 TED，不进入正式文档索引。

## Handoff to SDD

当用户确认“开始落地”“开始实现”“进入文档链路”或选择某个方案后，交接给 `spec-driven-development`，并带上：

- 选定方案。
- 目标和非目标。
- 需求边界。
- 已拒绝方案和原因。
- 仍需在 PRD 中确认的契约、验收或风险问题。

交接语：

```text
构思已收敛为 <方案名>。如果确认进入落地，下一步使用 spec-driven-development 创建或更新正式 PRD 链路。
```

## Common Mistakes

- 用户只是问“有哪些方案”，却直接创建 PRD。
- 把 brainstorming 当成 Superpowers 式强制设计文档，并提交到正式 specs 目录。
- 在没有用户确认的情况下进入 `writing-requirements`。
- 只给一个方案，没有比较替代路径。
- 只讨论技术实现，没有先定义目标、非目标和成功标准。
- 把“推荐方案”写成命令式任务清单，绕过 SDD。
