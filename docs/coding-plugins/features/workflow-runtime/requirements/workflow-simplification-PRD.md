---
title: Coding Plugins 工作流简化与工程策略绑定
type: maintenance
status: approved
feature: workflow-runtime
doc_id: workflow-simplification
created: 2026-07-11
updated: 2026-07-11
tags:
  - workflow
  - routing
  - decision-points
  - engineering-policy
  - skills
related_code:
  - src/lib/workflow
  - src/lib/documents
  - src/lib/agents
  - src/cli
  - skills
  - hooks/session-start-codex
related_docs:
  - docs/coding-plugins/features/workflow-runtime/technicals/workflow-simplification-TSD.md
  - docs/coding-plugins/features/workflow-runtime/test-cases/workflow-simplification-TVD.md
  - docs/coding-plugins/features/workflow-runtime/plans/workflow-simplification-TED.md
  - docs/coding-plugins/features/workflow-runtime/evidences/workflow-simplification-VED.md
---

# Coding Plugins 工作流简化与工程策略绑定需求文档

## 阅读摘要

- **本文结论:** 将当前多入口、多状态解释的工作流收敛为 Inspect、Change、Governed Change 三条用户可见链路，并在 Governed Change 中建立范围、技术、执行三个批准点。
- **当前状态:** 已通过 DP-1 范围批准，进入 TSD 技术方案设计。
- **先读重点:** 先看目标、非目标、当前基线和需求总览，再检查每个需求点的行为与验收标准。
- **下游同步:** DP-1 批准后创建同一 `doc_id` 的 TSD 与 TVD；TSD/TVD 共同通过 DP-2 技术批准后创建 TED，并在 DP-3 执行批准后进入实现。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | workflow-runtime |
| Doc ID | workflow-simplification |
| 文档类型 | maintenance |

## 目标

- 让普通分析和日常代码变更不再承担正式交付链的全部流程成本。
- 保留高风险变更所需的范围锁定、技术审查、执行锁定、证据和提交安全能力。
- 让 CLI 对 mode、state、allowed actions、next skill 和 next action 只产生一份自洽决策。
- 让自定义代码规范和 Skills 在技术批准时转化为可追踪、可验证、可失效重审的工程约束。
- 让长会话可以恢复 active change，并在范围扩大时显式进入 rescope 或新 change。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 本链路不在第一阶段开放任意自定义 artifact graph；先交付内置三流程和稳定契约，避免配置系统引入新的复杂度。 |
| NON-002 | 本链路不删除现有 PRD/TSD/TVD/TED/VED、DP、source hash、workflow guard、TDD evidence 或 commit safety。 |
| NON-003 | 本链路不要求每个 Quick Change 创建正式流程文档。 |
| NON-004 | 本链路不把个人机器上的绝对 Skill 路径直接定义为团队可复现的正式工程政策。 |
| NON-005 | 长期行为 specs 与 delta/archive 的完整实现不属于第一阶段完成门禁，但设计必须预留后续兼容入口。 |

## 当前基线

- 当前公开五种 workflow mode：`analysis-only`、`docs-only`、`tdd-only`、`full-chain`、`maintenance-chain`。
- 当前主流程同时暴露 `task`、`start`、`state`、`workflow-mode`、`workflow-state`、`workflow-guard`、`workflow-brief`、`dp` 和 `scope-check` 等入口。
- 当前 `task status` 在缺少真实文件数和任务数时可能把未知范围当作小范围，并可能同时返回互相矛盾的 mode、next skill 和 next command。
- 当前长会话需要反复加载 router 和专业 Skills，active feature、doc id 和 task 恢复依赖对话或手工参数。
- 当前 evidence validator 在缺少 root、strict 或 artifact mode 上下文时可能给出无法代表正式完成资格的通过结果。
- 当前正式链只有范围、文档阶段和执行相关 DP，尚未形成 TSD、TVD、工程 Policy 与 Skill 绑定的一体化技术批准。

