---
title: Plugin Cache Refresh TID
status: approved
lifecycle_status: approved
feature: plugin-cache-fixture
doc_id: plugin-cache-refresh
created: 2026-07-02
updated: 2026-07-02
implemented_commits: []
validated_by:
  - python3 -m unittest scripts.test_preflight.PreflightTests.test_golden_feature_fixture_satisfies_formal_document_chain
related_specs:
  - docs/coding-plugins/features/plugin-cache-fixture/requirements/plugin-cache-refresh-PRD.md
related_technical:
  - docs/coding-plugins/features/plugin-cache-fixture/technicals/plugin-cache-refresh-TDD.md
related_test_cases:
  - docs/coding-plugins/features/plugin-cache-fixture/test-cases/plugin-cache-refresh-TCD.md
related_plans:
  - docs/coding-plugins/features/plugin-cache-fixture/plans/plugin-cache-refresh-IPD.md
related_evidence:
  - docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-TED.md
---
# Plugin Cache Refresh TID

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | plugin-cache-fixture |
| Doc ID | plugin-cache-refresh |
| 文档类型 | TID |
| 关系源 | frontmatter `related_*` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 实现摘要、实现点总览、实现点章节 |

## 实现摘要

本案例模拟插件维护中的缓存刷新动作，重点是版本读取和缓存路径验证。

## 实现点总览

| 实现点 | 标题 | 覆盖规格 | 关联设计 | 主要落点 |
| --- | --- | --- | --- | --- |
| IMPL-001 | 缓存版本一致性检查 | REQ-001 | TD-001 | `.codex-plugin/plugin.json` |

## 缓存版本一致性检查（IMPL-001 / REQ-001）

### 实现目标

安装后读取 personal cache manifest，确认版本与仓库 manifest 一致。

### 代码落点

| 类型 | 路径或符号 | 实现内容 | 关联设计 |
| --- | --- | --- | --- |
| 配置 | `.codex-plugin/plugin.json` | 仓库版本源 | TD-001 |
| 配置 | `.version-bump.json` | 版本提升同步目标 | TD-001 |

### 数据和状态

版本号是唯一状态；缓存路径由 Codex plugin install 生成。

### 实现约束

- 需求来源：REQ-001
- 设计来源：TD-001
- 测试交接：TC-001
- 执行交接：TASK-001

## 测试交接

TCD 需要覆盖仓库 manifest、release notes 和缓存 manifest 的一致性。
