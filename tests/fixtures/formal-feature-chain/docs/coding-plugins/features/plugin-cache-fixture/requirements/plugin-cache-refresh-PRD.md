---
title: Plugin Cache Refresh PRD
type: maintenance
status: approved
feature: plugin-cache-fixture
doc_id: plugin-cache-refresh
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md
  - docs/coding-plugins/features/plugin-cache-fixture/plans/plugin-cache-refresh-TED.md
  - docs/coding-plugins/features/plugin-cache-fixture/technicals/plugin-cache-refresh-TSD.md
  - docs/coding-plugins/features/plugin-cache-fixture/test-cases/plugin-cache-refresh-TVD.md
tags:
  - plugin-cache
  - release
related_code:
  - .codex-plugin/plugin.json
---
# Plugin Cache Refresh PRD

## 阅读摘要

- **本文结论:** 发布后必须验证仓库版本、release notes 和本机 Codex personal 缓存版本一致。
- **当前状态:** approved。
- **先读重点:** 先看需求总览和缓存刷新需求点。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | plugin-cache-fixture |
| Doc ID | plugin-cache-refresh |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

确保新插件链路被 Codex 稳定读取，而不是继续使用旧缓存。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不推送远程 tag 或创建 GitHub Release。 |

## 背景

- 当前行为：本地仓库更新后，Codex 可能仍读取旧 personal cache。
- 目标用户或调用方：插件维护者。
- 约束：缓存版本必须能被命令验证。

## 成功指标

- PRD、TSD、TVD、TED 和 VED 的链路闭包可通过自动化校验。
- REQ-001 在设计、测试、执行和证据中都有可追踪覆盖。

## 假设与依赖

- 文档链路以同一 `feature` 和 `doc_id` 聚合。
- 自动化入口以 `npm run preflight` 作为最终校验。

## 开放问题

- 无：fixture 只沉淀 刷新并验证 personal 插件缓存 的链路校验，不扩展真实业务实现。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | 刷新并验证 personal 插件缓存 | 必须 | maintenance | config 测试 |

## 刷新并验证 personal 插件缓存（REQ-001）

### 用户或系统价值

维护者发布新模板后，Codex 新会话能加载同版本插件缓存。

### 需求描述

执行插件安装刷新后，缓存目录中的 `.codex-plugin/plugin.json` 版本必须等于仓库 manifest 版本。

### 行为规则

- 仓库 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json` 和 `.version-bump.json` 版本一致。
- `RELEASE-NOTES.md` 包含当前版本。
- personal cache 安装目录存在对应版本。

### 输入与输出

| 项目 | 内容 |
| --- | --- |
| 输入 | 目标版本号。 |
| 输出 | 刷新后的缓存版本。 |

### 关联契约

- API / SDK / CLI：`codex plugin add coding-plugins@personal`。
- Schema / 数据：manifest `version` 字段。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：发布前运行 preflight。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 缓存版本低于仓库版本。 | 阻止宣称发布完成。 | config 测试 |

### 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 缓存刷新 | 仓库版本已提升 | 安装 personal 插件 | 缓存 manifest 版本一致 |

### 验证方式

- 验证类型：config。
- 覆盖对象：manifest 版本和缓存版本。
- 后续沉淀：执行命令和结果写入 VED。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | config | 同一 `doc_id` 的 VED | 已覆盖 |
