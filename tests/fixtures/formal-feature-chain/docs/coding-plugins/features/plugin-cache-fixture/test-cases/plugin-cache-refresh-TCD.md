---
title: Plugin Cache Refresh TCD
status: approved
feature: plugin-cache-fixture
doc_id: plugin-cache-refresh
created: 2026-07-02
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/plugin-cache-fixture/requirements/plugin-cache-refresh-PRD.md
related_technical:
  - docs/coding-plugins/features/plugin-cache-fixture/technicals/plugin-cache-refresh-TDD.md
  - docs/coding-plugins/features/plugin-cache-fixture/technicals/plugin-cache-refresh-TID.md
related_test_cases: []
related_plans:
  - docs/coding-plugins/features/plugin-cache-fixture/plans/plugin-cache-refresh-IPD.md
related_evidence:
  - docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-TED.md
---
# Plugin Cache Refresh TCD

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | plugin-cache-fixture |
| Doc ID | plugin-cache-refresh |
| 文档类型 | TCD |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节 |

## 测试策略摘要

使用 config 测试验证版本字段和缓存 manifest 一致。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 缓存 manifest 版本一致 | REQ-001 | config | 自动化 | TED |

## 缓存 manifest 版本一致（TC-001 / REQ-001）

### 测试目标

确认仓库版本提升后，personal cache 中的插件 manifest 同步到相同版本。

### 前置条件

- 仓库 manifest 已提升版本。
- personal cache 已刷新。

### 测试步骤

1. 读取仓库 `.codex-plugin/plugin.json`。
2. 读取 personal cache `.codex-plugin/plugin.json`。
3. 比较 `version` 字段。

### 断言

- 两个 `version` 字段一致。
- `RELEASE-NOTES.md` 包含该版本。

### 测试数据

| 数据项 | 取值 | 用途 |
| --- | --- | --- |
| version | 1.0.x | 缓存一致性判断 |

### 证据目标

- TED 记录：`docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-TED.md`
