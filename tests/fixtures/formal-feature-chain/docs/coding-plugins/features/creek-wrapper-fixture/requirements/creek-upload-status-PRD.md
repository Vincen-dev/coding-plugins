---
title: Creek Upload Status PRD
type: feature
status: approved
feature: creek-wrapper-fixture
doc_id: creek-upload-status
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/creek-wrapper-fixture/evidences/creek-upload-status-VED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/plans/creek-upload-status-TED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/technicals/creek-upload-status-TSD.md
  - docs/coding-plugins/features/creek-wrapper-fixture/test-cases/creek-upload-status-TVD.md
tags:
  - creek
  - sdk-wrapper
related_code:
  - lib/creek_health_data_source.dart
---
# Creek Upload Status PRD

## 阅读摘要

- **本文结论:** Wrapper 必须暴露稳定上传状态查询，调用方可区分已上传、未上传和无数据。
- **当前状态:** approved。
- **先读重点:** 先看需求总览，再看上传状态查询需求点。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | creek-wrapper-fixture |
| Doc ID | creek-upload-status |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

为 Creek SDK wrapper 沉淀一个 API/SDK 契约类实战案例。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不连接真实蓝牙设备或真实 SDK。 |

## 背景

- 当前行为：fixture 模拟 wrapper 需要暴露上传状态。
- 目标用户或调用方：业务 App、同步任务和回归测试。
- 约束：契约必须能被测试用例和 VED 证据追踪。

## 成功指标

- PRD、TSD、TVD、TED 和 VED 的链路闭包可通过自动化校验。
- REQ-001 在设计、测试、执行和证据中都有可追踪覆盖。

## 假设与依赖

- 文档链路以同一 `feature` 和 `doc_id` 聚合。
- 自动化入口以 `npm run preflight` 作为最终校验。

## 开放问题

- 无：fixture 只沉淀 查询健康数据上传状态 的链路校验，不扩展真实业务实现。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | 查询健康数据上传状态 | 必须 | api | contract 测试 |

## 查询健康数据上传状态（REQ-001）

### 用户或系统价值

业务 App 能在同步前判断哪些健康数据仍需上传，避免重复上传或漏传。

### 需求描述

Wrapper 提供上传状态查询能力，调用方传入数据类型和时间范围后，返回可区分的状态集合。

### 行为规则

- 已上传记录返回 `uploaded`。
- 未上传记录返回 `pending`。
- 查询范围无记录时返回空集合。

### 输入与输出

| 项目 | 内容 |
| --- | --- |
| 输入 | 数据类型、开始时间、结束时间。 |
| 输出 | 每条记录的上传状态。 |

### 关联契约

- API / SDK / CLI：`getUploadStatus(type, start, end)`。
- Schema / 数据：状态值限定为 `uploaded`、`pending`。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：保持状态枚举向后兼容。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 结束时间早于开始时间。 | 返回参数错误。 | contract 测试 |

### 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 查询混合状态 | 存在 uploaded 和 pending 记录 | 调用上传状态查询 | 返回两类状态 |

### 验证方式

- 验证类型：contract。
- 覆盖对象：API 输入输出和状态枚举。
- 后续沉淀：测试用例写入 TVD，执行任务写入 TED，实际证据写入 VED。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | contract | 同一 `doc_id` 的 VED | 已覆盖 |
