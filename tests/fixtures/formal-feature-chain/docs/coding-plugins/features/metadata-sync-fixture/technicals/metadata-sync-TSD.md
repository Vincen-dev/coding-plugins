---
title: Metadata Sync TSD
status: approved
lifecycle_status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-VED.md
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-TED.md
  - docs/coding-plugins/features/metadata-sync-fixture/requirements/metadata-sync-PRD.md
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TVD.md
implemented_commits: []
validated_by:
  - npm run preflight
---
# Metadata Sync TSD

## 阅读摘要

- **本文结论:** 本技术方案 fixture 用于验证同一 `doc_id` 的需求、技术、测试、执行和证据链路可以被工具读取。
- **当前状态:** approved。
- **先读重点:** 先看规格缺口审查、关键决策和规格到设计映射。
- **下游同步:** TVD、TED 和 VED 均以同一 `doc_id` 追踪。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | TSD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |

## 规格缺口审查

| 未覆盖需求 | 验收标准 | 外部行为 | 处理状态 |
| --- | --- | --- | --- |
| 无 | REQ-001 已覆盖同步顺序 | preflight 同步门禁可观察 | 已覆盖 |

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 用 `updated` 表示同步评审完成 | 不需要额外状态字段即可门禁过期文档 | 无影响评审也要更新时间 |

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 下游文档同步评审 | `src/cli/preflight.ts::check_document_sync_freshness` | TD-001 | `src/lib/document-metadata.ts` | `npm run preflight` | 同一 `doc_id` 的 VED |

## 无需技术设计的规格

| 规格 ID | 原因 |
| --- | --- |
| 无 | 所有 MUST 规格均有技术落点。 |

## 测试策略

| 规格 ID | 测试层级 | 命令 |
| --- | --- | --- |
| REQ-001 | contract | `npm run preflight` |
