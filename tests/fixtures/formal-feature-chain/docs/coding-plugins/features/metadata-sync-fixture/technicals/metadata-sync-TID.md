---
title: Metadata Sync TID
status: approved
lifecycle_status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
created: 2026-07-02
updated: 2026-07-02
implemented_commits: []
validated_by:
  - npm run preflight
related_specs:
  - docs/coding-plugins/features/metadata-sync-fixture/requirements/metadata-sync-PRD.md
related_technical:
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TDD.md
related_test_cases:
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TCD.md
related_plans:
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-IPD.md
related_evidence:
  - docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-TED.md
---
# Metadata Sync TID

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | TID |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 实现摘要、实现点总览、实现点章节 |

## 实现摘要

本案例模拟 metadata 同步 freshness 门禁，不涉及真实业务代码。

## 实现点总览

| 实现点 | 标题 | 覆盖规格 | 关联设计 | 主要落点 |
| --- | --- | --- | --- | --- |
| IMPL-001 | 同步 freshness 检查 | REQ-001 | TD-001 | `check_document_sync_freshness` |

## 同步 freshness 检查（IMPL-001 / REQ-001）

### 实现目标

比较同一 `doc_id` 的上游和下游 `updated`，拒绝过期链路。

### 代码落点

| 类型 | 路径或符号 | 实现内容 | 关联设计 |
| --- | --- | --- | --- |
| 模块 | `src/cli/preflight.ts` | 文档同步 freshness 门禁 | TD-001 |
| 模块 | `src/lib/document-metadata.ts` | 同步依赖图 | TD-001 |

### 数据和状态

只读取 frontmatter `updated`；不维护额外同步状态字段。

### 实现约束

- 需求来源：REQ-001
- 设计来源：TD-001
- 测试交接：TC-001
- 执行交接：TASK-001

## 测试交接

TCD 需要覆盖上游日期晚于下游时 preflight 拒绝的场景。
