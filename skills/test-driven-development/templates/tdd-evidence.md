---
title: <能力> VED 证据文档
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
---

# <能力> VED 证据文档

## 阅读摘要

- **本文结论:** <说明本轮验证的最终结果、通过范围和剩余风险。>
- **当前状态:** 草稿，等待真实 RED/GREEN/REFACTOR 输出。
- **先读重点:** 先看最新任务的执行证据，再看最终验证和风险。
- **上游来源:** 证据必须能追溯到同一 `doc_id` 的 PRD、TSD、TVD 和 TED。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | VED |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 最新任务的执行证据、最终验证、风险 |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只记录真实 RED/GREEN/REFACTOR 输出、TDD 例外和最终验证。

## 任务 <N>：<任务名称>

### TDD 证据

- **规格/缺陷/验收:** <REQ-001、bug 复现链接或验收标准>
- **测试类型:** behavior
- **RED 测试:** `<tests/path/example.test.ts::test_specific_behavior>`
- **RED 命令:** `<node --test tests/path/example.test.ts::test_specific_behavior -v>`
- **RED 失败:** <失败信息摘要，说明它因缺失行为失败，而不是导入、拼写或环境问题>
- **GREEN 变更:** <最小实现摘要>
- **GREEN 命令:** `<node --test tests/path/example.test.ts::test_specific_behavior -v>`
- **REFACTOR 命令:** `<node --test tests/path/example.test.ts -v>`
- **最终验证:** <最终相关测试、构建或校验命令和结果>

### Requirement Evidence

- <列出本任务覆盖的 Spec/Test ID 与可复现结果。>

### Policy Evidence

- <列出本任务覆盖的 Policy ID、验证门禁、命令与结果。>

## 任务 <N>：<无法自动测试的任务名称>

### TDD 例外记录

- **原因:** <为什么无法先写失败测试>
- **用户批准:** <用户同意的原话或明确说明>
- **替代验证:** <替代验证命令、日志、截图或人工验收步骤>
- **风险:** <剩余风险和后续补测试计划>
