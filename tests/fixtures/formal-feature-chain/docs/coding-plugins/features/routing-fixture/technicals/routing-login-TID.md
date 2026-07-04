---
title: Routing Login TID
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
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TDD.md
related_test_cases:
  - docs/coding-plugins/features/routing-fixture/test-cases/routing-login-TCD.md
related_plans:
  - docs/coding-plugins/features/routing-fixture/plans/routing-login-IPD.md
related_evidence:
  - docs/coding-plugins/features/routing-fixture/evidences/routing-login-TED.md
---
# Routing Login TID

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | routing-fixture |
| Doc ID | routing-login |
| 文档类型 | TID |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 实现摘要、实现点总览、实现点章节 |

## 实现摘要

本案例模拟登录路由能力的模块级落地，重点验证正式文档链路可以把 REQ-001 追踪到实现点、测试用例、IPD 任务和 TED 证据。

## 实现点总览

| 实现点 | 标题 | 覆盖规格 | 关联设计 | 主要落点 |
| --- | --- | --- | --- | --- |
| IMPL-001 | 登录路由闭包校验 | REQ-001 | TD-001 | `src/cli/preflight.ts::check_feature_document_chain_closure` |

## 登录路由闭包校验（IMPL-001 / REQ-001）

### 实现目标

确认同一 `doc_id` 下 PRD、TDD、TID、TCD、IPD 和 TED 都存在且 metadata 关系完整。

### 代码落点

| 类型 | 路径或符号 | 实现内容 | 关联设计 |
| --- | --- | --- | --- |
| 模块 | `src/cli/preflight.ts` | 正式链路闭包校验 | TD-001 |
| 测试 | `tests/ts/test_preflight_cli.mjs` | golden fixture 回归测试 | TD-001 |

### 数据和状态

不涉及持久化数据；只读取 fixture 中的 frontmatter metadata 和文件路径。

### 实现约束

- 需求来源：REQ-001
- 设计来源：TD-001
- 测试交接：TC-001
- 执行交接：TASK-001

## 测试交接

TCD 必须覆盖正式链路闭包校验，IPD 执行时必须记录 TED 证据。