## 成功指标

- 代表性真实会话意图全部得到稳定、唯一且自洽的路由结果。
- 普通 Change 不要求 Agent 手动串联 workflow state、DP audit、guard、brief 和 scope check。
- Governed Change 只能按 DP-1、DP-2、DP-3 顺序跨越范围、技术和执行边界。
- required Policy 均有设计响应和验证映射；required Skill 或 Policy 变化会使技术批准失效。
- ignored 或 local evidence 不再被报告为可用于 formal completion。
- 已存在的 v1 文档链和 CLI 调用在兼容期内仍可读取或得到明确迁移诊断。

## 需求总览

| 规格 ID | 标题 | 优先级 | 类型 | 验证类型 | 验证证据 |
| --- | --- | --- | --- | --- | --- |
| REQ-001 | 三条用户可见工作流 | 必须 | state | 路由回放 | `tests/ts/workflow-runtime-routing.test.mjs` |
| REQ-002 | 唯一路由决策契约 | 必须 | api | Contract test | `tests/ts/workflow-runtime-contract.test.mjs` |
| REQ-003 | Active Change 与范围漂移 | 必须 | state | 状态测试 | `tests/ts/workflow-runtime-active-change.test.mjs` |
| REQ-004 | 分层文档沉淀 | 必须 | maintenance | Fixture 校验 | `tests/ts/workflow-runtime-artifacts.test.mjs` |
| REQ-005 | 三批准点治理链 | 必须 | state | 决策点测试 | `tests/ts/workflow-runtime-decisions.test.mjs` |
| REQ-006 | 工程 Policy 与 Skill 解析 | 必须 | schema | Resolver test | `tests/ts/workflow-runtime-policy-resolver.test.mjs` |
| REQ-007 | 技术批准包 | 必须 | maintenance | Validator test | `tests/ts/workflow-runtime-technical-approval.test.mjs` |
| REQ-008 | Policy 到执行和证据追踪 | 必须 | maintenance | Coverage test | `tests/ts/workflow-runtime-policy-coverage.test.mjs` |
| REQ-009 | Evidence 与完成语义 | 必须 | state | Evidence test | `tests/ts/workflow-runtime-completion.test.mjs` |
| REQ-010 | 单一主入口与紧凑 Agent Contract | 应该 | api | CLI e2e | `tests/ts/workflow-runtime-cli.test.mjs` |
| MIG-001 | v1 工作流兼容迁移 | 必须 | maintenance | Compatibility | `tests/ts/productization-cli.test.mjs` |
| OBS-001 | 可解释路由与门禁诊断 | 应该 | maintenance | Diagnostics | `tests/ts/workflow-runtime-diagnostics.test.mjs` |

## 三条用户可见工作流（REQ-001）

### 需求描述

系统必须只向普通用户和 Agent 暴露 Inspect、Change、Governed Change 三类主流程；现有 docs-only、maintenance、release 和 security 等差异作为动作属性或 Governed profile 处理，而不是要求用户理解更多并列 mode。

### 行为规则

- Inspect 用于只读分析、解释、review 和状态查询，不创建正式 feature 文档或 VED。
- Change 用于明确、低至中风险的日常开发，执行 Scope/Acceptance、TDD、Verification 和 Completion Audit。
- Governed Change 用于 public API、schema、migration、SDK、安全、release、跨仓库、多 feature 或高回滚成本变更。
- Change 发生高风险范围扩张时必须升级为 Governed Change，不能继续沿用原轻量证据语义。

### 验收标准

- AC-001：输入“分析云端配置怎么实现”时返回 Inspect，且 next action 为直接分析。
- AC-002：输入“按钮问号文本改为 Icon”时返回 Change，且不会要求创建 PRD。
- AC-003：输入“数据库 schema 和 protobuf 同步重构”时返回 Governed Change。
- AC-004：任何路由结果只包含一个主流程和一个下一动作。

## 唯一路由决策契约（REQ-002）

