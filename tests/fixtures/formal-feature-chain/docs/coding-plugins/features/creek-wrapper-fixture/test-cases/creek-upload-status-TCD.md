---
title: Creek Upload Status TCD
status: approved
feature: creek-wrapper-fixture
doc_id: creek-upload-status
created: 2026-07-02
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/creek-wrapper-fixture/requirements/creek-upload-status-PRD.md
related_technical:
  - docs/coding-plugins/features/creek-wrapper-fixture/technicals/creek-upload-status-TDD.md
  - docs/coding-plugins/features/creek-wrapper-fixture/technicals/creek-upload-status-TID.md
related_test_cases: []
related_plans:
  - docs/coding-plugins/features/creek-wrapper-fixture/plans/creek-upload-status-IPD.md
related_evidence:
  - docs/coding-plugins/features/creek-wrapper-fixture/evidences/creek-upload-status-TED.md
---
# Creek Upload Status TCD

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | creek-wrapper-fixture |
| Doc ID | creek-upload-status |
| 文档类型 | TCD |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节 |

## 测试策略摘要

使用 contract 测试验证 wrapper 上传状态查询的输入、输出和枚举稳定性。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 查询混合上传状态 | REQ-001 | contract | 自动化 | TED |

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

- TED 记录：`docs/coding-plugins/features/creek-wrapper-fixture/evidences/creek-upload-status-TED.md`
