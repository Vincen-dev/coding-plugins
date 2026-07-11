---
title: Coding Plugins 工作流简化与工程策略绑定 Task Execution Document
status: approved
feature: workflow-runtime
doc_id: workflow-simplification
created: 2026-07-11
updated: 2026-07-11
source_hash: sha256:a6e90473165f3e9482faf99850729fede37770325f65fc1dde63f2723197af95
related_docs:
  - docs/coding-plugins/features/workflow-runtime/requirements/workflow-simplification-PRD.md
  - docs/coding-plugins/features/workflow-runtime/technicals/workflow-simplification-TSD.md
  - docs/coding-plugins/features/workflow-runtime/test-cases/workflow-simplification-TVD.md
  - docs/coding-plugins/features/workflow-runtime/evidences/workflow-simplification-VED.md
---

# Coding Plugins 工作流简化与工程策略绑定任务执行文档（TED）

## 阅读摘要

- **本文结论:** 通过 9 个连续、可单独回滚的 TDD 任务，把现有分散路由收敛为唯一 `WorkflowRuntime`，补齐 Active Change、文档分层、v2 决策目录、Policy/Skill 技术批准、coverage/completion，再迁移 CLI 与 SessionStart。最终成功标准是 v2 opt-in 全部通过、v1 contract 无回归、formal evidence 不误报、所有 required Policy 有 VED 证据。
- **当前状态:** 已通过当前 v1 DP-4 执行计划批准，等待 execution audit 与 workflow guard 后执行。
- **先读重点:** 先看执行锁定区、任务总览和任务依赖，再只读取当前 TASK 章节。
- **执行入口:** 用户批准 DP-4 后使用 `executing-plans` 在当前会话按检查点串行执行；本 TED 不授权并行 subagent。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | workflow-runtime |
| Doc ID | workflow-simplification |
| 文档类型 | TED |
| Source Hash | `sha256:a6e90473165f3e9482faf99850729fede37770325f65fc1dde63f2723197af95` |
| 批准语义 | 当前变更使用 governed-v1 DP-4；目标 governed-v2 的 DP-3 执行批准由 TASK-004 实现 |

## 目标

在保持现有 v1 文档链、命令和 JSON 消费方兼容的前提下，交付三条用户可见工作流、唯一决策契约、三批准点治理、可复现 Policy/Skill 绑定和可信 completion 语义。

## 执行入口

- 推荐方式：`executing-plans`，一次执行一个 TASK，任务完成后检查 VED、diff 和 targeted tests。
- 执行约束：所有源码、配置、架构和 source-scan 行为变更先写失败测试；无法制造合理 RED 时先停止并申请 TDD 例外，不事后补写。
- 新鲜度检查：实现前运行 `node bin/coding-plugins.js workflow-state inspect --root . --feature workflow-runtime --doc-id workflow-simplification --json`。
- 执行门禁：实现前运行 `node bin/coding-plugins.js dp audit --root . --feature workflow-runtime --doc-id workflow-simplification --target execute --json` 和 `workflow-guard ... --target execute --json`；任一失败都不修改源码。
- 当前任务简报：每个任务开始前运行 `workflow-brief --task TASK-xxx`，只读取返回的必需上下文。

## 执行锁定区

- **Intent Lock:** 只实现 workflow simplification v1-to-v2 渐进迁移，不顺带重构无关 CLI、发布系统、Skills 内容或业务仓库。
- **Scope Fence:** 包含路由/runtime、active change、Standard Change schema、decision catalog、Policy resolver、technical approval、coverage、completion、task facade、SessionStart、相关模板/validator/迁移文档与测试；不包含任意 workflow DSL、长期 specs delta/archive、删除 v1 contract、默认 major-version 切换、真实外部插件安装、发布或提交。
- **Required Spec IDs:** REQ-001、REQ-002、REQ-003、REQ-004、REQ-005、REQ-006、REQ-007、REQ-008、REQ-009、MIG-001；REQ-010、OBS-001 同期交付。
- **Required Policy IDs:** POL-ARCH-001、POL-COMPAT-001、POL-TDD-001、POL-VERIFY-001、POL-DOC-001。
- **Required Tests:** TC-001 至 TC-012、TC-101/TC-POL-ARCH-001 至 TC-105/TC-POL-DOC-001，以及现有 `productization-cli.test.mjs`、`workflow-state.test.mjs`、`src-architecture.test.mjs`。
- **Review Gates:** 每个 TASK 完成后检查 Spec/Test/Policy 映射、targeted tests、`git diff --check` 和新增文件范围；TASK-004 后审查 v1/v2 DP 语义；TASK-008 后审查 formal eligibility；TASK-009 运行全量验证。
- **Rewind Triggers:** 上游 PRD/TSD/TVD 变化、source hash 不匹配、需要改变公开契约、出现新 schema/migration 行为、required Policy 冲突、范围跨出本仓库、验证失败表明设计假设不成立。
- **Rollback Boundary:** 每个 TASK 保持独立逻辑切片；发生失败时回退当前 TASK 的新增适配路径，保留前序已通过 contract，绝不改写历史 decision records 或提升 local evidence。