### 需求描述

CLI 必须先形成唯一 RouteDecision，再由该决策派生 mode、state、allowed actions、blocked actions、next skill 和 next action；未知 scope 不得按零任务或零文件处理。

### 行为规则

- “分析怎么实现”与“开始实现”必须区分。
- 缺少文件数、任务数或 feature 数时，scope 必须为 unknown。
- route、workflow state 和 document state 冲突时必须返回阻断诊断，而不是拼接互相矛盾的下一步。
- Agent JSON contract 必须有 schema version 和稳定 reason codes。

### 验收标准

- AC-005：不得出现 `tdd-only` 与 `spec-driven-development` 同时作为当前 route 和 next skill 的矛盾结果。
- AC-006：相同 intent、仓库状态和 active change 输入必须得到确定性相同的 JSON 输出。

## Active Change 与范围漂移（REQ-003）

### 需求描述

系统必须持久化当前 change、task、scope 和 route fingerprint，并允许从正式文档重建；用户说“继续”时必须恢复 active change，而不是重新从零分类。

### 行为规则

- 新 intent 必须分类为 within-scope、expanded、new-change 或 uncertain。
- expanded 必须进入 needs-rescope；new-change 必须创建独立 change。
- 本地 session state 只能作为缓存，不能作为正式需求或完成证据。
- 缺少项目状态文件时，系统应从 active change、feature README 和 frontmatter 中发现唯一候选链。

### 验收标准

- AC-007：已有唯一执行链且缺少 `.coding-plugins.yaml` 时可自动恢复 feature/doc id。
- AC-008：已完成 SDK TED 后新增数据库性能优化时返回 new-change，而不是继续追加旧 VED。

## 分层文档沉淀（REQ-004）

### 需求描述

系统必须按照任务风险和持续时间控制文档成本，不得要求所有任务生成相同数量的 artifact。

### 行为规则

- Inspect 默认不生成正式文档；用户要求待审核时可以写入 `todo.md`，形成长期决策时可以创建 ADR。
- Quick Change 不生成流程文档，以代码、测试、completion report 和 commit 作为交付物。
- Standard Change 最多使用一份 `change.md`，承载 Intent、Acceptance、Scope、Tasks、Decisions、Evidence 和 Completion。
- Governed Change 使用 PRD/TSD/TVD/TED/VED。
- 第一阶段不得同时为 Standard Change 强制生成 proposal、design、tasks 和 VED 多份文档。

### 验收标准

- AC-009：单按钮修改可在零流程文档下完成验证。
- AC-010：跨多个回合的 UI 优化只需要一份 `change.md`。
- AC-011：高风险 schema migration 必须使用完整正式链。

## 三批准点治理链（REQ-005）

### 需求描述

Governed Change 必须按 DP-1 范围批准、DP-2 技术批准、DP-3 执行批准推进。

### 行为规则

- DP-1 批准 PRD 中的问题、目标、非目标、requirements、acceptance 和兼容边界。
- DP-2 联合批准 review-ready 的 TSD、TVD、resolved Policies、required Skills、技术例外和测试覆盖。
- DP-3 批准 TED、任务顺序、执行环境、回滚操作、验证门禁和 commit 边界。
- TSD 与 TVD 在 DP-2 前使用 review-ready 状态；DP-2 通过后共同进入 approved。
- 未通过当前 DP 时不得创建或执行要求下一个 DP 批准的产物和动作。

### 验收标准

- AC-012：未通过 DP-1 时不能进入技术设计批准。
- AC-013：TSD 或 TVD 未达到 review-ready 时不能通过 DP-2。
- AC-014：未通过 DP-2 时不能批准或执行 TED。
- AC-015：TED 或执行门禁变化后 DP-3 必须 stale。

## 工程 Policy 与 Skill 解析（REQ-006）

### 需求描述

系统必须把项目工程规范与 Agent Skills 区分：Policy 定义必须遵守什么，Skill 定义 Agent 如何应用；技术批准绑定解析后的 Policy 约束，而不是只记录 Skill 名称或个人绝对路径。

