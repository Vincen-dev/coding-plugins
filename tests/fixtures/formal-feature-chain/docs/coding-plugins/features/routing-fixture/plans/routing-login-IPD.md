---
title: Routing Login Implementation Procedure Document
status: approved
feature: routing-fixture
doc_id: routing-login
source_hash: sha256:1425e2be7defede5273f0d280c997051a9a3ac74902e30aecee388f134c550db
created: 2026-07-02
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/routing-fixture/requirements/routing-login-PRD.md
related_technical:
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TDD.md
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TID.md
related_test_cases:
  - docs/coding-plugins/features/routing-fixture/test-cases/routing-login-TCD.md
related_plans: []
related_evidence:
  - docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md
---
# Routing Login 任务执行文档（IPD）

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | routing-fixture |
| Doc ID | routing-login |
| 文档类型 | IPD |
| 缩写含义 | Implementation Procedure Document |

## 目标

校验 routing-login 同一 `doc_id` 下的正式文档链路闭包。

## 执行入口

- 推荐方式：`subagent-driven-development`。
- 降级方式：`executing-plans`。
- 执行约束：运行 fixture 校验后，将结果写入 TED。

## 执行锁定区

- **Intent Lock:** 只执行 routing-login 正式链路闭包 fixture 校验。
- **Scope Fence:** 包含 fixture 文档链路和闭包校验；不包含真实登录路由实现。
- **Required Spec IDs:** REQ-001
- **Required Tests:** `npm run preflight`
- **Review Gates:** 检查 source_hash、执行简报和 TASK-001 到 TED 的追踪。
- **Rewind Triggers:** 上游 PRD/TDD/TID/TCD 变更、source_hash 不匹配或 fixture 校验失败。

## 执行简报

- **执行来源:** 只按本 IPD 的任务章节执行。
- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TDD/TID/TCD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 IPD，不向旧 IPD 追加任务。

## 上游约束摘要

- 需求约束：REQ-001 要求登录路由根据会话状态选择页面。
- 技术约束：TD-001 将会话状态读取集中在路由入口。
- 测试约束：TCD 要求运行正式链路闭包校验。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | TED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 校验正式链路闭包 | REQ-001 | `npm run preflight` | `docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md` |

## 校验正式链路闭包（TASK-001 / REQ-001）

### 任务目标

确认 PRD、TDD、TID、TCD、IPD 和 TED 组成的正式链路可以被 preflight fixture 校验。

### 执行前提

- 已确认需求：routing-login PRD 中的 REQ-001。
- 已确认设计：routing-login TDD 中的 TD-001。
- 已确认测试：routing-login TCD 中的 TC-001。

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 修改 | `src/cli/preflight.ts` | 正式链路闭包校验逻辑。 |
| 测试 | `tests/ts/test_preflight_cli.mjs` | golden fixture 回归测试。 |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`tests/ts/test_preflight_cli.mjs`
  - 预期失败：链路缺失或 metadata 不一致时失败。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`npm run preflight`
  - 预期：fixture 不完整时 FAIL。
- [ ] **步骤 3：写最小实现**
  - 修改：`src/cli/preflight.ts`
  - 边界：只覆盖正式链路闭包校验。
- [ ] **步骤 4：运行测试确认 GREEN**
  - 命令：`npm run preflight`
  - 预期：PASS。
- [ ] **步骤 5：重构并重跑相关测试**
  - 命令：`npm run preflight`
  - 预期：PASS。
- [ ] **步骤 6：记录 TED 证据**
  - 写入：`docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md`
  - 字段：规格/缺陷/验收、测试类型、RED 测试、RED 命令、RED 失败、GREEN 变更、GREEN 命令、REFACTOR 命令、最终验证。

### 验证方式

| 覆盖规格 | 测试类型 | 命令或人工验收 | 预期结果 |
| --- | --- | --- | --- |
| REQ-001 | contract | `npm run preflight` | PASS |

### TED 记录要求

- 证据文件：`docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md`
- 证据章节：`## TDD 证据`
- 无法自动测试时：必须写 `### TDD 例外记录`。

## 完成检查

- [x] 每个 MUST Spec ID 都映射到任务。
- [x] 每个任务都有 RED/GREEN/REFACTOR 命令。
- [x] 每个任务都指向 TED 证据文件和字段。
- [x] 已运行相关 validator 或 preflight。
