---
title: Routing Login TDD
status: approved
lifecycle_status: approved
feature: routing-fixture
doc_id: routing-login
created: 2026-07-02
updated: 2026-07-02
implemented_commits: []
validated_by:
  - npm run preflight
related_specs:
  - docs/coding-plugins/features/routing-fixture/requirements/routing-login-PRD.md
related_technical:
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TID.md
related_test_cases:
  - docs/coding-plugins/features/routing-fixture/test-cases/routing-login-TCD.md
related_plans:
  - docs/coding-plugins/features/routing-fixture/plans/routing-login-IPD.md
related_evidence:
  - docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md
---
# Routing Login TDD

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | routing-fixture |
| Doc ID | routing-login |

## 规格缺口审查

| 未覆盖需求 | 验收标准 | 外部行为 | 处理状态 |
| --- | --- | --- | --- |
| 无 | REQ-001 已映射到设计和测试 | 登录路由结果可观察 | 已覆盖 |

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 会话状态读取集中在路由入口 | 路由入口是页面选择的单一判断点 | 需要在测试中构造会话状态 |

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 登录路由根据会话状态选择页面 | `src/cli/preflight.ts` 链路校验 | TD-001 | `check_feature_document_chain_closure` | `npm run preflight` | `docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md` |

## 无需技术设计的规格

| 规格 ID | 原因 |
| --- | --- |
| REQ-001 | 已由 TD-001 覆盖 |

## 测试策略

| 规格 ID | 测试层级 | 命令 |
| --- | --- | --- |
| REQ-001 | contract | `npm run preflight` |