## 执行简报

- **执行来源:** 只按本 TED 的当前任务章节执行；TSD 决策和 TVD 断言由 source hash 锁定。
- **上下文预算:** 优先读取执行锁定区、任务总览、当前任务和 workflow brief；仅在 Rewind Trigger 触发时重读完整上游。
- **Policy/Skill 预算:** 每个任务只加载该任务列出的 required Skills 与 Policy IDs，避免每回合加载全部 Skills。
- **新计划策略:** 发现独立需求时创建新 change/TED，不向本 TED 追加超出锁定范围的任务。
- **证据策略:** 每个 TASK 的 RED/GREEN/REFACTOR、Requirement Evidence、Policy Evidence 写入同一 doc id 的 VED；TED 不记录实际输出。

## 上游约束摘要

- 需求约束：用户只感知 Inspect、Change、Governed Change；未知 scope 保持 unknown；Governed v2 只能按 DP-1/2/3 推进。
- 技术约束：一个 `RouteDecisionV2` 是唯一决策源；v1 通过显式 projection 兼容；`governed-v1` 和 `governed-v2` 的 DP 语义不能混用。
- Policy 约束：Policy 表达可复现约束，Skill 表达应用方法；personal absolute Skill 永远不能单独满足 formal required Policy。
- 测试约束：四个历史意图 fixture、v1 compatibility、required Policy coverage、local/ignored evidence 和 complete 终态都必须自动化覆盖。
- 交付约束：默认 contract 保持 v1；v2 先 opt-in。默认切换、v1 删除和发布另开 change。

## 任务总览

| 任务 | 标题 | 覆盖规格 | Test / Policy | 验证方式 | VED 记录 |
| --- | --- | --- | --- | --- | --- |
| TASK-001 | 建立唯一路由决策契约 | REQ-001、REQ-002、OBS-001 | TC-001、TC-002、TC-012；POL-ARCH-001 | routing/contract/diagnostics tests | Requirement + Policy Evidence |
| TASK-002 | 接入 WorkflowRuntime 与 v1 投影 | REQ-002、REQ-010、MIG-001 | TC-002、TC-010、TC-011；POL-COMPAT-001 | runtime/contract/compatibility tests | Contract + Compatibility Evidence |
| TASK-003 | 实现 Active Change 与文档分层 | REQ-003、REQ-004 | TC-003、TC-004；POL-DOC-001 | active/artifact fixture tests | State + Artifact Evidence |
| TASK-004 | 实现版本化三批准点 | REQ-005、MIG-001 | TC-005、TC-102；POL-COMPAT-001 | decision/productization tests | Decision + Compatibility Evidence |
| TASK-005 | 实现 Policy/Skill Resolver | REQ-006 | TC-006；POL-ARCH-001、POL-DOC-001 | policy resolver/schema tests | Policy Resolution Evidence |
| TASK-006 | 实现技术批准包与文档契约 | REQ-007 | TC-007、TC-105；POL-DOC-001、POL-TDD-001 | technical approval/document tests | Technical Approval + Policy Evidence |
| TASK-007 | 贯通 Policy Coverage 与任务简报 | REQ-008 | TC-008；POL-TDD-001 | coverage/workflow brief tests | Policy Coverage Evidence |
| TASK-008 | 实现 Evidence Eligibility 与 Completion | REQ-009 | TC-009、TC-103、TC-104；POL-VERIFY-001 | completion/evidence tests | Completion + Verification Evidence |
| TASK-009 | 收敛 CLI/Hook 并完成兼容验证 | REQ-010、MIG-001、OBS-001 | TC-010、TC-011、TC-012、TC-101..105；全部 required Policies | CLI e2e、npm test、preflight | Final Requirement + Policy Evidence |

