---
spec_id: plugin-downstream-compatibility-maintenance
title: 下游项目兼容性和证据生命周期维护规格
type: maintenance
status: approved
feature: downstream-compatibility
created: 2026-07-01
updated: 2026-07-01
tags:
  - validator
  - compatibility
  - evidence
  - migration
  - external-references
related_code:
  - skills/spec-driven-development/scripts/validate_spec.py
  - skills/test-driven-development/scripts/validate_tdd_evidence.py
  - scripts/preflight.py
  - scripts/docs_index.py
  - scripts/migrate_document_contract.py
related_technical:
  - docs/coding-plugins/features/downstream-compatibility/technicals/downstream-compatibility-Technical-Design.md
---

# 下游项目兼容性和证据生命周期维护规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | downstream-compatibility |
| 规格类型 | maintenance |

## 目标

让 `coding-plugins` 的校验器和文档门禁适配真实下游 Dart/Flutter 项目，同时保持当前插件仓库的 metadata-first 契约。维护目标包括 validator 兼容、文档迁移、evidence 归档、状态收敛、TDD 测试质量标注和跨仓库引用边界。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 本轮不实现新的轻量模式或 `doc_mode: lightweight`。 |
| NON-002 | 不引入第三方 YAML 解析依赖。 |
| NON-003 | 不默认校验本机外部绝对路径，避免 CI 因机器路径差异失败。 |

## 当前基线

| 编号 | 既有行为或契约 | 证据 |
| --- | --- | --- |
| REQ-001 | 现有 SDD validator 校验 Spec ID、placeholder 和 Traceability Matrix。 | `skills/spec-driven-development/scripts/validate_spec.py` |
| REQ-002 | 现有 TDD evidence validator 校验中文 evidence 字段和 RED/GREEN/REFACTOR 证据。 | `skills/test-driven-development/scripts/validate_tdd_evidence.py` |
| REQ-003 | 现有 preflight 校验 feature-first 文档链路、README/Evidence metadata、索引一致性和技能行为测试。 | `scripts/preflight.py` |

## 维护需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| NFR-001 | 必须 | Spec ID 识别必须支持在前缀和数字之间加入一个或多个作用域段。 | 单元测试 `test_accepts_scoped_spec_ids_dart_generics_and_implemented_status_alias`、`test_accepts_scoped_spec_id_source`。 |
| NFR-002 | 必须 | placeholder 检测不得把 Dart 泛型如 `EvobeingApiResponse<T>`、`List<Foo>` 误判为未完成标记。 | 单元测试 `test_accepts_scoped_spec_ids_dart_generics_and_implemented_status_alias`。 |
| NFR-003 | 必须 | Traceability status 必须兼容真实项目中的 `已实现`、`完成`、`implemented` 和 `done`，并视为已覆盖类状态。 | 单元测试 `test_accepts_scoped_spec_ids_dart_generics_and_implemented_status_alias`。 |
| NFR-004 | 必须 | TDD evidence 必须支持可选 `测试类型` 字段，并拒绝未知测试类型。 | 单元测试 `test_rejects_unknown_test_type`。 |
| NFR-005 | 必须 | `source-scan` 不得作为用户行为的主要严格证据；普通模式警告，strict 模式失败。 | 单元测试 `test_strict_rejects_source_scan_for_user_behavior`。 |
| NFR-006 | 必须 | active evidence 和 archived evidence 必须分离；主索引和 strict TDD 校验只处理 active `evidences/downstream-compatibility-TDD-Evidence.md` 这类按 feature 命名的证据文件。 | 单元测试 `test_collect_tdd_evidence_files_excludes_archived_history`。 |
| NFR-007 | 必须 | archived evidence 必须声明历史 metadata，包括 `status: archived`、`validation_mode: historical`、`archive_of` 和 `archived_at`。 | 单元测试 `test_archived_evidence_metadata_uses_historical_contract`。 |
| NFR-008 | 必须 | 提供文档契约迁移脚本，将旧状态别名归一化，并把 `related_specs` 中的裸 Spec ID 移到 `related_spec_ids`。 | 单元测试 `scripts/test_document_contract_migration.py`。 |
| NFR-009 | 必须 | completed evidence 对应的 spec traceability 不得继续保持 `计划中`。 | 单元测试 `test_lifecycle_state_consistency_rejects_completed_evidence_with_planned_status`。 |
| NFR-010 | 必须 | 跨仓库引用必须进入 `external_references`，并通过显式参数检查，不进入默认 preflight。 | 单元测试 `test_external_reference_check_is_explicit_and_rejects_missing_paths`。 |

## 回归和风险情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 下游文档包含 Dart 泛型。 | validator 不报 placeholder 错误。 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py`。 |
| ERR-002 | 下游 evidence 使用 scoped Spec ID。 | strict TDD evidence 校验通过。 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py`。 |
| ERR-003 | active evidence 旁存在 `evidences/archive/*.md`。 | preflight 不把 archive 当 active evidence 严格校验。 | `python3 -m unittest scripts/test_preflight.py`。 |
| ERR-004 | 文档引用本机其他仓库路径。 | 默认 preflight 不检查；显式 `--check-external-references` 才检查路径存在。 | `python3 -m unittest scripts/test_preflight.py`。 |

## 兼容性或迁移

| 编号 | 要求 | 验证方式 |
| --- | --- | --- |
| MIG-001 | 迁移脚本必须支持 dry-run，不写文件也能报告需要迁移。 | `test_dry_run_reports_without_writing`。 |
| MIG-002 | 迁移脚本不得生成技术设计或计划，只处理 metadata/status/related spec id。 | 代码审查和单元测试。 |

## 可观测性

| 编号 | 事件、日志、指标或告警 | 触发时机 |
| --- | --- | --- |
| OBS-001 | `scripts/migrate_document_contract.py` 输出是否需要迁移。 | 手动运行迁移脚本时。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| NFR-001 | 单元测试 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 任务 1 | 已覆盖 |
| NFR-002 | 单元测试 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py` | 任务 1 | 已覆盖 |
| NFR-003 | 单元测试 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py` | 任务 1 | 已覆盖 |
| NFR-004 | 单元测试 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 任务 1 | 已覆盖 |
| NFR-005 | 单元测试 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 任务 1 | 已覆盖 |
| NFR-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| NFR-007 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| NFR-008 | 单元测试 | `python3 -m unittest scripts/test_document_contract_migration.py` | 任务 3 | 已覆盖 |
| NFR-009 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| NFR-010 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 5 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py` | 任务 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 任务 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 5 | 已覆盖 |
| MIG-001 | 单元测试 | `python3 -m unittest scripts/test_document_contract_migration.py` | 任务 3 | 已覆盖 |
| MIG-002 | 单元测试 | `python3 -m unittest scripts/test_document_contract_migration.py` | 任务 3 | 已覆盖 |
