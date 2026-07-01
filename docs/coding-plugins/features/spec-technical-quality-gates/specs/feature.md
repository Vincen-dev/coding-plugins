---
spec_id: plugin-spec-technical-quality-gates-feature
title: Spec 与 Technical 质量门禁
type: feature
status: approved
feature: spec-technical-quality-gates
created: 2026-06-29
updated: 2026-06-29
tags:
  - spec
  - technical-design
  - preflight
  - traceability
related_code:
  - scripts/preflight.py
  - scripts/test_preflight.py
  - skills/writing-technical-design/SKILL.md
  - skills/writing-technical-design/templates/technical-design.md
related_specs:
  - docs/coding-plugins/features/technical-design-artifacts/specs/feature.md
related_technical:
  - docs/coding-plugins/features/spec-technical-quality-gates/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/spec-technical-quality-gates/plans/implementation.md
related_evidence:
  - docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md
---

# Spec 与 Technical 质量门禁规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | spec-technical-quality-gates |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/spec-technical-quality-gates/technical/technical-design.md` |
| 实现计划 | `docs/coding-plugins/features/spec-technical-quality-gates/plans/implementation.md` |
| TDD 证据 | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` |

## 目标

强化 spec 和 technical design 的可追踪关系，让 technical 对每个 MUST Spec ID 都有工程设计落点，或者显式说明该规格无需技术设计，避免 technical 成为只写方案摘要的松散文档。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 本批不实现 spec.updated 晚于 technical 的过期检查。 |
| NON-002 | 本批不拆出独立 `validate_technical_design.py`；仍由 `scripts/preflight.py` 承担发布门禁。 |
| NON-003 | 不强制轻量例外 feature 立即补 technical/plan。 |

## 背景

- 当前行为：preflight 能阻止 technical 引用不存在的 Spec ID，但不能保证 spec 中每个 MUST ID 都在 technical 中有设计落点。
- 目标用户或调用方：插件维护者、计划执行代理、评审代理、发布前 preflight。
- 约束：校验必须使用 Python 标准库；技术设计正文标题和表头保持中文；Spec ID、路径和命令可保留英文。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | technical 模板必须包含 `## 规格到设计映射`，用于把 Spec ID 映射到技术落点、设计决策和测试策略。 | 单元测试 `test_technical_template_requires_spec_design_mapping_sections`。 |
| REQ-002 | 必须 | technical 模板必须包含 `## 无需技术设计的规格`，用于显式豁免不需要技术设计落点的 Spec ID。 | 单元测试 `test_technical_template_requires_spec_design_mapping_sections`。 |
| REQ-003 | 必须 | preflight 必须校验每个 technical 文档包含 `## 规格到设计映射` 和 `## 无需技术设计的规格`。 | 单元测试 `test_technical_design_requires_spec_design_mapping_sections`。 |
| REQ-004 | 必须 | preflight 必须校验同 feature 已批准 spec 中的每个 MUST Spec ID，都出现在 technical 的 `规格到设计映射` 或 `无需技术设计的规格` 中。 | 单元测试 `test_technical_design_must_cover_required_spec_ids`。 |
| REQ-005 | 必须 | preflight 必须校验 technical frontmatter 在对应文件存在时包含 `related_specs`、`related_plans` 和 `related_evidence`，并且路径真实存在。 | 单元测试 `test_technical_metadata_requires_related_chain_paths`。 |
| REQ-006 | 必须 | `writing-technical-design` skill 必须要求设计阶段填写规格到设计映射，并在自审中检查 MUST Spec ID 覆盖。 | 行为测试或文档测试 `python3 -m unittest tests.behavior.test_routing` 与 preflight。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | technical 缺少 `## 规格到设计映射`。 | preflight 失败并指出缺失章节。 | 单元测试。 |
| ERR-002 | technical 缺少 `## 无需技术设计的规格`。 | preflight 失败并指出缺失章节。 | 单元测试。 |
| ERR-003 | approved spec 中的 MUST Spec ID 没有在 technical 中映射或豁免。 | preflight 失败并指出遗漏的 Spec ID。 | 单元测试。 |
| ERR-004 | technical metadata 中的 related 路径指向不存在的文件。 | preflight 失败并指出缺失路径。 | 单元测试。 |
| ERR-005 | feature 没有 technical 文档但 README 声明了轻量例外。 | 本批不强制补 technical，维持既有轻量例外规则。 | 既有 `test_feature_document_chain_requires_plan_or_lightweight_exception`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 编写新 technical | 已有 approved spec | 使用 technical 模板 | 模板要求填写规格到设计映射和无需技术设计豁免表。 |
| AC-002 | 发布前检查 | spec 中存在 MUST Spec ID | 运行 `python3 scripts/preflight.py` | 未覆盖的 MUST Spec ID 会导致 preflight 失败。 |
| AC-003 | 更新 technical 链路 | feature 已有 spec、plan、evidence | 运行 `python3 scripts/preflight.py` | related 链路缺失或路径不存在会导致 preflight 失败。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 3 | 已覆盖 |
| REQ-006 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 3 | 已覆盖 |
| ERR-005 | 回归测试 | `python3 -m unittest scripts/test_preflight.py` | Task 4 | 已覆盖 |
| AC-001 | 文件检查 | `skills/writing-technical-design/templates/technical-design.md` | Task 1 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
