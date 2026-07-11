---
title: Plugin Cache Refresh TVD
status: approved
feature: plugin-cache-fixture
doc_id: plugin-cache-refresh
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md
  - docs/coding-plugins/features/plugin-cache-fixture/plans/plugin-cache-refresh-TED.md
  - docs/coding-plugins/features/plugin-cache-fixture/requirements/plugin-cache-refresh-PRD.md
  - docs/coding-plugins/features/plugin-cache-fixture/technicals/plugin-cache-refresh-TSD.md
---
# Plugin Cache Refresh TVD

## 阅读摘要

- **本文结论:** 本测试用例 fixture 覆盖同一 `doc_id` 的核心 contract 校验。
- **当前状态:** approved。
- **先读重点:** 先看测试策略摘要和测试用例总览，再看 TC-001 的断言。
- **证据目标:** 执行结果写入同一 `doc_id` 的 VED。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | plugin-cache-fixture |
| Doc ID | plugin-cache-refresh |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节 |

## 测试策略摘要

使用 config 测试验证版本字段和缓存 manifest 一致。

## 风险到测试映射

| 风险 | 覆盖测试 | 处理方式 |
| --- | --- | --- |
| 文档链路缺失或过期 | TC-001 / REQ-001 | 自动化校验同一 `doc_id` 的完整链路 |

## 测试环境与数据

- 环境：本仓库 Node.js 测试环境。
- 数据：formal-feature-chain fixture 下的 plugin-cache-fixture/plugin-cache-refresh 文档链。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 缓存 manifest 版本一致 | REQ-001 | config | 自动化 | VED |

## 缓存 manifest 版本一致（TC-001 / REQ-001）

### 测试目标

确认仓库版本提升后，Git marketplace cache 中的插件 manifest 同步到相同版本。

### 前置条件

- 仓库 manifest 已提升版本。
- Git marketplace snapshot 和插件 cache 已刷新。

### 测试步骤

1. 读取仓库 `.codex-plugin/plugin.json`。
2. 读取 Git marketplace cache `.codex-plugin/plugin.json`。
3. 比较 `version` 字段。

### 断言

- 两个 `version` 字段一致。
- `RELEASE-NOTES.md` 包含该版本。

### 测试数据

| 数据项 | 取值 | 用途 |
| --- | --- | --- |
| version | 1.0.x | 缓存一致性判断 |

### 证据目标

- VED 记录：同一 `doc_id` 的 VED

## 通过 / 失败标准

- 通过：TC-001 执行后，链路闭包、metadata 和 schema 校验均通过。
- 失败：缺少任一上游文档、REQ-001 覆盖缺失或 TED source_hash 过期。

## 自动化状态

| 测试用例 | 自动化状态 | 命令 |
| --- | --- | --- |
| TC-001 | 已自动化 | `npm run preflight` |
