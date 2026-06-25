---
name: using-coding-plugins
description: 开始任何任务时使用；建立 Coding Plugins 技能选择、优先级和 Codex 工具映射规则。
---

<SUBAGENT-STOP>
如果你是被派发来执行明确子任务的子代理，且父任务已经指定了工作方式，可以跳过本技能。
</SUBAGENT-STOP>

# 使用 Coding Plugins

## 核心规则

只要当前任务有可能匹配某个技能，就先读取并使用该技能。技能负责约束“怎么做”，用户负责决定“做什么”。当用户显式指令和技能冲突时，用户指令优先。

## 技能选择

- 新需求、功能构想、产品方向不清：`brainstorming`。
- 已有规格，需要落地步骤：`writing-plans`。
- 已有计划，需要实现：`subagent-driven-development` 或 `executing-plans`。
- 写功能或修 bug 且可测试：`test-driven-development`。
- 现象不明、原因不清、回归难复现：`systematic-debugging`。
- 任务可拆成独立调查、评审或实现块：`dispatching-parallel-agents`。
- 准备合并或需要第二视角：`requesting-code-review`。
- 收到评审意见后：`receiving-code-review`。
- 准备结束分支或交付：`finishing-a-development-branch`。
- 准备宣称完成：`verification-before-completion`。
- 用户要求提交、提到 commit/提交/`/commit`，或完成阶段需要创建提交：`git-commit`。
- 多分支或并行改动可能互相影响：`using-git-worktrees`。
- 需要创建或改造技能：`writing-skills`。

## Codex 工具映射

见 `references/codex-tools.md`。如果技能中提到其他平台工具名，按 Codex 等价能力执行，不机械照搬工具名。

## 执行方式

1. 明确说明正在使用哪个技能以及目的。
2. 如技能包含检查清单，按清单推进。
3. 先收集足够上下文，再编辑。
4. 修改前说明编辑意图。
5. 完成前用命令、测试、审查或可复现证据验证。

## 输出原则

中文回复优先，工程名词可保留英文。保持结论清楚、步骤可执行、证据具体。
