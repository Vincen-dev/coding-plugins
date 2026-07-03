---
name: using-coding-plugins
description: 开始任何任务时使用；建立 Coding Plugins 技能选择、优先级和 Codex 或 Claude Code 平台规则。
---

<SUBAGENT-STOP>
如果你是被派发来执行明确子任务的子代理，且父任务已经指定了工作方式，可以跳过本技能。
</SUBAGENT-STOP>

# 使用 Coding Plugins

## 核心规则

只要当前任务有可能匹配某个技能，就先读取并使用该技能。技能负责约束“怎么做”，用户负责决定“做什么”。当用户显式指令和技能冲突时，用户指令优先。

## 任务类型判断

先判断直接意图，再判断开发任务类型。多个技能同时适用时，先满足用户明确请求和安全门禁，再进入开发流程。

### 直接意图

| 用户意图 | 使用技能 |
| --- | --- |
| 解释、搜索、读取、状态查询，不要求改代码 | 普通分析或对应工具 |
| 方案讨论、头脑风暴、产品方向不清、是否值得做、先分析不落地 | `brainstorming` |
| 读取、创建、迁移或审计 Coding Plugins 文档 metadata、frontmatter、README/INDEX 或 `related_*` 关系 | `document-metadata` |
| 代码审查、合并前检查、需要第二视角 | `requesting-code-review` |
| 收到 review、PR 反馈、别人要求修改 | `receiving-code-review` |
| 验证是否完成、测试是否通过、能否宣称修好 | `verification-before-completion` |
| 收尾、merge、开 PR、清理分支或 worktree | `finishing-a-development-branch` |
| 提交、commit、`/commit`，或完成阶段用户选择提交 | `git-commit` |
| 创建、修改、优化 skill 或插件工作流 | `writing-skills` |
| 编写需求文档、需求规格、API 契约、schema、状态机、验收或维护规格 | `writing-requirements` |
| 编写 TDD 技术设计、TID 技术实现、架构方案、ADR 或 implementation design | `writing-technicals` |
| 编写测试用例文档、测试设计、TCD 测试用例章节 | `writing-test-cases` |
| 需要隔离当前工作区、创建 worktree 或避免污染主分支 | `using-git-worktrees` |
| 多个独立任务、多个失败点、可并行调查或实现 | `dispatching-parallel-agents` |

### 开发任务

| 任务情况 | 使用技能 |
| --- | --- |
| 功能构想、产品方向或方案边界还未收敛，用户尚未确认进入正式文档链路 | `brainstorming` |
| 新需求、行为变更、接口契约、schema、状态机或验收标准不清，且已经确认需要正式落地 | `spec-driven-development` 编排，进入 `writing-requirements` |
| 维护、重构、依赖升级、迁移、安全或性能改造会影响外部行为、兼容性或验证口径 | `spec-driven-development` 编排，进入 `writing-requirements` 写 maintenance 需求文档 |
| 已有批准 PRD，需要 TDD/TID 技术文档 | `writing-technicals` |
| 已有批准 PRD 和 TDD/TID，需要 TCD 测试设计 | `writing-test-cases` |
| 已有批准 PRD、TDD/TID 和 TCD，需要 IPD 任务执行文档 | `writing-plans` |
| 已有 IPD 任务执行文档，需要执行 | 先 `using-git-worktrees`，再 `subagent-driven-development` 或 `executing-plans` |
| 小型明确变更，验收标准清楚且可测试 | `test-driven-development`，必要时在计划或回复中写 inline spec |
| bug、CI 失败、测试失败、构建失败、异常行为、原因不明或回归难复现 | `systematic-debugging`，需要修复时转 `test-driven-development` |
| 纯内部重构且行为不变，但仍可测试 | `test-driven-development` |

### 组合规则

- 用户点名技能时，优先读取该技能；若明显不适用，说明原因并转入更合适技能。
- 任何技能需要读取或维护 `docs/coding-plugins/features/<feature-name>/` 下的 README、PRD、TDD/TID、TCD、IPD 或 TED 关系时，先使用 `document-metadata` 确认 frontmatter 和 `related_*` 关系。
- 当用户说“继续”“恢复”“开始实现”“执行 IPD”，且能识别 `feature` 和 `doc_id` 时，先运行 `python3 scripts/workflow_state.py inspect --feature <feature> --doc-id <doc-id> --json`。输出必须说明当前状态、判断原因、缺失产物、是否 stale、推荐下一个 skill。
- 如果 `workflow_state.py` 输出 `plan-stale`，不得进入实现；先路由到 `writing-plans` 刷新 IPD 的 `source_hash` 和执行锁定区。
- 需要声称完成、修复或通过前，必须使用 `verification-before-completion`。
- 需要提交时必须使用 `git-commit`；提交前仍要检查 diff、作者身份和敏感文件。
- 需要从需求进入执行任务时，先用 `writing-requirements` 写 PRD，再用 `writing-technicals` 写 TDD/TID，再用 `writing-test-cases` 写 TCD，最后用 `writing-plans` 编写 IPD 任务执行文档。
- `brainstorming` 只做 SDD 前的构思收敛；用户确认进入落地后，才转入 `spec-driven-development`，并且不得在 brainstorming 阶段创建 README、PRD、TDD/TID、TCD、IPD 或 TED。
- 任务可并行拆分时，先用 `dispatching-parallel-agents` 拆分，再让每个子任务进入对应技能。
- 直接验证、直接提交或只创建 worktree 的请求，完成该动作后即可汇报；只有用户要求收尾或开发链路结束时，才进入 `finishing-a-development-branch`。

## 平台工具映射

- 在 Codex 中，见 `references/codex-tools.md`。如果技能中提到 Claude Code、Copilot 或 Gemini 工具名，按 Codex 等价能力执行。
- 在 Claude Code 中，见 `references/claude-tools.md`。插件技能以 `/coding-plugins:<skill-name>` 命名空间出现；Claude Code 原生工具名可直接使用。
- 不机械照搬工具名；始终按当前平台实际可用能力执行。

## 执行方式

1. 明确说明正在使用哪个技能以及目的。
2. 如技能包含检查清单，按清单推进。
3. 先收集足够上下文，再编辑。
4. 修改前说明编辑意图。
5. 完成前用命令、测试、审查或可复现证据验证；行为改动还要回报 TDD 证据 或 TDD 例外记录。

## 恢复状态输出

恢复旧任务或准备执行 IPD 时，输出固定字段：

```text
当前检测状态：
- Feature:
- Doc ID:
- State:
- Reason:
- Missing artifacts:
- Stale:
- Recommended next skill:
```

如果无法识别 `feature` 或 `doc_id`，先通过 `docs/coding-plugins/INDEX.md`、README frontmatter 或用户当前路径定位；定位失败时再向用户提一个阻塞问题。

## 输出原则

中文回复优先，工程名词可保留英文。保持结论清楚、步骤可执行、证据具体。
