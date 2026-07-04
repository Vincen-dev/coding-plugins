---
title: Creek Upload Status Task Execution Document
status: approved
feature: creek-wrapper-fixture
doc_id: creek-upload-status
source_hash: sha256:f44741db7eb60e91de25ad573533c2732b356d925938595d561a836f444d22a9
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/creek-wrapper-fixture/evidences/creek-upload-status-VED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/requirements/creek-upload-status-PRD.md
  - docs/coding-plugins/features/creek-wrapper-fixture/technicals/creek-upload-status-TSD.md
  - docs/coding-plugins/features/creek-wrapper-fixture/test-cases/creek-upload-status-TVD.md
---
# Creek Upload Status 任务执行文档（TED）

## 阅读摘要

- **本文结论:** 本 TED fixture 只执行同一 `doc_id` 的链路校验任务。
- **当前状态:** approved。
- **先读重点:** 先看执行锁定区、执行简报和任务总览。
- **证据目标:** TASK-001 的执行证据写入同一 `doc_id` 的 VED。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | creek-wrapper-fixture |
| Doc ID | creek-upload-status |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |

## 目标

执行 wrapper 上传状态查询契约的测试和证据记录。

## 执行锁定区

- **Intent Lock:** 只执行 Creek wrapper 上传状态契约 fixture 校验。
- **Scope Fence:** 包含 fixture 文档链路和契约校验；不包含真实 SDK、蓝牙或发布流程。
- **Required Spec IDs:** REQ-001
- **Required Tests:** `npm run preflight`
- **Review Gates:** 检查 source_hash、执行简报和 TASK-001 到 VED 的追踪。
- **Rewind Triggers:** 上游 PRD/TSD/TVD 变更、source_hash 不匹配或 fixture 校验失败。

## 执行简报

- **执行来源:** 只按本 TED 的任务章节执行。
- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TSD/TVD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 TED，不向旧 TED 追加任务。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | VED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 校验上传状态契约 | REQ-001 | contract fixture 校验 | 同一 `doc_id` 的 VED |

## 校验上传状态契约（TASK-001 / REQ-001）

### 任务目标

确认 Creek wrapper API 契约场景具备完整文档链路和可追踪证据。

### 执行前提

- 已确认需求：REQ-001。
- 已确认设计：TD-001。
- 已确认测试：TC-001。

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 测试 | `tests/ts/preflight-cli.test.mjs` | golden fixture 场景覆盖。 |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`tests/ts/preflight-cli.test.mjs`
  - 预期失败：缺少 Creek wrapper 场景时失败。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`npm run preflight`
  - 预期：FAIL。
- [ ] **步骤 3：写最小实现**
  - 修改：`tests/fixtures/formal-feature-chain`
  - 边界：只补 fixture 文档。
- [ ] **步骤 4：运行测试确认 GREEN**
  - 命令：`npm run preflight`
  - 预期：PASS。
- [ ] **步骤 5：重构并重跑相关测试**
  - 命令：`npm run preflight`
  - 预期：PASS。
- [ ] **步骤 6：记录 VED 证据**
  - 写入：同一 `doc_id` 的 VED

### 验证方式

| 覆盖规格 | 测试类型 | 命令或人工验收 | 预期结果 |
| --- | --- | --- | --- |
| REQ-001 | contract | `npm run preflight` | PASS |
