---
spec_id: plugin-technical-design-validator-feature
title: Technical Design Validator
type: feature
status: approved
area: plugin
capability: technical-design-validator
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
  - docs/coding-plugins/features/plugin/spec-technical-quality-gates/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/technical-design-validator/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/plugin/technical-design-validator/plans/implementation.md
related_evidence:
  - docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md
---

# Technical Design Validator 规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | technical-design-validator |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/plugin/technical-design-validator/technical/technical-design.md` |
| 实现计划 | `docs/coding-plugins/features/plugin/technical-design-validator/plans/implementation.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md` |

## 目标

将 technical design 的质量检查从 `scripts/preflight.py` 中沉淀为独立 validator，并增加泛化映射检测和 stale 检测，让技术设计从“结构合规”进一步变成“可检索、可审计、可判断是否过期”的工程资产。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 本批不强制一次性重写全部历史 technical 的泛化映射。 |
| NON-002 | 本批不把泛化映射 warning 直接升级为默认 preflight failure。 |
| NON-003 | 本批不新增外部依赖或 Markdown 完整 AST 解析器。 |

## 背景

- 当前行为：`scripts/preflight.py` 已能校验 technical 必需章节、MUST Spec ID 覆盖和 related metadata，但逻辑集中在 preflight 中，且无法独立运行。
- 当前风险：历史 technical 中存在“见本设计章节”类泛化映射，能通过门禁，但检索 Spec ID 时仍需人工二次阅读。
- 目标用户或调用方：插件维护者、technical 文档作者、preflight、未来 CI 或编辑器集成。
- 约束：实现使用 Python 标准库；普通模式不能因历史泛化映射 warning 阻断现有 preflight；strict 模式可以把 warning 升级为失败。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 提供 `skills/writing-technical-design/scripts/validate_technical_design.py`，支持校验单个 technical 文件或仓库内全部 technical 文件，并支持 `--root` 指定仓库根用于测试或非标准工作区。 | 单元测试 `test_cli_validates_repository_technical_docs`。 |
| REQ-002 | 必须 | validator 必须复用或等价覆盖现有 technical 结构门禁：必需章节、MUST Spec ID 映射或豁免、related metadata 路径真实存在。 | 单元测试 `test_validator_rejects_missing_required_sections`、`test_validator_rejects_missing_must_spec_mapping`、`test_validator_rejects_missing_related_metadata_path`。 |
| REQ-003 | 必须 | validator 必须识别泛化映射短语，并在普通模式输出 warning，在 `--strict` 模式下返回失败。 | 单元测试 `test_validator_warns_about_generic_mapping` 和 `test_strict_validator_rejects_generic_mapping`。 |
| REQ-004 | 必须 | validator 必须在 related approved spec 的 `updated` 晚于 technical `updated` 时标记 stale；普通模式输出 warning，`--strict` 模式返回失败。 | 单元测试 `test_validator_warns_when_spec_is_newer_than_technical` 和 `test_strict_validator_rejects_stale_technical`。 |
| REQ-005 | 必须 | `scripts/preflight.py` 必须接入 validator 的非 strict 校验路径，保留现有结构错误失败能力，但不因历史 warning 阻断发布。 | 单元测试 `test_preflight_runs_technical_design_validator_tests` 与 `python3 scripts/preflight.py`。 |
| REQ-006 | 必须 | `writing-technical-design` skill 必须提示作者可单独运行 validator，并说明 strict 模式用于迁移或发布前质量审计。 | 文档检查和 `python3 scripts/preflight.py`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | technical 缺少 `## 规格到设计映射` 或 `## 无需技术设计的规格`。 | validator 失败并指出缺失章节。 | 单元测试。 |
| ERR-002 | approved spec 中的 MUST Spec ID 未在 technical 映射或豁免。 | validator 失败并列出缺失 Spec ID。 | 单元测试。 |
| ERR-003 | related metadata 引用不存在的 spec、plan 或 evidence 路径。 | validator 失败并列出缺失路径。 | 单元测试。 |
| ERR-004 | technical 映射使用“见本设计章节”等泛化短语。 | 普通模式 warning，strict 模式失败。 | 单元测试。 |
| ERR-005 | related approved spec 的 `updated` 晚于 technical `updated`。 | 普通模式 warning，strict 模式失败。 | 单元测试。 |
| ERR-006 | technical 没有 related spec 或 spec 缺少 `updated`。 | 不做 stale 判断；其他结构校验继续执行。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 独立校验 technical | 仓库存在 feature-first technical 文档 | 运行 `python3 skills/writing-technical-design/scripts/validate_technical_design.py docs/coding-plugins/features/plugin/spec-technical-quality-gates/technical/technical-design.md` | 命令返回 0，并输出校验通过或 warning 摘要。 |
| AC-002 | strict 审计泛化映射 | technical 的映射表包含泛化短语 | 运行 validator `--strict` | 命令返回非 0，并指出泛化映射位置。 |
| AC-003 | strict 审计 stale technical | approved spec 更新时间晚于 technical | 运行 validator `--strict` | 命令返回非 0，并指出 spec 和 technical 的 updated 值。 |
| AC-004 | 发布前门禁 | 仓库处于当前历史 technical 状态 | 运行 `python3 scripts/preflight.py` | 结构错误仍失败，泛化映射和 stale warning 不阻断默认 preflight。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| REQ-005 | 单元测试 / 命令验证 | `python3 -m unittest scripts/test_preflight.py`、`python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| REQ-006 | 文档校验 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| ERR-006 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| AC-001 | 命令验证 | `python3 skills/writing-technical-design/scripts/validate_technical_design.py docs/coding-plugins/features/plugin/spec-technical-quality-gates/technical/technical-design.md` | Task 4 | 已覆盖 |
| AC-002 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| AC-003 | 单元测试 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | Task 2 | 已覆盖 |
| AC-004 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
