---
title: Routing Login TED
status: approved
feature: routing-fixture
doc_id: routing-login
created: 2026-07-02
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/routing-fixture/requirements/routing-login-PRD.md
related_technical:
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TDD.md
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TID.md
related_test_cases:
  - docs/coding-plugins/features/routing-fixture/test-cases/routing-login-TCD.md
related_plans:
  - docs/coding-plugins/features/routing-fixture/plans/routing-login-IPD.md
related_evidence: []
---
# Routing Login TED

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | routing-fixture |
| Doc ID | routing-login |

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **测试类型:** `contract`
- **RED 测试:** `scripts.test_preflight.PreflightTests.test_feature_document_chain_requires_test_cases`
- **RED 命令:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_feature_document_chain_requires_test_cases`
- **RED 失败:** 缺少 TCD 时未抛出 PreflightError。
- **GREEN 变更:** 正式链路闭包校验纳入 TCD。
- **GREEN 命令:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_feature_document_chain_requires_test_cases`
- **REFACTOR 命令:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_golden_feature_fixture_satisfies_formal_document_chain`
- **最终验证:** PASS：golden fixture 文档链路通过集中校验。