## 任务依赖与并行性

- TASK-001 是所有后续任务的 contract 基线。
- TASK-002 依赖 TASK-001，建立运行时编排和兼容投影。
- TASK-003、TASK-004、TASK-005 都依赖 TASK-002；它们概念上独立，但当前会话按 TASK-003 → TASK-004 → TASK-005 串行执行，减少共享 workflow state 文件冲突。
- TASK-006 依赖 TASK-004、TASK-005；批准包需要 catalog 与 resolved bundle。
- TASK-007 依赖 TASK-006；coverage graph 消费批准后的 Policy mapping。
- TASK-008 依赖 TASK-003、TASK-004、TASK-007；completion 消费 scope、DP、coverage 和 artifact eligibility。
- TASK-009 依赖 TASK-001 至 TASK-008，最后切换推荐入口和 hook，并完成全量兼容验证。
- 可并行任务：本 TED 不授权并行执行；若未来用户显式批准 delegation，只有 TASK-003/004/005 可在隔离 worktree 中并行，合并前仍需串行 compatibility gate。
- 任务完成定义：目标文件完成、targeted RED/GREEN/REFACTOR 通过、VED 两类 evidence 已更新、required Policy 无缺口、diff 无越界。

## 建立唯一路由决策契约（TASK-001 / REQ-001、REQ-002、OBS-001）

### 任务目标

提供确定性的 `IntentClassification`、`RouteDecisionV2` 和 diagnostics registry，让所有下游模块消费同一决策对象。

### 执行前提

- 已确认设计：TD-001、TD-002。
- 已确认测试：TC-001、TC-002、TC-012。
- Required Policy / Skill：POL-ARCH-001、POL-TDD-001；`test-driven-development`、`verification-before-completion`。

### 修改范围

- 创建：`src/lib/workflow/intent-classifier.ts`、`src/lib/workflow/route-decision.ts`、`src/lib/workflow/diagnostics.ts`。
- 创建：`tests/ts/workflow-runtime-routing.test.mjs`、`tests/ts/workflow-runtime-contract.test.mjs`、`tests/ts/workflow-runtime-diagnostics.test.mjs`。
- 修改：仅必要的 library export 文件；不接入 CLI、不改现有 task status。

### 执行步骤

- [ ] 用四个 S-* fixture 和 unknown/conflict cases 写 TC-001、TC-002、TC-012 失败测试。
- [ ] 运行 `node --test tests/ts/workflow-runtime-routing.test.mjs tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs`，确认 RED 来自缺少模块/行为。
- [ ] 最小实现类型、ordered classifier、route invariants、reason code registry 和稳定排序。
- [ ] 运行同一命令确认 GREEN；重构重复 input normalization 后再次运行。
- [ ] 运行 `node --test tests/ts/src-architecture.test.mjs`，确认 library 分层。
- [ ] 写入 VED 的 TASK-001 Requirement Evidence 与 POL-ARCH-001/TDD Policy Evidence。

### 验证方式

- 覆盖规格：REQ-001、REQ-002、OBS-001。
- 命令：`node --test tests/ts/workflow-runtime-routing.test.mjs tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs tests/ts/src-architecture.test.mjs`。
- 预期：Inspect/Change/Governed 唯一，unknown 不变零，diagnostics 稳定。

### VED 记录要求

- 章节：`## TASK-001：建立唯一路由决策契约`。
- 记录 RED 原因、GREEN API、REFACTOR 命令、TC-001/002/012、POL-ARCH-001 与 source hash。

## 接入 WorkflowRuntime 与 v1 投影（TASK-002 / REQ-002、REQ-010、MIG-001）

### 任务目标

新增唯一编排核心，并让现有 `task-status` 只做 v1 compatibility projection，不再二次决定 mode/next skill。

### 执行前提

