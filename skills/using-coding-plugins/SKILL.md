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
| 读取、创建、迁移或审计 Coding Plugins 文档 metadata、frontmatter、README/INDEX 或 `related_docs` 关系 | `document-metadata` |
| 代码审查、合并前检查、需要第二视角 | `requesting-code-review` |
| 收到 review、PR 反馈、别人要求修改 | `receiving-code-review` |
| 验证是否完成、测试是否通过、能否宣称修好 | `verification-before-completion` |
| 收尾、merge、开 PR、清理分支或 worktree | `finishing-a-development-branch` |
| 提交、commit、`/commit`，或完成阶段用户选择提交 | `git-commit` |
| 创建、修改、优化 skill 或插件工作流 | `writing-skills` |
| 编写需求文档、需求规格、API 契约、schema、状态机、验收或维护规格 | `writing-requirements` |
| 编写 TSD 技术方案文档、架构方案、ADR 或 implementation design | `writing-technicals` |
| 编写测试用例文档、测试设计、TVD 测试用例章节 | `writing-test-cases` |
| 需要隔离当前工作区、创建 worktree 或避免污染主分支 | `using-git-worktrees` |
| 多个独立任务、多个失败点、可并行调查或实现 | `dispatching-parallel-agents` |

### 开发任务

进入开发链路前，如果任务范围不确定或可能过重，先用 `coding-plugins workflow-mode --intent "<用户意图>" --files "<逗号分隔路径>" --task-count <数量> --json` 推断 workflow mode。显式用户指令优先于推断结果。

| Workflow mode | 含义 | 默认处理 |
| --- | --- | --- |
| `analysis-only` | 只分析、解释、读取或 review，不改代码 | 不创建正式文档 |
| `docs-only` | 文档、索引、说明或配置类轻量改动 | 直接编辑并验证文档/配置完整性 |
| `tdd-only` | 小型明确行为变更，≤2 任务且 ≤2 文件 | 走 `test-driven-development`，必要时写 inline spec |
| `full-chain` | 新功能、API/schema/状态机/验收标准或契约不清 | 走完整 PRD -> TSD -> TVD -> TED -> VED |
| `maintenance-chain` | 迁移、升级、重构、安全、性能且影响兼容或验证口径 | 写 maintenance PRD，再走完整链路 |

| 任务情况 | 使用技能 |
| --- | --- |
| 功能构想、产品方向或方案边界还未收敛，用户尚未确认进入正式文档链路 | `brainstorming` |
| 新需求、行为变更、接口契约、schema、状态机或验收标准不清，且已经确认需要正式落地 | `spec-driven-development` 编排，进入 `writing-requirements` |
| 维护、重构、依赖升级、迁移、安全或性能改造会影响外部行为、兼容性或验证口径 | `spec-driven-development` 编排，进入 `writing-requirements` 写 maintenance 需求文档 |
| 已有批准 PRD，需要 TSD 技术方案文档 | `writing-technicals` |
| 已有批准 PRD 和 TSD，需要 TVD 测试设计 | `writing-test-cases` |
| 已有批准 PRD、TSD 和 TVD，需要 TED 任务执行文档 | `writing-plans` |
| 已有 TED 任务执行文档，需要执行 | 先 `using-git-worktrees`，再 `subagent-driven-development` 或 `executing-plans` |
| 小型明确变更，验收标准清楚且可测试 | `test-driven-development`，必要时在计划或回复中写 inline spec |
| bug、CI 失败、测试失败、构建失败、异常行为、原因不明或回归难复现 | `systematic-debugging`，需要修复时转 `test-driven-development` |
| 纯内部重构且行为不变，但仍可测试 | `test-driven-development` |

### 组合规则

- 用户点名技能时，优先读取该技能；若明显不适用，说明原因并转入更合适技能。
- 任何技能需要读取或维护 `docs/coding-plugins/features/<feature-name>/` 下的 README、PRD、TSD、TVD、TED 或 VED 关系时，先使用 `document-metadata` 确认 frontmatter 和 `related_docs` 关系。
- 当用户说“继续”“恢复”“开始实现”“执行 TED”，且能识别 `feature` 和 `doc_id` 时，先运行 `coding-plugins workflow-state inspect --feature <feature> --doc-id <doc-id> --json`。输出必须说明当前状态、判断原因、缺失产物、是否 stale、推荐下一个 skill。
- 执行 TED 前必须运行 `coding-plugins workflow-guard check --feature <feature> --doc-id <doc-id> --target execute --json`；未通过时按 `next_skill` 回退，不得继续实现。
- `workflow-guard.ts` 通过后，运行 `coding-plugins workflow-brief --feature <feature> --doc-id <doc-id> --target execute --task TASK-001 --json` 生成短上下文；默认只读 TED 的 `## 执行简报`、`## 执行锁定区`、`## 任务总览` 和当前任务章节，除非 Rewind Triggers 命中，不重复读取完整 PRD/TSD/TVD。未知当前任务时可以省略 `--task`，但多任务 TED 应优先指定。
- 进入 `subagent-driven-development` 时，优先运行 `coding-plugins subagent-prompt-builder --feature <feature> --doc-id <doc-id> --task TASK-001 --kind implementer` 生成实现子代理提示词；评审阶段用同一脚本生成 `spec-reviewer` 和 `code-quality-reviewer` 提示词，避免手工漏粘 TED 锁定区、当前任务或 prompt hash。
- 如果 `workflow-state.ts` 输出 `plan-draft`、`plan-unlocked` 或 `plan-stale`，不得进入实现；先路由到 `writing-plans` 批准 TED、补齐 `source_hash`，或刷新执行锁定区。
- 需要声称完成、修复或通过前，必须使用 `verification-before-completion`。
- 需要提交时必须使用 `git-commit`；提交前仍要检查 diff、作者身份和敏感文件。
- 需要从需求进入执行任务时，先用 `writing-requirements` 写 PRD，再用 `writing-technicals` 写 TSD 技术方案文档，再用 `writing-test-cases` 写 TVD，最后用 `writing-plans` 编写 TED 任务执行文档。
- `brainstorming` 只做 SDD 前的构思收敛；用户确认进入落地后，才转入 `spec-driven-development`，并且不得在 brainstorming 阶段创建 README、PRD、TSD、TVD、TED 或 VED。
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

恢复旧任务或准备执行 TED 时，输出固定字段：

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

## 决策点协议

工作流中的用户确认点使用 DP-0 到 DP-7 编号。需要展示或校验完整定义时运行：

```bash
coding-plugins decision-points --json
```

| 决策点 | 名称 | 默认位置 |
| --- | --- | --- |
| DP-0 | 进入正式链路确认 | brainstorming/analysis 转入正式 SDD 前 |
| DP-1 | 需求批准 | PRD 完成后、TSD 前 |
| DP-2 | 技术方案批准 | TSD 完成后、TVD 前 |
| DP-3 | 测试用例批准 | TVD 完成后、TED 前 |
| DP-4 | 执行计划批准 | TED 完成后、实现前 |
| DP-5 | TDD 例外或调试升级 | RED 受阻、连续修复失败或偏离 TED 时 |
| DP-6 | 完成验证确认 | 声称完成、修复或提交前 |
| DP-7 | 提交和分支收尾确认 | commit、PR、merge、worktree 清理前 |

到达决策点时，先说明对应 DP 编号、所需输入和预期输出；未经用户确认，不得跨过该门禁。

## 输出原则

中文回复优先，工程名词可保留英文。保持结论清楚、步骤可执行、证据具体。
