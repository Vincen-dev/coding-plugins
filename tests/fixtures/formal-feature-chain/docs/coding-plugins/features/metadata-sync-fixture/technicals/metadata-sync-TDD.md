---
title: Metadata Sync TDD
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
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TID.md
related_test_cases:
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TCD.md
related_plans:
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-IPD.md
related_evidence:
  - docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-TED.md
---
# Metadata Sync TDD

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | TDD |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |

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
| REQ-001 | 下游文档同步评审 | `src/cli/preflight.ts::check_document_sync_freshness` | TD-001 | `src/lib/document-metadata.ts` | `npm run preflight` | `docs/coding-plugins/features/metadata-sync-fixture/evidences/metadata-sync-TED.md` |

## 无需技术设计的规格

| 规格 ID | 原因 |
| --- | --- |
| 无 | 所有 MUST 规格均有技术落点。 |

## 测试策略

| 规格 ID | 测试层级 | 命令 |
| --- | --- | --- |
| REQ-001 | contract | `npm run preflight` |
