---
title: Metadata Sync PRD
type: maintenance
status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
created: 2026-07-02
updated: 2026-07-02
tags:
  - metadata
  - sync
related_code:
  - scripts/document_metadata.py
related_specs: []
related_technical:
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TDD.md
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TID.md
related_test_cases:
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TCD.md
related_plans:
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-IPD.md
related_evidence:
  - docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-TED.md
---
# Metadata Sync PRD

## 阅读摘要

- **本文结论:** 上游文档更新后，下游文档必须同步更新或完成无影响评审。
- **当前状态:** approved。
- **先读重点:** 先看需求总览和同步评审需求点。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_*` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

验证 metadata-first 文档契约中 `updated` 同步规则的实战场景。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不实现跨仓库外部路径检查。 |

## 背景

- 当前行为：上游 PRD 改动可能导致下游文档过期。
- 目标用户或调用方：文档链路维护者和 preflight。
- 约束：同步关系从 PRD 单向传递到 TED。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | 下游文档同步评审 | 必须 | maintenance | contract 测试 |

## 下游文档同步评审（REQ-001）

### 用户或系统价值

读者能判断下游文档是否已评审过上游变更，避免根据过期 TDD、TCD 或 IPD 执行。

### 需求描述

当 PRD、TDD、TID、TCD 或 IPD 更新后，下游文档必须更新正文或至少更新 `updated` 表示已完成同步评审。

### 行为规则

- PRD 更新要求 TDD、TID、TCD、IPD 和 TED 同步评审。
- TDD 更新要求 TID、TCD、IPD 和 TED 同步评审。
- TCD 更新要求 IPD 和 TED 同步评审。

### 输入与输出

| 项目 | 内容 |
| --- | --- |
| 输入 | 上游文档 `updated` 日期。 |
| 输出 | 下游文档同步状态。 |

### 关联契约

- API / SDK / CLI：`python3 scripts/preflight.py`。
- Schema / 数据：frontmatter `updated`。
- 状态机 / 生命周期：PRD -> TDD -> TID -> TCD -> IPD -> TED。
- 维护 / 迁移 / 回归：同步检查必须覆盖同一 `doc_id`。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 下游 `updated` 早于上游。 | preflight 拒绝。 | contract 测试 |

### 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 同步评审完成 | 全链路日期一致 | 运行 preflight | 通过 |

### 验证方式

- 验证类型：contract。
- 覆盖对象：同一 `doc_id` 的同步关系。
- 后续沉淀：同步校验证据写入 TED。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | contract | `docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-TED.md` | 已覆盖 |
