---
title: Skill File Naming TSD
status: approved
lifecycle_status: approved
feature: skill-file-naming
doc_id: skill-file-naming
created: 2026-07-04
updated: 2026-07-04
related_docs:
  - docs/coding-plugins/features/skill-file-naming/evidences/skill-file-naming-VED.md
  - docs/coding-plugins/features/skill-file-naming/plans/skill-file-naming-TED.md
  - docs/coding-plugins/features/skill-file-naming/requirements/skill-file-naming-PRD.md
  - docs/coding-plugins/features/skill-file-naming/test-cases/skill-file-naming-TVD.md
implemented_commits: []
validated_by:
  - npm run preflight
external_references: []
---
# Skill File Naming TSD

## 阅读摘要

- **本文结论:** REQ-001 通过仓库路径扫描测试和 preflight 自动发现机制防止命名漂移。
- **当前状态:** approved。
- **先读重点:** 先看规格到设计映射和测试策略。
- **下游同步:** TVD、TED 和 VED 共享同一 `doc_id`。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skill-file-naming |
| Doc ID | skill-file-naming |

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | skill supporting files 和测试路径必须保持稳定命名 | `tests/ts/file-naming.test.mjs` | TD-001 | `tests/ts/file-naming.test.mjs` | `npm run preflight` | 同一 `doc_id` 的 VED |

## 无需技术方案的规格

| 规格 ID | 原因 |
| --- | --- |
| REQ-001 | 已由 TD-001 覆盖 |

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 使用仓库路径扫描测试约束命名 | 命名漂移通常发生在新增文件时，适合自动扫描 | 需要维护少量平台约定例外 |

## 测试策略

| 规格 ID | 测试层级 | 命令 |
| --- | --- | --- |
| REQ-001 | contract | `npm run preflight` |
