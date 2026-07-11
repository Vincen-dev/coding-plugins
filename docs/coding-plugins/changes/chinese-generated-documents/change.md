---
title: 生成文档中文化
change_id: chinese-generated-documents
profile: governed
phase: complete
risk: medium
current_task: complete
completion_status: complete
updated: 2026-07-11
---

# 生成文档中文化

## 意图

确保 Coding Plugins 生成的 Change Capsule 文档默认且必须使用简体中文，避免用户在中文协作中收到英文模板或英文沉淀文档。

## 风险

本次修改会改变所有生成模板及现有活跃 Capsule。主要风险是翻译后丢失稳定字段、测试追踪标识或 Agent 对模板章节的识别能力。

## 范围

- 范围内：五个 Change Capsule 模板、`change-capsule` 语言规则、现有活跃 Capsule、文档入口和静态契约测试。
- 范围外：Skill 的英文 Agent 执行说明、代码标识、文件名、frontmatter 键和 `VC-*` 标识。
- 影响系统：`skills/change-capsule/`、`docs/coding-plugins/changes/`、`tests/ts/`。

## 可验证契约

- [x] VC-001
  - 结果：五个生成模板的标题、章节和说明文字全部使用简体中文。
  - 边界：frontmatter 键、文件名、代码、命令和稳定标识保持英文。
  - 验证：中文模板契约测试检查章节、中文字符和禁止的英文默认标题。
- [x] VC-002
  - 结果：`change-capsule` 明确要求生成文档使用简体中文。
  - 边界：Agent-facing Skill 正文继续使用英文，不改变 Skill 发现契约。
  - 验证：source-scan 检查语言规则和稳定字段例外。
- [x] VC-003
  - 结果：所有现有活跃 Capsule 的标题、章节和叙述正文使用中文。
  - 边界：技术词、路径、命令和标识可保留英文。
  - 验证：遍历 `docs/coding-plugins/changes/` 检查中文标题及中文主体占比。

## 产物

- `change.md`：本次变更唯一整体状态源。
- `plan.md`：中文化实施计划。
- `evidence.md`：测试先行和最终验证证据。

## 批准记录

- 2026-07-11 范围/计划：用户明确要求“生成的文档需要使用中文”。
- 2026-07-11 执行：该指令直接要求修改当前生成文档契约并实施。

## 当前任务

已完成。中文生成契约、模板迁移、现有 Capsule 迁移和最终验证均已通过。

## 决策

- 生成文档叙述统一使用简体中文。
- 稳定机器字段、`VC-*`、路径、代码和命令保持英文，避免破坏互操作性。
- 不翻译 Skill 名称和文件名。

## 完成情况

- 已实现：五个中文模板、强制中文语言规则、中文 evidence 示例、中文 Quick 报告标签、现有 Capsule 中文化和重复模板清理。
- 已验证：25/25 测试、模板唯一性、英文默认标题零匹配、YAML/JSON 解析和 diff 检查。
- 延后项：无。
- 剩余风险：技术标识和机器字段保留英文是有意边界；外部系统已有的文档需要在后续维护时按相同规则迁移。
