---
title: Metadata Sync Task Execution Document
status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
source_hash: sha256:9cd99584ca38bd855408fbbf5d46bc837a48d5e5b7ae5b00e05eb8dada904ec6
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-VED.md
  - docs/coding-plugins/features/metadata-sync-fixture/requirements/metadata-sync-PRD.md
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TSD.md
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TVD.md
---
# Metadata Sync 任务执行文档（TED）

## 阅读摘要

- **本文结论:** 本 TED fixture 只执行同一 `doc_id` 的链路校验任务。
- **当前状态:** approved。
- **先读重点:** 先看执行锁定区、执行简报和任务总览。
- **证据目标:** TASK-001 的执行证据写入同一 `doc_id` 的 VED。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |

## 目标

执行 metadata 同步 freshness 场景校验。

## 执行锁定区

- **Intent Lock:** 只执行 metadata 同步 freshness fixture 校验。
- **Scope Fence:** 包含 fixture 文档链路和 freshness 规则校验；不包含真实文档迁移或发布流程。
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
| TASK-001 | 校验 metadata 同步 freshness | REQ-001 | contract fixture 校验 | 同一 `doc_id` 的 VED |

## 任务依赖与并行性

- TASK-001：无前置任务；必须串行确认 source_hash 和 schema 后完成。
- 并行性：本 fixture 只有单任务，不拆分并行执行。

## 校验 metadata 同步 freshness（TASK-001 / REQ-001）

### 任务目标

确认文档链路可以表达 PRD 更新后下游文档同步评审的规则。

### 执行前提

- 已确认需求：REQ-001。
- 已确认设计：TD-001。
- 已确认测试：TC-001。

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 测试 | `tests/ts/preflight-cli.test.mjs` | 多场景 fixture 覆盖。 |
| 文档 | `tests/fixtures/formal-feature-chain` | metadata-sync 案例链路。 |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`tests/ts/preflight-cli.test.mjs`
  - 预期失败：缺少 metadata sync 场景时失败。
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

## 中止条件

- 上游 PRD、TSD 或 TVD 变更导致 `source_hash` 不匹配。
- fixture schema、metadata 或 preflight 校验失败。