### 行为规则

- Policy 支持 required、recommended、informative 三个等级。
- required Policy 必须有可复现来源、稳定 ID 和 hash。
- 仓库内 Policy 和版本锁定的插件 Skill 可以进入正式批准；个人机器 Skill 默认只能 advisory，除非其规范已沉淀到仓库 Policy。
- resolver 必须根据仓库类型、受影响文件、PRD、工程 profile 和用户显式指定 Skill 选择适用集合。
- required Policy 冲突、来源缺失或不可复现时必须阻止 DP-2。

### 验收标准

- AC-016：Flutter 改动可解析 `flutter-dart-development-standards` 为执行 Skill，并绑定仓库内 Flutter Policy。
- AC-017：个人绝对路径 Skill 不能单独成为 required formal Policy 来源。
- AC-018：required Policy 变化会导致 DP-2 approval stale；advisory Skill 变化不会。

## 技术批准包（REQ-007）

### 需求描述

DP-2 必须把 TSD、TVD、Policy binding 和 Skill plan 作为一个技术批准包审核。

### 行为规则

- TSD 必须包含工程 profile、Policy 到设计映射、Skill 使用计划、冲突与例外、Policy verification gates。
- TVD 必须同时覆盖业务 Test ID 和工程 Policy Test ID。
- 每个 required Policy 必须至少有一个设计响应和一个测试、静态检查或人工审查门禁。
- 未批准的 required Policy 例外必须阻止 DP-2。

### 验收标准

- AC-019：缺少 Policy 到设计映射的 TSD 不能通过技术批准校验。
- AC-020：required Policy 没有 TVD 覆盖时不能通过 DP-2。

## Policy 到执行和证据追踪（REQ-008）

### 需求描述

已批准 Policy 必须继续追踪到 TED task、workflow brief 和 VED evidence，不能在 DP-2 后丢失。

### 行为规则

- TED task 必须列出相关 Spec IDs、Test IDs、Policy IDs、required Skills 和 required verification。
- workflow brief 只返回当前 task 所需的 required Skills 和 Policy IDs。
- VED 必须分别记录 Requirement Evidence 和 Policy Evidence。
- required Policy coverage 必须参与 completion audit。

### 验收标准

- AC-021：任一 required Policy 未覆盖到 Test、Task 或 Evidence 时 formal completion 被阻止。
- AC-022：无关 Skill 不得出现在当前 task 的 must-read 集合中。

## Evidence 与完成语义（REQ-009）

### 需求描述

系统必须区分 implementation、verification、workflow、commit 和 publish 完成状态，并明确 evidence 的适用范围。

### 行为规则

- ignored 或 local evidence 可以作为本地辅助记录，但不能作为 formal workflow completion。
- validator 输出必须包含 `valid_for` 和 `formal_completion_allowed`，不能只输出无上下文的 passed。
- completion audit 必须检查 task、测试、Policy coverage、scope、source hash、DP 和 artifact mode。
- `ready-for-execution` 不能在所有任务完成后继续代表最终状态。

### 验收标准

- AC-023：ignored VED 通过内容校验时仍返回 formal completion blocked。
- AC-024：所有任务和证据完成后 workflow state 可以进入 complete，而不是继续停留在 ready-for-execution。

## 单一主入口与紧凑 Agent Contract（REQ-010）

### 需求描述

系统应该通过单一主入口聚合 route、state、DP、guard、brief、scope 和 completion 检查，并提供稳定、紧凑的 Agent JSON contract。

### 行为规则

- 普通 Agent 不需要手工依次调用 workflow-state、dp audit、workflow-guard、workflow-brief 和 scope-check。
- 现有细粒度命令可以保留为 debug 或兼容入口。
- next command 使用 session 提供的 CLI reference 和结构化 args，不依赖业务仓库中的 `node ./bin/coding-plugins.js`。

