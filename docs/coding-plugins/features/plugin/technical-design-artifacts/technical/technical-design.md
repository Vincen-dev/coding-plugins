---
title: 技术设计产物独立维护技术设计
status: approved
area: plugin
capability: technical-design-artifacts
created: 2026-06-26
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/technical-design-artifacts/specs/feature.md
related_plans:
  - docs/coding-plugins/features/plugin/technical-design-artifacts/plans/implementation.md
---

# 技术设计产物独立维护技术设计

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | technical-design-artifacts |
| 规格 | `docs/coding-plugins/features/plugin/technical-design-artifacts/specs/feature.md` |
| 计划 | `docs/coding-plugins/features/plugin/technical-design-artifacts/plans/implementation.md` |

## 设计摘要

新增独立技术设计层，位于 Spec 和 Plan 之间。`writing-technical-design` 负责把批准规格转成 feature root 的 `technical/technical-design.md`，`writing-plans` 只引用技术设计并拆解 TDD 任务到 `plans/implementation.md`。preflight 统一校验总索引、Spec 引用、Plan 引用、Spec ID 追踪、规格缺口审查和 technical 模板中文结构。

## 规格缺口审查

| 检查项 | 结论 |
| --- | --- |
| 未覆盖需求 | 无。 |
| 验收标准不清 | 无。 |
| 新增外部行为 | 无。 |
| 处理状态 | 通过，未发现需要回写 spec 的缺口。 |

## 关键决策

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 在 feature root 的 `technical/` 子目录下新增 `technical/technical-design.md`，而不是复用 `plans/implementation.md` | 区分稳定技术方案和执行任务，避免 `plans/implementation.md` 同时承担设计和步骤 | 需要维护新的引用和校验规则 |
| 新增 `writing-technical-design` skill | 技术设计是独立阶段，放进 `writing-plans` 会让计划 skill 继续膨胀 | 会增加一次技能选择和文档产物 |
| 在 technical 中增加 `## 规格缺口审查` | 防止技术方案顺手新增需求或掩盖验收不清；缺口必须回写 spec 后再继续设计 | 现有 technical 文档需要补充一段固定审查表 |
| technical 模板标题和表头统一中文 | 插件面向中文工作流，模板会直接影响后续产物语言 | 英文工程术语保留在 Spec ID、命令和路径中 |
| preflight 只强制校验真实 technical 文件和已有引用 | 避免历史 capability 必须立即回填技术设计 | 历史规格暂时可能没有 technical 链路 |
| 总索引增加 `Technical Design` 列 | 检索 capability 时能看到 Spec、Technical、Plan、Evidence 全链路 | 需要更新既有索引行 |

## 影响组件

| 组件 | 变更 | 相关 Spec ID |
| --- | --- | --- |
| `skills/writing-technical-design/SKILL.md` | 新增技术设计 skill，定义职责、路径、流程和自审规则 | REQ-004, AC-002 |
| `skills/writing-technical-design/SKILL.md` | 增加规格缺口门禁，发现需求或验收不清时回到 `spec-driven-development` | REQ-008, AC-004 |
| `skills/writing-technical-design/templates/technical-design.md` | 提供中文标题 technical 模板和规格缺口审查表 | REQ-004, REQ-009, REQ-010 |
| `skills/using-coding-plugins/SKILL.md` | 在批准规格后路由到 `writing-technical-design`，再进入 `writing-plans` | REQ-004 |
| `skills/writing-plans/SKILL.md` | 要求计划引用 `Technical Design Source`，并只保留方案快照 | REQ-005 |
| `docs/coding-plugins/INDEX.md` | 覆盖 feature root 和真实技术设计文档 | REQ-002 |
| `docs/coding-plugins/INDEX.md` | 新增 `Technical Design` 列 | REQ-003 |
| `scripts/preflight.py` | 增加 technical 文档收集、索引、引用、Spec ID、规格缺口审查和模板中文结构校验 | REQ-001, REQ-002, REQ-003, REQ-005, REQ-006, REQ-008, REQ-009, REQ-010 |
| `tests/behavior/test_routing.py` | 覆盖新 skill 的入口路由 | REQ-004, REQ-007 |
| `scripts/test_preflight.py` | 覆盖缺口审查和 technical 模板中文结构回归 | REQ-008, REQ-009, REQ-010, ERR-006, ERR-007, ERR-008 |

## 数据流 / 控制流

```mermaid
flowchart TD
  A["Approved Spec"] --> B["writing-technical-design"]
  B --> C["technical/technical-design.md"]
  C --> D["writing-plans"]
  D --> E["plans/implementation.md"]
  E --> F["test-driven-development"]
  F --> G["tdd-evidence.md"]
  C --> H["docs/coding-plugins/INDEX.md"]
```

## 接口和契约

- Technical design path: `docs/coding-plugins/features/plugin/technical-design-artifacts/technical/technical-design.md`
- Plan path: `docs/coding-plugins/features/plugin/technical-design-artifacts/plans/implementation.md`
- Evidence path: `docs/coding-plugins/features/plugin/technical-design-artifacts/evidence/tdd-evidence.md`
- Spec metadata may include `related_technical` paths.
- Plan must include `Technical Design Source:` followed by a real technical design path.
- Technical design may mention Spec IDs only if those IDs exist in the corresponding spec directory.
- Technical design must include `## 规格缺口审查` and cover `未覆盖需求`、`验收标准不清`、`新增外部行为` and `处理状态`.
- If the gap review contains unresolved terms such as `未处理`、`待处理`、`需澄清`、`不清楚` or `待确认`, preflight fails and implementation must return to spec first.
- The default technical template must use Chinese section headings and table headers.

## 迁移 / 兼容性

历史 capability 不强制立即回填 technical 文档。preflight 只校验真实存在的 technical 文件，以及 Spec 和 Plan 中已经声明的 technical 引用。总索引中历史行的 `Technical` 列可暂时使用 `-`。

## 测试策略

- REQ-001 到 REQ-006 使用 `python3 -m unittest scripts/test_preflight.py` 覆盖。
- REQ-008 到 REQ-010 和 ERR-006 到 ERR-008 使用 `python3 -m unittest scripts/test_preflight.py` 覆盖。
- REQ-004 和 REQ-007 使用 `python3 -m unittest tests.behavior.test_routing` 覆盖。
- AC-003 使用 `python3 scripts/preflight.py` 做完整发布前验证。
- TDD Evidence 写入 `docs/coding-plugins/features/plugin/technical-design-artifacts/evidence/tdd-evidence.md`。

## 风险和缓解

| 风险 | 缓解方案 |
| --- | --- |
| 新增 technical 层导致文档链路更长 | 使用总索引和 preflight 保证检索和引用一致 |
| 技术设计变成任务清单 | 在 `writing-technical-design` 中明确任务拆分属于 `writing-plans` |
| 技术设计变成隐藏需求入口 | 用 `## 规格缺口审查` 和 preflight 阻止未处理缺口进入 plan |
| 后续模板重新出现英文章节 | 用 `check_technical_templates_are_chinese` 在 preflight 中拦截 |
| 历史文档未回填造成发布阻塞 | preflight 不强制历史规格必须有 technical 引用 |
