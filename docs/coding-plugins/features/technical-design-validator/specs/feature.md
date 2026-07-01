---
spec_id: plugin-technical-design-validator-feature
title: Technical Design Validator
type: feature
status: approved
feature: technical-design-validator
created: 2026-06-29
updated: 2026-06-29
tags:
  - technical-design
  - validator
  - preflight
  - stale
  - traceability
related_code:
  - skills/writing-technical-design/scripts/validate_technical_design.py
  - skills/writing-technical-design/scripts/test_validate_technical_design.py
  - scripts/preflight.py
related_specs:
  - docs/coding-plugins/features/spec-technical-quality-gates/specs/feature.md
related_technical:
  - docs/coding-plugins/features/technical-design-validator/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/technical-design-validator/plans/implementation.md
related_evidence:
  - docs/coding-plugins/features/technical-design-validator/evidence/tdd-evidence.md
---

# Technical Design Validator 规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | technical-design-validator |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/technical-design-validator/technical/technical-design.md` |
| 实现计划 | `docs/coding-plugins/features/technical-design-validator/plans/implementation.md` |
| TDD 证据 | `docs/coding-plugins/features/technical-design-validator/evidence/tdd-evidence.md` |

## 目标

将 technical design 的质量检查从 `scripts/preflight.py` 中沉淀为独立 validator，并把规格到技术设计追踪、TD 决策 ID、生命周期、隐藏需求和轻量例外证据链纳入发布前 strict 门禁，让技术设计从“结构合规”进一步变成“可检索、可审计、可判断是否过期”的工程资产。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不引入第三方 YAML 或 Markdown 完整 AST 解析器。 |
| NON-002 | 不强制轻量例外 feature 补 technical/plan；但必须补 Spec ID 到 Evidence 的追踪表。 |
| NON-003 | 不改变现有 feature-first 文档路径结构。 |

## 背景