### 验收标准

- AC-025：一次 status 调用可以返回唯一下一步、阻断原因和当前 task context。
- AC-026：业务仓库缺少 `bin/coding-plugins.js` 时不会生成错误 fallback。

## v1 工作流兼容迁移（MIG-001）

### 需求描述

现有 feature 文档链、状态文件、命令和 JSON 消费方必须获得兼容读取或明确迁移诊断，不能静默改变语义。

### 行为规则

- v1 PRD/TSD/TVD/TED/VED 路径保持可识别。
- JSON contract 必须通过 schema version 区分。
- 旧命令在兼容期内转发到新入口或返回可执行迁移提示。
- 迁移不得把 local evidence 自动提升为 formal evidence。

### 验收标准

- AC-027：当前 formal feature fixtures 在迁移后仍通过兼容回归。
- AC-028：旧 JSON 调用方可以检测版本变化并得到稳定错误或兼容字段。

## 可解释路由与门禁诊断（OBS-001）

### 需求描述

系统应该提供稳定 reason codes 和结构化 diagnostics，解释 route、scope、Policy conflict、stale approval 和 completion 阻断原因。

### 验收标准

- AC-029：每个阻断结果包含至少一个稳定 reason code 和对应修复动作。
- AC-030：相同阻断原因在 text 与 JSON 输出中保持语义一致。

## 假设与依赖

- 假设：现有 PRD/TSD/TVD/TED/VED 文档契约、正式 fixture 和 CLI 用户需要在迁移期间继续工作。
- 假设：三流程是用户可见抽象，内部 maintenance、release 和 security profile 可以继续存在。
- 依赖：现有 document metadata、workflow state、decision state、guard、brief、artifact mode 和 validator 模块可作为渐进重构基础。
- 依赖：required Policy 必须有仓库内或版本锁定插件来源；个人 Skill 只有在规范已沉淀为可复现 Policy 后才能进入正式技术批准。
- 约束变化处理：任一假设不成立时必须返回 DP-1 更新范围，不能在 TSD 中隐式扩大需求。

## 风险与假设

- 一次性重写所有 workflow 模块会扩大兼容风险；实现必须按契约、状态恢复、技术批准、完成语义分阶段交付。
- Policy 与 Skill 绑定可能增加文档负担；只有 required Policy 进入阻断映射，recommended 和 informative 保持轻量。
- 三流程是用户可见模型，内部仍可保留 maintenance、release、security 等 profile。
- 长期 specs、delta 和 archive 是后续能力，本阶段只保留兼容入口，不作为首轮实现阻断条件。

## 开放问题

- 无：本轮分析已确认三流程、三批准点、Policy/Skill 职责分离和第一阶段非目标；具体数据结构、CLI 命名和迁移步骤进入 TSD 决策。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | 路由回放 | tests/ts 下新增真实会话路由 fixture | 计划中 |
| REQ-002 | Contract test | TaskStatus/RouteDecision JSON schema tests | 计划中 |
| REQ-003 | 状态测试 | active change 和 scope drift state tests | 计划中 |
| REQ-004 | 文档 fixture | Quick/Standard/Governed artifact fixtures | 计划中 |
| REQ-005 | 决策点测试 | DP-1/DP-2/DP-3 transition tests | 计划中 |
| REQ-006 | Resolver test | Policy/Skill 来源、等级、冲突和 hash tests | 计划中 |
| REQ-007 | Validator test | TSD/TVD technical approval bundle tests | 计划中 |
| REQ-008 | Coverage test | Policy-to-Test-to-Task-to-Evidence tests | 计划中 |
| REQ-009 | Evidence test | artifact mode 和 completion state tests | 计划中 |
| REQ-010 | CLI e2e | 聚合入口和紧凑 JSON contract tests | 计划中 |
| MIG-001 | Compatibility | existing formal fixture and command tests | 计划中 |
| OBS-001 | Diagnostics | reason code snapshot tests | 计划中 |
