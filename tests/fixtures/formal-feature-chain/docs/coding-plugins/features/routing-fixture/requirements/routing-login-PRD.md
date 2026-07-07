---
title: Routing Login PRD
status: approved
feature: routing-fixture
doc_id: routing-login
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/routing-fixture/evidences/routing-login-VED.md
  - docs/coding-plugins/features/routing-fixture/plans/routing-login-TED.md
  - docs/coding-plugins/features/routing-fixture/technicals/routing-login-TSD.md
  - docs/coding-plugins/features/routing-fixture/test-cases/routing-login-TVD.md
---
# Routing Login PRD

## 阅读摘要

- **本文结论:** 登录路由必须按会话状态进入首页或登录页。
- **当前状态:** approved。
- **先读重点:** 先看需求总览，再看登录路由需求点章节。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | routing-fixture |
| Doc ID | routing-login |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

登录路由根据会话状态选择首页或登录页，并让完整文档链路可以被 preflight 校验。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不实现真实登录 UI 或会话存储。 |

## 背景

- 当前行为：fixture 用于验证正式文档链路闭包。
- 目标用户或调用方：preflight 和文档链路维护者。
- 约束：必须保持同一 `doc_id` 的 PRD、TSD、TVD、TED 和 VED 可追踪。

## 成功指标

- PRD、TSD、TVD、TED 和 VED 的链路闭包可通过自动化校验。
- REQ-001 在设计、测试、执行和证据中都有可追踪覆盖。

## 假设与依赖

- 文档链路以同一 `feature` 和 `doc_id` 聚合。
- 自动化入口以 `npm run preflight` 作为最终校验。

## 开放问题

- 无：fixture 只沉淀 登录路由按会话状态分流 的链路校验，不扩展真实业务实现。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | 登录路由按会话状态分流 | 必须 | feature | `npm run preflight` |

## 登录路由按会话状态分流（REQ-001）

### 用户或系统价值

路由入口必须根据会话状态给出确定页面，避免已登录用户进入登录页或未登录用户进入首页。

### 需求描述

当文档链路模拟登录路由能力时，PRD 必须明确登录路由根据会话状态选择首页或登录页。

### 行为规则

- 会话有效时，登录路由进入首页。
- 会话无效或缺失时，登录路由进入登录页。
- 文档链路必须能把该需求追踪到 TSD、TVD、TED 和 VED。

### 输入与输出

| 项目 | 内容 |
| --- | --- |
| 输入 | 会话状态。 |
| 输出 | 首页或登录页路由结果。 |

### 关联契约

- API / SDK / CLI：不涉及。
- Schema / 数据：不涉及。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：保持正式文档链路闭包校验。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 会话状态缺失。 | 路由进入登录页。 | `npm run preflight` |

### 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 完整链路校验 | 同一 `doc_id` 下存在 PRD、TSD、TVD、TED 和 VED | 运行 preflight fixture 测试 | 链路闭包通过 |

### 验证方式

- 验证类型：contract。
- 覆盖对象：登录路由需求点和正式文档链路闭包。
- 后续沉淀：TVD、TED 和 VED 已在同一 `doc_id` 链路下维护。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | contract | 同一 `doc_id` 的 VED | 已覆盖 |