- 当前行为：`scripts/preflight.py` 已能校验 technical 必需章节、MUST Spec ID 覆盖和 related metadata，但逻辑集中在 preflight 中，且无法独立运行。
- 当前风险：历史 technical 中存在“见本设计章节”类泛化映射，能通过门禁，但检索 Spec ID 时仍需人工二次阅读；technical 也缺少生命周期、关键决策 ID 和隐藏需求拦截。
- 目标用户或调用方：插件维护者、technical 文档作者、preflight、未来 CI 或编辑器集成。
- 约束：实现使用 Python 标准库；普通模式保留本地作者快速审计能力；preflight 默认使用 strict 模式作为发布前门禁。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 提供 `skills/writing-technical-design/scripts/validate_technical_design.py`，支持校验单个 technical 文件或仓库内全部 technical 文件，并支持 `--root` 指定仓库根用于测试或非标准工作区。 | 单元测试 `test_cli_validates_repository_technical_docs`。 |
| REQ-002 | 必须 | validator 必须复用或等价覆盖现有 technical 结构门禁：必需章节、MUST Spec ID 映射或豁免、related metadata 路径真实存在。 | 单元测试 `test_validator_rejects_missing_required_sections`、`test_validator_rejects_missing_must_spec_mapping`、`test_validator_rejects_missing_related_metadata_path`。 |
| REQ-003 | 必须 | validator 必须识别泛化映射短语，并在普通模式输出 warning，在 `--strict` 模式下返回失败。 | 单元测试 `test_validator_warns_about_generic_mapping` 和 `test_strict_validator_rejects_generic_mapping`。 |
| REQ-004 | 必须 | validator 必须在 related approved spec 的 `updated` 晚于 technical `updated` 时标记 stale；普通模式输出 warning，`--strict` 模式返回失败。 | 单元测试 `test_validator_warns_when_spec_is_newer_than_technical` 和 `test_strict_validator_rejects_stale_technical`。 |
| REQ-005 | 必须 | `scripts/preflight.py` 必须接入 validator 的 strict 校验路径，泛化映射和 stale warning 在发布前必须失败。 | 单元测试 `test_preflight_runs_technical_design_validator_in_strict_mode` 与 `python3 scripts/preflight.py`。 |
| REQ-006 | 必须 | `writing-technical-design` skill 必须提示作者可单独运行 validator，并说明 preflight 使用 strict 质量门禁。 | 文档检查和 `python3 scripts/preflight.py`。 |
| REQ-007 | 必须 | technical 的 `## 规格到设计映射` 必须使用 7 列结构：`Spec ID`、`规格摘要`、`技术落点`、`关键决策 ID`、`影响文件/符号`、`验证命令`、`Evidence`。 | 单元测试 `test_validator_rejects_legacy_mapping_header`。 |
| REQ-008 | 必须 | technical 的 `## 关键决策` 必须使用 `TD-xxx` 决策 ID，映射表引用的决策 ID 必须存在。 | 单元测试 `test_validator_rejects_mapping_without_existing_decision_id`。 |
| REQ-009 | 必须 | technical frontmatter 必须维护 `lifecycle_status`、`implemented_commits`、`validated_by`，且 lifecycle status 必须属于允许集合。 | 单元测试 `test_validator_rejects_missing_lifecycle_metadata`。 |
| REQ-010 | 必须 | technical 中出现必须、不得、禁止、MUST、SHOULD 类新增约束时，必须引用 Spec ID 或标记为“设计约束”。 | 单元测试 `test_validator_rejects_hidden_requirement_without_spec_reference`。 |
| REQ-011 | 必须 | README 轻量例外必须包含 `Spec ID -> Evidence` 表，覆盖 approved spec 的所有 MUST Spec ID 并指向真实 evidence 文件。 | 单元测试 `test_feature_document_chain_requires_plan_or_lightweight_exception`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | technical 缺少 `## 规格到设计映射` 或 `## 无需技术设计的规格`。 | validator 失败并指出缺失章节。 | 单元测试。 |
| ERR-002 | approved spec 中的 MUST Spec ID 未在 technical 映射或豁免。 | validator 失败并列出缺失 Spec ID。 | 单元测试。 |
| ERR-003 | related metadata 引用不存在的 spec、plan 或 evidence 路径。 | validator 失败并列出缺失路径。 | 单元测试。 |
| ERR-004 | technical 映射使用“见本设计章节”等泛化短语。 | 普通模式 warning，strict 模式失败。 | 单元测试。 |
| ERR-005 | related approved spec 的 `updated` 晚于 technical `updated`。 | 普通模式 warning，strict 模式失败。 | 单元测试。 |
| ERR-006 | technical 没有 related spec 或 spec 缺少 `updated`。 | 不做 stale 判断；其他结构校验继续执行。 | 单元测试。 |
| ERR-007 | technical 仍使用旧 4 列规格到设计映射表。 | validator 失败并指出必需表头。 | 单元测试。 |
| ERR-008 | 映射表引用了不存在的 `TD-xxx`。 | validator 失败并指出未知决策 ID。 | 单元测试。 |
| ERR-009 | technical 缺少 lifecycle metadata。 | validator 失败并指出缺失字段。 | 单元测试。 |
| ERR-010 | technical 直接补写未追踪的新需求。 | validator 失败并指出 hidden requirement。 | 单元测试。 |
| ERR-011 | 轻量例外 README 缺少 Spec ID 到 Evidence 表。 | preflight 失败并指出轻量例外追踪不完整。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 独立校验 technical | 仓库存在 feature-first technical 文档 | 运行 `python3 skills/writing-technical-design/scripts/validate_technical_design.py docs/coding-plugins/features/spec-technical-quality-gates/technical/technical-design.md` | 命令返回 0，并输出校验通过或 warning 摘要。 |
| AC-002 | strict 审计泛化映射 | technical 的映射表包含泛化短语 | 运行 validator `--strict` | 命令返回非 0，并指出泛化映射位置。 |
| AC-003 | strict 审计 stale technical | approved spec 更新时间晚于 technical | 运行 validator `--strict` | 命令返回非 0，并指出 spec 和 technical 的 updated 值。 |
| AC-004 | 发布前门禁 | 仓库处于当前 technical 状态 | 运行 `python3 scripts/preflight.py` | strict technical validator 通过，泛化映射和 stale warning 均不能残留。 |
| AC-005 | 维护者审计 technical 全链路 | 仓库存在多个 technical 文档 | 运行 `python3 skills/writing-technical-design/scripts/validate_technical_design.py --strict --format json` | 返回 `ok=true`、`error_count=0`、`warning_count=0`。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| REQ-005 | 单元测试 / 命令验证 | `python3 -m unittest scripts/test_preflight.py`、`python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| REQ-006 | 文档校验 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| REQ-007 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| REQ-008 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| REQ-009 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| REQ-010 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| REQ-011 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 5 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| ERR-006 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| ERR-007 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| ERR-008 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| ERR-009 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| ERR-010 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 5 | 已覆盖 |
| ERR-011 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 5 | 已覆盖 |
| AC-001 | 命令验证 | `python3 skills/writing-technical-design/scripts/validate_technical_design.py docs/coding-plugins/features/spec-technical-quality-gates/technical/technical-design.md` | Task 4 | 已覆盖 |
| AC-002 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| AC-003 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| AC-004 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| AC-005 | 命令验证 | `python3 skills/writing-technical-design/scripts/validate_technical_design.py --strict --format json` | Task 5 | 已覆盖 |
