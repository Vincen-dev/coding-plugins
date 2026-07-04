---
title: Creek Upload Status TVD
status: approved
feature: creek-wrapper-fixture
doc_id: creek-upload-status
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/creek-wrapper-fixture/evidences/creek-upload-status-VED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/plans/creek-upload-status-TED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/requirements/creek-upload-status-PRD.md
  - docs/coding-plugins/features/creek-wrapper-fixture/technicals/creek-upload-status-TSD.md
---
# Creek Upload Status TVD

## 阅读摘要

- **本文结论:** 本测试用例 fixture 覆盖同一 `doc_id` 的核心 contract 校验。
- **当前状态:** approved。
- **先读重点:** 先看测试策略摘要和测试用例总览，再看 TC-001 的断言。
- **证据目标:** 执行结果写入同一 `doc_id` 的 VED。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | creek-wrapper-fixture |
| Doc ID | creek-upload-status |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节 |

## 测试策略摘要

使用 contract 测试验证 wrapper 上传状态查询的输入、输出和枚举稳定性。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 查询混合上传状态 | REQ-001 | contract | 自动化 | VED |

## 查询混合上传状态（TC-001 / REQ-001）

### 测试目标

验证 uploaded 和 pending 可以在同一次查询中被区分。

### 前置条件

- 构造一条已上传记录和一条未上传记录。

### 测试步骤

1. 调用上传状态查询。
2. 读取返回状态集合。

### 断言

- 返回包含 `uploaded`。
- 返回包含 `pending`。
- 无数据范围返回空集合。

### 测试数据

| 数据项 | 取值 | 用途 |
| --- | --- | --- |
| type | heartRate | 健康数据类型 |

### 证据目标

- VED 记录：同一 `doc_id` 的 VED
