---
title: Creek Upload Status TSD
status: approved
lifecycle_status: approved
feature: creek-wrapper-fixture
doc_id: creek-upload-status
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/creek-wrapper-fixture/evidences/creek-upload-status-VED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/plans/creek-upload-status-TED.md
  - docs/coding-plugins/features/creek-wrapper-fixture/requirements/creek-upload-status-PRD.md
  - docs/coding-plugins/features/creek-wrapper-fixture/test-cases/creek-upload-status-TVD.md
implemented_commits: []
validated_by:
  - npm run preflight
---
# Creek Upload Status TSD

## 阅读摘要

- **本文结论:** 本技术方案 fixture 用于验证同一 `doc_id` 的需求、技术、测试、执行和证据链路可以被工具读取。
- **当前状态:** approved。
- **先读重点:** 先看规格缺口审查、关键决策和规格到设计映射。
- **下游同步:** TVD、TED 和 VED 均以同一 `doc_id` 追踪。
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | creek-wrapper-fixture |
| Doc ID | creek-upload-status |
| 文档类型 | TSD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |

## 规格缺口审查

| 未覆盖需求 | 验收标准 | 外部行为 | 处理状态 |
| --- | --- | --- | --- |
| 无 | REQ-001 已定义状态枚举和边界 | SDK facade 返回状态集合 | 已覆盖 |

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 上传状态查询放在 wrapper facade | App 不直接依赖 SDK 内部表结构 | 需要 wrapper 维护枚举映射 |

## 备选方案

- 方案 A：使用现有正式链路 fixture 结构维护 查询健康数据上传状态。
- 方案 B：新增专用 fixture；当前需求只需验证链路闭包，额外 fixture 会增加维护成本。

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 查询健康数据上传状态 | `CreekHealthDataSource.getUploadStatus` | TD-001 | `lib/creek_health_data_source.dart` | `npm run preflight` | 同一 `doc_id` 的 VED |

## 无需技术设计的规格

| 规格 ID | 原因 |
| --- | --- |
| 无 | 所有 MUST 规格均有技术落点。 |

## 非功能设计

- 可维护性：正文不重复完整文档路径，关联关系以 frontmatter 为准。
- 可验证性：REQ-001 必须能被 source-scan、schema 和 preflight 串联验证。

## 上线 / 回滚

- 上线：fixture 随测试一起进入 preflight 校验。
- 回滚：若链路校验误伤，回退本 fixture 文档和对应测试合同。

## 测试策略

| 规格 ID | 测试层级 | 命令 |
| --- | --- | --- |
| REQ-001 | contract | `npm run preflight` |
