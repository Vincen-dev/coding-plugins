---
title: <功能名称> Implementation Procedure Document
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
source_hash: sha256:<由 src/cli/workflow-state.ts hash --feature <feature-name> --doc-id <doc-id> 生成>
---

# <功能名称>任务执行文档（IPD）

## 阅读摘要

- **本文结论:** <说明本 IPD 要执行哪些任务、最终成功标准和交付边界。>
- **当前状态:** 草稿，等待执行确认。
- **先读重点:** 先看目标、执行入口、任务总览，再按 `## 任务标题（TASK-001 / REQ-001）` 逐项执行。
- **执行入口:** 使用 `subagent-driven-development` 或 `executing-plans` 按任务执行；每个行为变更任务必须记录 TED 证据。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | IPD |
| 缩写含义 | Implementation Procedure Document |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只保留执行任务需要的上下文、步骤和验证口径。

## 目标

<一句话说明本次执行要构建、修改或修复什么。>

## 执行入口

- 推荐方式：`subagent-driven-development`，按任务派发并在任务间评审。
- 降级方式：`executing-plans`，在当前会话按检查点执行。
- 执行约束：不得跳过 RED/GREEN/REFACTOR；无法自动测试时必须在 TED 写 TDD 例外记录。
- 新鲜度检查：执行前运行 `coding-plugins workflow-state inspect --feature <feature-name> --doc-id <doc-id> --json`；如果状态是 `plan-draft`、`plan-unlocked` 或 `plan-stale`，先回到 `writing-plans` 批准 IPD、补齐 `source_hash`，或刷新 IPD。

## 执行锁定区

- **Intent Lock:** <一句话锁定本 IPD 执行意图，执行阶段不得扩展到其他目标。>
- **Scope Fence:** <列出本次明确包含和明确不包含的边界。>
- **Required Spec IDs:** REQ-001
- **Required Tests:** <列出必须先 RED 再 GREEN 的测试或人工验收证据。>
- **Review Gates:** <列出任务间必须进行的规格符合性或代码质量评审。>
- **Rewind Triggers:** 上游 PRD/TDD/TID/TCD 变更、source_hash 不匹配、新增外部行为、接口或 schema 改动、验证失败且影响需求契约。

## 执行简报

- **执行来源:** 只按本 IPD 的任务章节执行；最终执行靠已规划好的任务推进。
- **上下文预算:** 执行阶段优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TDD/TID/TCD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 IPD，不向旧 IPD 追加任务。

## 上游约束摘要

- 需求约束：<用 1 到 3 条列出 PRD 中会影响执行的 MUST 需求。>
- 技术约束：<用 1 到 3 条列出 TDD/TID 中会影响任务顺序或实现边界的约束。>
- 测试约束：<用 1 到 3 条列出 TCD 中必须执行或补齐的测试。>

不要在本节复述完整技术方案；完整方案以 TDD/TID 为准，测试设计以 TCD 为准。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | <任务标题> | REQ-001 | <测试命令或人工验收> | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |

## <任务标题>（TASK-001 / REQ-001）

### 任务目标

<说明本任务完成后系统应出现什么可观察变化。>

### 执行前提

- 已确认需求：<PRD 中的相关需求点。>
- 已确认设计：<TDD/TID 中的相关决策或实现点。>
- 已确认测试：<TCD 中的相关测试用例。>

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 创建 | `<exact/path/to/new_file>` | <创建原因和职责> |
| 修改 | `<exact/path/to/existing_file>` | <修改内容和边界> |
| 测试 | `<tests/exact/path/to/test_file>` | <覆盖行为或契约> |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`<tests/exact/path/to/test_file>`
  - 预期失败：<说明失败应来自缺失行为、契约或状态，而不是导入、拼写或环境问题。>
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`<测试命令>`
  - 预期：FAIL，失败信息包含 <关键错误摘要>。
- [ ] **步骤 3：写最小实现**
  - 修改：`<exact/path/to/existing_file>`
  - 边界：只实现 TASK-001 覆盖的行为，不顺手扩展其他需求。
- [ ] **步骤 4：运行测试确认 GREEN**
  - 命令：`<测试命令>`
  - 预期：PASS。
- [ ] **步骤 5：重构并重跑相关测试**
  - 命令：`<相关测试或 preflight 命令>`
  - 预期：PASS。
- [ ] **步骤 6：记录 TED 证据**
  - 写入：`docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md`
  - 字段：规格/缺陷/验收、测试类型、RED 测试、RED 命令、RED 失败、GREEN 变更、GREEN 命令、REFACTOR 命令、最终验证。

### 验证方式

| 覆盖规格 | 测试类型 | 命令或人工验收 | 预期结果 |
| --- | --- | --- | --- |
| REQ-001 | behavior | `<测试命令>` | PASS |

### TED 记录要求

- 证据文件：`docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md`
- 证据章节：`## 任务 1：<任务标题>`
- 无法自动测试时：必须写 `### TDD 例外记录`，包含原因、用户批准、替代验证和风险。

## 完成检查

- [ ] 每个 MUST Spec ID 都映射到任务或明确豁免。
- [ ] 每个任务都有 RED/GREEN/REFACTOR 命令或 TDD 例外记录。
- [ ] 每个任务都指向 TED 证据文件和字段。
- [ ] 已运行相关 validator、测试或 preflight。