- TASK-001 GREEN；TD-003、TD-010 生效。
- 已确认测试：TC-002、TC-010 的 library 部分、TC-011。
- Required Policy / Skill：POL-ARCH-001、POL-COMPAT-001、POL-TDD-001；`test-driven-development`。

### 修改范围

- 创建：`src/lib/workflow/workflow-runtime.ts`。
- 修改：`src/lib/workflow/task-status.ts`、`src/lib/workflow/workflow-mode.ts` 和必要 export。
- 创建/修改：`tests/ts/workflow-runtime-contract.test.mjs`、`tests/ts/workflow-runtime-cli.test.mjs`、`tests/ts/productization-cli.test.mjs`。
- 不修改：SessionStart 和默认 CLI contract；它们留到 TASK-009。

### 执行步骤

- [ ] 增加 evaluate-once、v1 projection、不可投影诊断和 default-v1/opt-in-v2 RED cases。
- [ ] 运行 `node --test tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-cli.test.mjs tests/ts/productization-cli.test.mjs` 确认 RED。
- [ ] 实现 `WorkflowRuntime.evaluate` 和 projector，移除 task-status 内重复路由分支。
- [ ] GREEN 后运行现有 scenario/workflow state tests，重构只保留单一 source of truth。
- [ ] VED 记录 v1 snapshot 保持和 v2 contract 差异。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-cli.test.mjs tests/ts/productization-cli.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/workflow-state.test.mjs`。
- 预期：v1 无回归，v2 可显式请求，旧矛盾组合不再生成。

### VED 记录要求

- 章节：`## TASK-002：接入 WorkflowRuntime 与 v1 投影`。
- 记录 TC-002/010/011、POL-COMPAT-001、投影失败诊断和回归命令。

## 实现 Active Change 与文档分层（TASK-003 / REQ-003、REQ-004）

### 任务目标

支持“继续”恢复、范围四分类，以及 Quick 零文档、Standard 单 change、Governed 完整链。

### 执行前提

- TASK-002 GREEN；TD-004、TD-005 生效。
- 已确认测试：TC-003、TC-004。
- Required Policy / Skill：POL-DOC-001、POL-TDD-001；`test-driven-development`、`document-metadata`。

### 修改范围

- 创建：`src/lib/workflow/active-change.ts`、`src/lib/workflow/scope-drift.ts`、`src/lib/documents/change-document.ts`。
- 创建：`templates/change-document.md` 或仓库既有模板目录下等价单一模板。
- 修改：`.gitignore` 的 local runtime state 规则、必要 documents exports。
- 创建：`tests/ts/workflow-runtime-active-change.test.mjs`、`tests/ts/workflow-runtime-artifacts.test.mjs`。

### 执行步骤

- [ ] 写恢复优先级、缓存损坏、多候选、scope 四分类和三 artifact profile 的 RED fixtures。
- [ ] 运行两个 target tests 确认 RED。
- [ ] 最小实现 store/discovery/classifier 和 Standard Change validator/scaffold。
- [ ] GREEN 后运行 metadata/file-naming/docs-index tests，确认新类型不污染 Governed chain。
- [ ] VED 记录缓存可丢弃、formal docs 可重建和三种文件清单。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-active-change.test.mjs tests/ts/workflow-runtime-artifacts.test.mjs tests/ts/document-metadata.test.mjs tests/ts/file-naming.test.mjs tests/ts/docs-index.test.mjs`。
- 预期：恢复确定、歧义阻断、scope 正确、文档数量符合分层。

### VED 记录要求

- 章节：`## TASK-003：实现 Active Change 与文档分层`。
- 记录 TC-003/004、POL-DOC-001、临时 fixture 和 cleanup 结果。

## 实现版本化三批准点（TASK-004 / REQ-005、MIG-001）

### 任务目标

新增 governed-v2 DP-1/2/3、批准 bundle hash 和 stale audit，同时原样保留 governed-v1 DP 含义。

### 执行前提

- TASK-002 GREEN；TD-006、TD-010 生效。
- 已确认测试：TC-005、TC-102/TC-POL-COMPAT-001。
- Required Policy / Skill：POL-COMPAT-001、POL-TDD-001；`test-driven-development`。

### 修改范围

- 修改：`src/lib/agents/decision-points.ts`、`src/lib/workflow/decision-state.ts`、相关 CLI adapter/export。
- 创建：`tests/ts/workflow-runtime-decisions.test.mjs`。
- 修改：`tests/ts/productization-cli.test.mjs`、`tests/ts/workflow-state.test.mjs`。

