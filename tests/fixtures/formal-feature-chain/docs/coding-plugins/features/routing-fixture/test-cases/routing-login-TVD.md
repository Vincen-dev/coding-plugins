---
title: Routing Login TVD
status: approved
feature: routing-fixture
doc_id: routing-login
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/routing-fixture/evidences/routing-login-VED.md
  - docs/coding-plugins/features/routing-fixture/plans/routing-login-TED.md
  - docs/coding-plugins/features/routing-fixture/requirements/routing-login-PRD.md
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TSD.md
---
# Routing Login TVD

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | routing-fixture |
| Doc ID | routing-login |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节 |

## 测试策略摘要

使用 contract 测试验证正式文档链路闭包，确保 routing-login 的 PRD、TSD、TVD、TED 和 VED 同步存在。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- |
| TC-001 | 正式链路闭包校验 | REQ-001 | contract | 自动化 | VED |

## 正式链路闭包校验（TC-001 / REQ-001）

### 测试目标

验证 routing-login 的正式文档链路满足 approved PRD 的闭包要求。

### 前置条件

- 同一 `doc_id` 下存在 PRD、TSD、TVD、TED 和 VED。

### 测试步骤

1. 运行 golden fixture 校验。
2. 检查 preflight 是否读取同一 `doc_id` 的全部文档。

### 断言

- fixture 完整时校验通过。
- 缺少 TVD、TSD 或 TED 时对应负例测试失败。

### 测试数据

| 数据项 | 取值 | 用途 |
| --- | --- | --- |
| doc_id | routing-login | 匹配同一文档链路 |

### 证据目标

- VED 记录：`docs/coding-plugins/features/routing-fixture/evidences/routing-login-VED.md`
