---
title: Metadata Sync TED
status: approved
feature: metadata-sync-fixture
doc_id: metadata-sync
created: 2026-07-02
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/metadata-sync-fixture/requirements/metadata-sync-PRD.md
related_technical:
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TDD.md
  - docs/coding-plugins/features/metadata-sync-fixture/technicals/metadata-sync-TID.md
related_test_cases:
  - docs/coding-plugins/features/metadata-sync-fixture/test-cases/metadata-sync-TCD.md
related_plans:
  - docs/coding-plugins/features/metadata-sync-fixture/plans/metadata-sync-IPD.md
related_evidence: []
---
# Metadata Sync TED

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | metadata-sync-fixture |
| Doc ID | metadata-sync |
| 文档类型 | TED |

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **测试类型:** `contract`
- **RED 测试:** `scripts.test_preflight.PreflightTests.test_golden_feature_fixture_covers_multiple_realistic_scenarios`
- **RED 命令:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_golden_feature_fixture_covers_multiple_realistic_scenarios`
- **RED 失败:** 缺少 metadata sync 场景时 fixture 覆盖测试失败。
- **GREEN 变更:** 增加 metadata-sync-fixture 完整文档链路。
- **GREEN 命令:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_golden_feature_fixture_covers_multiple_realistic_scenarios`
- **REFACTOR 命令:** `python3 scripts/preflight.py`
- **最终验证:** PASS：多场景 fixture 和完整 preflight 均通过。