### 执行步骤

- [ ] 写 v1 snapshot、v2 顺序、hash/stale、advisory exclusion 和旧 record migration RED tests。
- [ ] 运行 decision/productization/workflow-state tests 确认 RED 且 v1 baseline 明确。
- [ ] 实现 catalog version、DecisionRecordV2、stable hash 和 audit；不改写旧 record。
- [ ] GREEN 后执行 v1/v2 双套回归，人工审查 DP 编号语义表。
- [ ] VED 分别记录 v1 compatibility 与 v2 decision evidence。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-decisions.test.mjs tests/ts/productization-cli.test.mjs tests/ts/workflow-state.test.mjs`。
- 预期：v1 语义不变，v2 三批准点严格有序，required 变化 stale。

### VED 记录要求

- 章节：`## TASK-004：实现版本化三批准点`。
- 记录 TC-005/102、POL-COMPAT-001、bundle hash 变化矩阵和 rollback 验证。

## 实现 Policy/Skill Resolver（TASK-005 / REQ-006）

### 任务目标

从项目 registry、仓库信号、PRD 风险、planned files 和显式 Skills 解析可复现 required Policy bundle。

### 执行前提

- TASK-002 GREEN；TD-007 生效。
- 已确认测试：TC-006。
- Required Policy / Skill：POL-ARCH-001、POL-DOC-001、POL-TDD-001；`test-driven-development`、`document-metadata`。

### 修改范围

- 创建：`src/lib/workflow/policy-resolver.ts`、Policy schema/type 定义。
- 创建：根级 `coding-plugins.policies.yaml` 的 schema 示例或默认项目 registry；不加入个人绝对路径。
- 创建：`tests/ts/workflow-runtime-policy-resolver.test.mjs` 和 fixture data。

### 执行步骤

- [ ] 写等级、appliesWhen、repo/plugin/personal source、冲突、缺失和 hash RED tests。
- [ ] 运行 policy resolver target 确认 RED。
- [ ] 最小实现 parser/normalizer/resolver/stable hash 和 root containment。
- [ ] GREEN 后 source-scan JSON 输出，确认不泄露 personal absolute path。
- [ ] VED 记录 resolved IDs、冲突 diagnostics 和 hash stability，不记录本机路径。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-policy-resolver.test.mjs tests/ts/src-architecture.test.mjs`。
- 预期：required bundle 可复现，personal Skill advisory，冲突/缺失阻断。

### VED 记录要求

- 章节：`## TASK-005：实现 Policy/Skill Resolver`。
- 记录 TC-006、POL-ARCH-001/POL-DOC-001、portable 判定和脱敏检查。

## 实现技术批准包与文档契约（TASK-006 / REQ-007）

### 任务目标

让 v2 DP-2 联合审计 TSD、TVD、Policy mapping、Skill plan 和 waiver，并让文档模板支持新字段。

### 执行前提

- TASK-004、TASK-005 GREEN；TD-008 生效。
- 已确认测试：TC-007、TC-105/TC-POL-DOC-001。
- Required Policy / Skill：POL-DOC-001、POL-TDD-001；`test-driven-development`、`writing-technicals`、`writing-test-cases`、`document-metadata`。

### 修改范围

- 创建：`src/lib/workflow/technical-approval.ts`。
- 修改：`skills/writing-technicals/templates/technical-design-document.md`、`skills/writing-test-cases/templates/test-cases.md`、`skills/document-metadata/templates/document-metadata.md`。
- 修改：相关 TSD/TVD validators、DP audit/approve adapter。
- 创建：`tests/ts/workflow-runtime-technical-approval.test.mjs`；修改 document contract tests。

### 执行步骤

