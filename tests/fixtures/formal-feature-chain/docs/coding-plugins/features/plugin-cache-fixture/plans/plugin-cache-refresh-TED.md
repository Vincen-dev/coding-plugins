---
title: Plugin Cache Refresh Task Execution Document
status: approved
feature: plugin-cache-fixture
doc_id: plugin-cache-refresh
source_hash: sha256:120bf6dd633a9c40d9db875d94540da8556e0379dd9bd15b70a7343572060175
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md
  - docs/coding-plugins/features/plugin-cache-fixture/requirements/plugin-cache-refresh-PRD.md
  - docs/coding-plugins/features/plugin-cache-fixture/technicals/plugin-cache-refresh-TSD.md
  - docs/coding-plugins/features/plugin-cache-fixture/test-cases/plugin-cache-refresh-TVD.md
---
# Plugin Cache Refresh 任务执行文档（TED）

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | plugin-cache-fixture |
| Doc ID | plugin-cache-refresh |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |

## 目标

执行插件缓存刷新和版本一致性验证。

## 执行锁定区

- **Intent Lock:** 只执行插件缓存刷新 fixture 校验。
- **Scope Fence:** 包含 fixture 文档链路和缓存版本一致性校验；不包含真实发版、push 或缓存刷新。
- **Required Spec IDs:** REQ-001
- **Required Tests:** `npm run preflight`
- **Review Gates:** 检查 source_hash、执行简报和 TASK-001 到 VED 的追踪。
- **Rewind Triggers:** 上游 PRD/TSD/TVD 变更、source_hash 不匹配或 fixture 校验失败。

## 执行简报

- **执行来源:** 只按本 TED 的任务章节执行。
- **上下文预算:** 优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TSD/TVD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 TED，不向旧 TED 追加任务。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | VED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 验证 personal cache 版本 | REQ-001 | config fixture 校验 | `docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md` |

## 验证 personal cache 版本（TASK-001 / REQ-001）

### 任务目标

确认插件维护场景中安装缓存和仓库版本一致。

### 执行前提

- 已确认需求：REQ-001。
- 已确认设计：TD-001。
- 已确认测试：TC-001。

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 配置 | `.codex-plugin/plugin.json` | 版本源。 |
| 验证 | `src/cli/preflight.ts` | 版本一致性门禁。 |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`tests/ts/test_preflight_cli.mjs`
  - 预期失败：缺少 plugin cache 场景时失败。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`npm run preflight`
  - 预期：FAIL。
- [ ] **步骤 3：写最小实现**
  - 修改：`tests/fixtures/formal-feature-chain`
  - 边界：只补 fixture 文档。
- [ ] **步骤 4：运行测试确认 GREEN**
  - 命令：`npm run preflight`
  - 预期：PASS。
- [ ] **步骤 5：重构并重跑相关测试**
  - 命令：`npm run preflight`
  - 预期：PASS。
- [ ] **步骤 6：记录 VED 证据**
  - 写入：`docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md`

### 验证方式

| 覆盖规格 | 测试类型 | 命令或人工验收 | 预期结果 |
| --- | --- | --- | --- |
| REQ-001 | config | `npm run preflight` | PASS |
