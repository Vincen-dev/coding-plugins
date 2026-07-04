---
title: Plugin Cache Refresh TSD
status: approved
lifecycle_status: approved
feature: plugin-cache-fixture
doc_id: plugin-cache-refresh
created: 2026-07-02
updated: 2026-07-02
related_docs:
  - docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md
  - docs/coding-plugins/features/plugin-cache-fixture/plans/plugin-cache-refresh-TED.md
  - docs/coding-plugins/features/plugin-cache-fixture/requirements/plugin-cache-refresh-PRD.md
  - docs/coding-plugins/features/plugin-cache-fixture/test-cases/plugin-cache-refresh-TVD.md
implemented_commits: []
validated_by:
  - npm run preflight
---
# Plugin Cache Refresh TSD

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | plugin-cache-fixture |
| Doc ID | plugin-cache-refresh |
| 文档类型 | TSD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |

## 规格缺口审查

| 未覆盖需求 | 验收标准 | 外部行为 | 处理状态 |
| --- | --- | --- | --- |
| 无 | REQ-001 已覆盖版本一致性 | Codex 加载缓存版本 | 已覆盖 |

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 用 manifest 版本作为缓存一致性源 | Codex 以插件 manifest 区分版本缓存 | 需要安装后再次读取缓存 manifest |

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 刷新并验证 personal 插件缓存 | `.codex-plugin/plugin.json` 和 personal cache manifest | TD-001 | `.codex-plugin/plugin.json` | `npm run preflight` | `docs/coding-plugins/features/plugin-cache-fixture/evidences/plugin-cache-refresh-VED.md` |

## 无需技术设计的规格

| 规格 ID | 原因 |
| --- | --- |
| 无 | 所有 MUST 规格均有技术落点。 |

## 测试策略

| 规格 ID | 测试层级 | 命令 |
| --- | --- | --- |
| REQ-001 | config | `npm run preflight` |