- [ ] 写 missing design/test/skill source、waiver、review-ready 和完整 bundle RED tests。
- [ ] 运行 technical approval/document contract targets 确认 RED。
- [ ] 实现 audit，并更新模板/validator 使 Policy mapping 与 TC-POL 可解析。
- [ ] GREEN 后运行 strict TSD、TVD/schema、metadata 和 template contract tests。
- [ ] VED 记录每类阻断与完整 bundle，不伪造 v2 对本变更自身的审批。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-technical-approval.test.mjs tests/ts/document-contract-migration.test.mjs tests/ts/document-metadata.test.mjs tests/ts/skill-document-contract.test.mjs`。
- 预期：缺口阻断，完整 bundle 可批准，模板/metadata 一致。

### VED 记录要求

- 章节：`## TASK-006：实现技术批准包与文档契约`。
- 记录 TC-007/105、POL-DOC-001/POL-TDD-001 和 strict validator 输出。

## 贯通 Policy Coverage 与任务简报（TASK-007 / REQ-008）

### 任务目标

构建 Policy-to-Design-to-Test-to-Task-to-Evidence coverage graph，并让 workflow brief 只加载当前 task 的 Policy/Skill。

### 执行前提

- TASK-006 GREEN；TD-008 生效。
- 已确认测试：TC-008。
- Required Policy / Skill：POL-ARCH-001、POL-TDD-001；`test-driven-development`。

### 修改范围

- 创建：`src/lib/workflow/policy-coverage.ts`。
- 修改：`src/lib/workflow/workflow-brief.ts`、TED/ VED parser 和相应模板。
- 创建：`tests/ts/workflow-runtime-policy-coverage.test.mjs`；修改 workflow brief tests/fixtures。

### 执行步骤

- [ ] 写完整/缺 Design/Test/Task/Evidence、未知 Policy、双 task scoped brief RED tests。
- [ ] 运行 coverage 与 workflow brief targets 确认 RED。
- [ ] 实现 graph/audit 和 task-scoped extraction，保持旧 TED 无 Policy 字段时兼容诊断。
- [ ] GREEN 后验证 must_read 不含无关 Skills。
- [ ] VED 记录 coverage matrix 和 task brief snapshots。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-policy-coverage.test.mjs tests/ts/productization-cli.test.mjs`。
- 预期：required coverage 无缺口，缺节点阻断，brief 最小化。

### VED 记录要求

- 章节：`## TASK-007：贯通 Policy Coverage 与任务简报`。
- 记录 TC-008、POL-TDD-001、coverage graph 与两个 task brief。

## 实现 Evidence Eligibility 与 Completion（TASK-008 / REQ-009）

### 任务目标

区分 evidence 内容有效性与 formal eligibility，聚合多维完成状态，并让完整 workflow 进入 complete。

### 执行前提

- TASK-003、TASK-004、TASK-007 GREEN；TD-009 生效。
- 已确认测试：TC-009、TC-103/TC-POL-TDD-001、TC-104/TC-POL-VERIFY-001。
- Required Policy / Skill：POL-TDD-001、POL-VERIFY-001；`test-driven-development`、`verification-before-completion`。

### 修改范围

- 创建：`src/lib/workflow/completion-state.ts`。
- 修改：`src/lib/documents/artifact-mode.ts`、`src/lib/documents/validate-tdd-evidence.ts`、`src/lib/workflow/workflow-state.ts`。
- 创建：`tests/ts/workflow-runtime-completion.test.mjs`；修改 evidence/workflow state tests。

### 执行步骤

- [ ] 写 tracked/local/ignored、task/test/policy/scope/hash/DP blocker、complete 终态和 stale validation RED tests。
- [ ] 运行 completion/evidence/workflow-state targets 确认 RED。
- [ ] 实现 `validFor`、`formalCompletionAllowed`、CompletionSummary 和 complete transition。
- [ ] GREEN 后运行 TDD validator fixtures，确认 after-the-fact evidence 仍失败。
- [ ] VED 记录 local review 与 formal completion 两种 payload、fresh source hash 验证。

### 验证方式

- 命令：`node --test tests/ts/workflow-runtime-completion.test.mjs tests/ts/workflow-state.test.mjs`，并运行 `node bin/coding-plugins.js validate-tdd-evidence --root . --format json --strict <VED>` 于有真实证据后。
- 预期：ignored/local 不可正式完成，blockers 可解释，完整链进入 complete。

### VED 记录要求

- 章节：`## TASK-008：实现 Evidence Eligibility 与 Completion`。
- 记录 TC-009/103/104、POL-TDD-001/POL-VERIFY-001 和 fresh validation hash。

