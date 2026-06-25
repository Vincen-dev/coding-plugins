---
name: using-superpowers
description: 开始任何对话时使用；兼容旧入口命名，要求在回复、提问或行动前先检查并调用相关技能。
---

<SUBAGENT-STOP>
如果你是被派发来执行明确子任务的子代理，且父任务已经指定了要用的技能，可以跳过本技能。
</SUBAGENT-STOP>

# 使用 Coding Plugins 旧入口兼容

<EXTREMELY-IMPORTANT>
只要你认为当前任务有哪怕 1% 的可能匹配某个技能，就必须先调用该技能。

如果技能适用于任务，你没有选择权，必须使用它。

这不是建议，也不是可选项。不要用“任务很简单”“我先看一下代码”“我记得这个技能”等理由绕开技能。
</EXTREMELY-IMPORTANT>

## 指令优先级

Coding Plugins 技能会覆盖默认工作习惯，但用户显式指令永远优先：

1. 用户显式指令、仓库规则、`AGENTS.md`、直接请求。
2. Coding Plugins 技能。
3. 默认系统行为。

如果仓库规则说不要用 TDD，而技能说必须 TDD，听用户和仓库规则。用户掌控目标和约束。

## 如何访问技能

- 在 Codex 中，按当前运行环境提供的 skill 机制读取技能。如果技能中提到 Claude Code、Gemini、Copilot 等工具名，使用 `references/codex-tools.md` 中的等价 Codex 能力执行。
- 在 Claude Code 中，插件技能以 `/coding-plugins:<skill-name>` 命名空间出现。技能中出现的 Claude 工具名可直接使用；需要映射时见 `references/claude-tools.md`。

## 使用规则

**在任何回复、澄清问题或行动之前，先调用相关或被点名的技能。** 如果调用后发现技能不适用，可以说明并换用更合适的技能。

优先级：

1. 流程技能优先：`spec-driven-development`、`systematic-debugging` 等决定如何推进。
2. 实现技能其次：TDD、代码评审、worktree、子代理等指导具体执行。

例子：

- “帮我做一个功能” -> 先 `spec-driven-development`，再 `writing-plans`。
- “修这个 bug” -> 先 `systematic-debugging`，可测试时再 `test-driven-development`。
- “按这个计划实现” -> `executing-plans` 或 `subagent-driven-development`。
- “提交这些改动”或“/commit” -> `git-commit`，使用中文提交并禁止 AI 作者。

## 红旗想法

| 想法 | 实际情况 |
| --- | --- |
| “这只是一个简单问题” | 问题也是任务。先检查技能。 |
| “我需要先了解上下文” | 技能会告诉你如何了解上下文。 |
| “我先快速看个文件” | 先判断是否有技能适用。 |
| “我记得这个技能” | 技能可能更新过，读取当前版本。 |
| “这个技能太重了” | 流程是为了防止小事变复杂。 |
| “先做这一步再说” | 行动前先检查技能。 |

## 技能类型

- **刚性技能**：TDD、调试等必须严格执行，不要随意简化纪律。
- **柔性技能**：设计模式、协作流程等可按上下文调整，但不能丢掉核心约束。

## 入口别名

`using-superpowers` 仅作为旧入口命名兼容；中文主入口是 `using-coding-plugins`。两者规则一致。
