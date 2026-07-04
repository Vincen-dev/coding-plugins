---
title: Metadata Sync VED
status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-TED.md
  - docs/coding-plugins/features/metadata-sync-fixture/requirements/metadata-sync-PRD.md
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TSD.md
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TVD.md
---
# Metadata Sync VED

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | VED |

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **测试类型:** `contract`
- **RED 测试:** `scripts.test_preflight.PreflightTests.test_golden_feature_fixture_covers_multiple_realistic_scenarios`
- **RED 命令:** `npm run preflight`
- **RED 失败:** 缺少 metadata sync 场景时 fixture 覆盖测试失败。
- **GREEN 变更:** 增加 metadata-sync-fixture 完整文档链路。
- **GREEN 命令:** `npm run preflight`
- **REFACTOR 命令:** `npm run preflight`
- **最终验证:** PASS：多场景 fixture 和完整 preflight 均通过。
