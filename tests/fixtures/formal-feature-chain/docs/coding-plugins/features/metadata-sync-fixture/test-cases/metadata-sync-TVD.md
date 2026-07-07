---
title: Metadata Sync TVD
status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-VED.md
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-TED.md
  - docs/coding-plugins/features/metadata-sync-fixture/requirements/metadata-sync-PRD.md
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TSD.md
---
# Metadata Sync TVD

## 阅读摘要

- **本文结论:** 本测试用例 fixture 覆盖同一 `doc_id` 的核心 contract 校验。
- **当前状态:** approved。
- **先读重点:** 先看测试策略摘要和测试用例总览，再看 TC-001 的断言。
- **证据目标:** 执行结果写入同一 `doc_id` 的 VED。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节 |

## 测试策略摘要

使用 contract 测试验证 metadata 同步 freshness 规则。

## 风险到测试映射

| 风险 | 覆盖测试 | 处理方式 |
| --- | --- | --- |
| 文档链路缺失或过期 | TC-001 / REQ-001 | 自动化校验同一 `doc_id` 的完整链路 |

## 测试环境与数据

- 环境：本仓库 Node.js 测试环境。
- 数据：formal-feature-chain fixture 下的 metadata-sync-fixture/metadata-sync 文档链。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 下游过期链路被拒绝 | REQ-001 | contract | 自动化 | VED |

## 下游过期链路被拒绝（TC-001 / REQ-001）

### 测试目标

验证上游 `updated` 晚于下游时，preflight 会拒绝文档链路。

### 前置条件

- 构造同一 `doc_id` 的 PRD 和 TSD。
- PRD `updated` 晚于 TSD。

### 测试步骤

1. 运行同步 freshness 检查。
2. 观察错误输出。

### 断言

- preflight 报告下游文档过期。
- 下游更新时间不早于上游时通过。

### 测试数据

| 数据项 | 取值 | 用途 |
| --- | --- | --- |
| updated | 2026-07-02 | 同步 freshness 比较 |

### 证据目标

- VED 记录：同一 `doc_id` 的 VED

## 通过 / 失败标准

- 通过：TC-001 执行后，链路闭包、metadata 和 schema 校验均通过。
- 失败：缺少任一上游文档、REQ-001 覆盖缺失或 TED source_hash 过期。

## 自动化状态

| 测试用例 | 自动化状态 | 命令 |
| --- | --- | --- |
| TC-001 | 已自动化 | `npm run preflight` |