## 收敛 CLI/Hook 并完成兼容验证（TASK-009 / REQ-010、MIG-001、OBS-001）

### 任务目标

让 `task` 成为公开 facade、SessionStart 使用结构化 CLI reference，并完成 v1/v2、Policy、文档和全仓验证。

### 执行前提

- TASK-001 至 TASK-008 全部 GREEN。
- 已确认测试：TC-010、TC-011、TC-012、TC-101 至 TC-105。
- Required Policy / Skill：POL-ARCH-001、POL-COMPAT-001、POL-TDD-001、POL-VERIFY-001、POL-DOC-001；`test-driven-development`、`verification-before-completion`、`document-metadata`。

### 修改范围

- 修改：`src/cli/workflow/task.ts`、`src/cli/command-registry.ts`、`src/lib/runtime/command-registry.ts`、`hooks/session-start-codex`。
- 修改：旧 start/state/workflow-* 入口仅做 compatibility forward/diagnostic。
- 修改：migration guide、相关 Skills/模板的推荐命令和正式 feature 文档。
- 修改：`tests/ts/workflow-runtime-cli.test.mjs`、`tests/ts/workflow-runtime-diagnostics.test.mjs`、`tests/ts/productization-cli.test.mjs`、hook/manifest/skill contract tests。

### 执行步骤

- [ ] 写一次 status 聚合、structured next command、无业务 bin fallback、old command forwarding、text/json parity RED tests。
- [ ] 运行 CLI/productization/manifest/skill contract targets 确认 RED。
- [ ] 接入 task facade 与 hook，更新迁移文档；默认 contract 保持 v1，v2 显式 opt-in。
- [ ] GREEN 后运行 TC-101..105 policy gates、全部 targeted workflow tests、`npm test`。
- [ ] 刷新 INDEX，运行 strict PRD/TSD/document validators、`npm run preflight -- --write-index` 和 `npm run preflight`。
- [ ] 审查 `git diff --check`、scope、source hash 和 VED completeness；失败则不宣称完成。

### 验证方式

- Targeted：`node --test tests/ts/workflow-runtime-*.test.mjs tests/ts/productization-cli.test.mjs tests/ts/workflow-state.test.mjs tests/ts/src-architecture.test.mjs`。
- Full：`npm test`、`npm run preflight -- --write-index`、`npm run preflight`、`git diff --check`。
- 预期：v2 功能全绿、v1 无回归、SessionStart 无错误 fallback、正式文档/Policy evidence 完整。

### VED 记录要求

- 章节：`## TASK-009：收敛 CLI/Hook 并完成兼容验证` 和 `## 最终验证`。
- 分别记录 Requirement Evidence、Policy Evidence、完整命令/exit code/source hash、残余风险和未执行的 publish/commit。

## 中止条件

- 上游变化：PRD、TSD 或 TVD 内容变化导致 `source_hash` 与 frontmatter 不匹配。
- 范围漂移：需要任意 workflow DSL、长期 specs/archive、默认 v2 切换、v1 删除、真实发布或跨仓库改动。
- 兼容失败：任何 v1 DP/JSON/fixture 无法保持且 PRD 未批准 breaking migration。
- Policy 阻断：required source 不可复现、Policy 冲突、coverage 缺口或 waiver 未批准。
- 验证失败：RED 不是目标行为失败、GREEN/REFACTOR/compatibility/preflight 失败，且不能在当前设计内修复。
- 环境阻塞：Node/依赖/权限不可用且没有安全的替代验证；不得用旧输出代替。

## 完成检查

- [ ] REQ-001 至 REQ-010、MIG-001、OBS-001 全部映射到 TASK 与 TC。
- [ ] POL-ARCH-001、POL-COMPAT-001、POL-TDD-001、POL-VERIFY-001、POL-DOC-001 均有 Task/Test/VED Evidence。
- [ ] TASK-001 至 TASK-009 都有真实 RED/GREEN/REFACTOR 或事前批准例外。
- [ ] v1 compatibility、v2 opt-in、local/ignored eligibility、complete 终态全部通过。
- [ ] `source_hash` 当前，DP/guard/scope audit 通过。
- [ ] VED、INDEX、metadata、strict validators、`npm test`、preflight、diff check 全部通过。
- [ ] 未执行 commit、publish、默认 v2 切换或非目标工作。
