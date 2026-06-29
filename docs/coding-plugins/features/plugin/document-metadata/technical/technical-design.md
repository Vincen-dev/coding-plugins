---
title: 文档元数据中文展示优化技术设计
status: approved
area: plugin
capability: document-metadata
created: 2026-06-26
updated: 2026-06-26
related_specs:
  - docs/coding-plugins/features/plugin/document-metadata/specs/feature.md
related_plans:
  - docs/coding-plugins/features/plugin/document-metadata/plans/implementation.md
related_evidence:
  - docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md
---

# 文档元数据中文展示优化技术设计

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | document-metadata |
| 规格 | `docs/coding-plugins/features/plugin/document-metadata/specs/feature.md` |
| 计划 | `docs/coding-plugins/features/plugin/document-metadata/plans/implementation.md` |

## 设计摘要

保留 YAML frontmatter 的英文机器字段，避免破坏现有解析器和校验器。新增中文 `文档信息` 摘要表，作为人工阅读入口。Plan 文档补齐 frontmatter，并由 preflight 校验 Plan metadata、路径一致性和中文摘要。

## 规格缺口审查

| 检查项 | 结论 |
| --- | --- |
| 未覆盖需求 | 无。 |
| 验收标准不清 | 无。 |
| 新增外部行为 | 无。 |
| 处理状态 | 通过，未发现需要回写 spec 的缺口。 |

## 规格到设计映射

| Spec ID | 技术落点 | 设计决策 | 测试策略 |
| --- | --- | --- | --- |
| REQ-001 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 | 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |
| REQ-002 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 | 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |
| REQ-003 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 | 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |
| REQ-004 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 | 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |
| REQ-005 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 | 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |
| REQ-006 | 见本设计的 `影响组件`、`接口和契约` 与 `测试策略` 章节 | 按本 technical 的关键决策落地该规格 | 见 `## 测试策略` 和对应计划追踪 |

## 无需技术设计的规格

| Spec ID | 原因 |
| --- | --- |
| 无 | 本 capability 的 MUST 规格均有 technical 落点。 |

## 关键决策

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| frontmatter key 保持英文 | 现有 preflight 和规格校验器依赖稳定 key | 中文展示通过正文表格提供 |
| Plan 增加 frontmatter | Plan 是执行入口，也需要可追踪状态和关联文档 | 历史 plan 需要回填 metadata |
| preflight 校验中文摘要 | 保证中文展示不是可选装饰 | 需要维护摘要表字段 |

## 影响组件

| 组件 | 变更 | 相关 Spec ID |
| --- | --- | --- |
| `scripts/preflight.py` | 增加 Plan metadata 和中文文档信息校验 | REQ-001, REQ-002, REQ-003, REQ-006 |
| `scripts/test_preflight.py` | 增加 RED/GREEN 单元测试 | REQ-001, REQ-002, REQ-003 |
| `skills/writing-plans/SKILL.md` | 计划模板增加 frontmatter 和 `文档信息` | REQ-005, AC-001 |
| `skills/writing-technical-design/templates/technical-design.md` | 技术设计模板增加 `文档信息` | REQ-004 |
| `docs/coding-plugins/features/**/plans/implementation.md` | 回填现有计划 metadata 和中文摘要 | REQ-001, REQ-003 |

## 数据流 / 控制流

```mermaid
flowchart TD
  A["Plan markdown"] --> B["frontmatter machine metadata"]
  A --> C["中文文档信息摘要"]
  B --> D["preflight path metadata check"]
  C --> E["preflight chinese summary check"]
  D --> F["publish gate"]
  E --> F
```

## 接口和契约

- Plan frontmatter must include `title`、`status`、`area`、`capability`、`created`、`updated`。
- Plan path must remain `docs/coding-plugins/features/<area>/<capability>/plans/implementation.md`。
- Plan body must include `## 文档信息` and at least `状态`、`领域`、`能力` rows.
- Frontmatter key names remain English.

## 迁移 / 兼容性

Existing Plan documents are backfilled. Spec and Technical templates get Chinese summaries for new documents, but existing historical specs are not blocked if they do not yet contain `文档信息`.

## 测试策略

- RED/GREEN: `python3 -m unittest scripts/test_preflight.py`
- Final: `python3 scripts/preflight.py`
- Evidence: `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md`

## 风险和缓解

| 风险 | 缓解方案 |
| --- | --- |
| 中文摘要和 frontmatter 内容漂移 | preflight 校验必备字段和路径一致性 |
| 中文 key 破坏脚本 | 只中文化展示层，不改机器 key |
