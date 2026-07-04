---
name: subagent-driven-development
description: 在当前会话中执行包含独立任务的 TED 任务执行文档时使用。
---

# 子代理驱动开发

按计划执行：每个任务派发一个全新子代理，每个任务后做两阶段评审：先规格符合性，再代码质量。

**为什么用子代理：**把任务交给隔离上下文的专门代理。你构造它们需要的精确上下文，不让它们继承你的会话历史，从而保持聚焦，也保留主代理上下文用于协调。

**核心原则：**每个任务新子代理 + 两阶段评审（规格后质量）= 高质量快速迭代。

**连续执行：**不要在任务之间问用户是否继续。执行完整计划。只有 BLOCKED 且无法解决、歧义真正阻止推进、或所有任务完成时才停止。

## 何时使用

使用条件：

- 已有 TED 任务执行文档。
- 任务基本独立。
- 希望留在当前会话中协调。

如果任务紧密耦合或没有计划，先回到规格/计划或手动执行。

## 流程

1. 读取计划，提取所有任务的完整文本和上下文。
2. 创建任务清单。
3. 对每个任务：
   - 优先运行 `coding-plugins subagent-prompt-builder --feature <feature> --doc-id <doc-id> --task TASK-001 --kind implementer`，用生成的稳定提示词派发实现子代理。
   - 如果 builder 不可用，才手工使用 `implementer-prompt.md`，并粘贴完整当前任务章节、执行锁定区摘要、工作目录和 source_hash。
   - 如果子代理提问，补充上下文后重新派发或继续。
   - 子代理实现、测试；如任务要求提交，则按 `git-commit` 规则创建中文提交；随后自审。
   - 使用 `subagent-prompt-builder.ts --kind spec-reviewer --implementer-report "<实现子代理回报>"` 或 `spec-reviewer-prompt.md` 派发规格符合性评审。
   - 若规格不符合，让实现子代理修复并重新评审。
   - 规格通过后，使用 `subagent-prompt-builder.ts --kind code-quality-reviewer --implementer-report "<实现子代理回报>" --base-sha <task-base> --head-sha <task-head>` 或 `code-quality-reviewer-prompt.md` 派发代码质量评审。
   - 若质量有问题，让实现子代理修复并重新评审。
   - 两阶段都通过后，标记任务完成。
4. 所有任务完成后，派发最终整体代码评审。
5. 使用 `finishing-a-development-branch` 收尾。

## 模型选择

用能胜任的最低成本模型：

- 机械实现：清楚规格、1 到 2 个文件，用快速便宜模型。
- 集成和判断：多文件协调、模式匹配、调试，用标准模型。
- 架构、设计、评审：用最强可用模型。

## 实现子代理状态处理

- **DONE**：进入规格符合性评审。
- **DONE_WITH_CONCERNS**：先读 concern。若涉及正确性或范围，先处理；若只是观察，记录后继续评审。
- **NEEDS_CONTEXT**：补上下文后重新派发。
- **BLOCKED**：判断阻塞原因：缺上下文、需要更强推理、任务太大，或计划错误。必要时升级给用户。

不要忽略 escalation，也不要让同一模型在没有新信息时重试。

## Prompt 模板

- `skills/subagent-driven-development/scripts/subagent-prompt-builder.ts`：推荐入口。读取 `workflow-brief.ts` 结果和当前 TED 任务章节，生成实现、规格评审和质量评审提示词，并输出 prompt hash。
  - 生成评审提示词时必须传入真实实现报告；代码质量评审还必须传入真实 `base/head` SHA，禁止使用占位值派发评审。
- `implementer-prompt.md`：实现子代理。
- `spec-reviewer-prompt.md`：规格符合性评审。
- `code-quality-reviewer-prompt.md`：代码质量评审。

## 红旗

不要：

- 未经用户明确同意在 main/master 上实现。
- 跳过规格评审或质量评审。
- 带着未修复问题进入下个任务。
- 并行派发多个实现子代理改代码。
- 让子代理自己读计划文件；主代理应粘贴完整任务文本。
- 省略场景上下文。
- 忽略子代理问题。
- 规格评审未通过就做质量评审。
- 让实现者自审替代独立评审。

评审者发现问题时：同一实现子代理修复，评审者重新评审，直到通过。
