---
title: 下游项目兼容性和证据生命周期 TDD 证据
status: active
feature: downstream-compatibility
created: 2026-07-01
updated: 2026-07-01
related_specs:
  - docs/coding-plugins/features/downstream-compatibility/requirements/downstream-compatibility-PRD.md
related_technical:
  - docs/coding-plugins/features/downstream-compatibility/technicals/downstream-compatibility-TDD.md
related_plans:
  - docs/coding-plugins/features/downstream-compatibility/plans/downstream-compatibility-IPD.md
---

# 下游项目兼容性和证据生命周期 TDD 证据

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | active |
| Feature | downstream-compatibility |

## 任务 1：validator 兼容和测试类型

### TDD 证据

- **规格/缺陷/验收:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005
- **测试类型:** contract
- **RED 测试:** `skills/spec-driven-development/scripts/test_validate_spec.py::test_accepts_scoped_spec_ids_dart_generics_and_implemented_status_alias`; `skills/test-driven-development/scripts/test_validate_tdd_evidence.py::test_accepts_scoped_spec_id_source`; `skills/test-driven-development/scripts/test_validate_tdd_evidence.py::test_rejects_unknown_test_type`; `skills/test-driven-development/scripts/test_validate_tdd_evidence.py::test_strict_rejects_source_scan_for_user_behavior`
- **RED 命令:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py`; `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- **RED 失败:** Spec validator failed on scoped IDs and Dart generics; TDD validator rejected scoped Spec ID evidence and did not reject unknown test type.
- **GREEN 变更:** 扩展 Spec ID 正则，过滤 Dart 泛型 placeholder，上线状态别名，新增 TDD `测试类型` 校验和 source-scan 行为 warning。
- **GREEN 命令:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py`; `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- **REFACTOR 命令:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- **最终验证:** 相关 validator 单测通过。

## 任务 2：active/archive evidence 分离

### TDD 证据

- **规格/缺陷/验收:** NFR-006, NFR-007
- **测试类型:** architecture
- **RED 测试:** `scripts/test_preflight.py::test_collect_tdd_evidence_files_excludes_archived_history`; `scripts/test_preflight.py::test_archived_evidence_metadata_uses_historical_contract`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** active evidence collector included `evidences/archive/*.md` and preflight had no archived evidence metadata checker.
- **GREEN 变更:** `docs_index.feature_evidence_files` 只返回 active `tdd-evidence.md`，新增 archive collector 和 `check_archived_evidence_metadata`。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py`
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_docs_index.py`
- **最终验证:** preflight 相关单测通过。

## 任务 3：文档契约迁移脚本

### TDD 证据

- **规格/缺陷/验收:** NFR-008, MIG-001, MIG-002
- **测试类型:** contract
- **RED 测试:** `scripts/test_document_contract_migration.py`
- **RED 命令:** `python3 -m unittest scripts/test_document_contract_migration.py`
- **RED 失败:** 测试导入失败，`migrate_document_contract.py` 不存在。
- **GREEN 变更:** 新增迁移脚本，支持状态别名归一、`related_specs` 裸 Spec ID 拆分到 `related_spec_ids`、evidence metadata 补齐和 dry-run。
- **GREEN 命令:** `python3 -m unittest scripts/test_document_contract_migration.py`
- **REFACTOR 命令:** `python3 -m unittest scripts/test_document_contract_migration.py`
- **最终验证:** 迁移脚本单测通过。

## 任务 4：状态收敛检查

### TDD 证据

- **规格/缺陷/验收:** NFR-009
- **测试类型:** architecture
- **RED 测试:** `scripts/test_preflight.py::test_lifecycle_state_consistency_rejects_completed_evidence_with_planned_status`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** preflight 没有 `check_lifecycle_state_consistency`。
- **GREEN 变更:** 新增 completed evidence 与 spec traceability 状态一致性检查，并接入默认 preflight。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py`
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py`
- **最终验证:** preflight 单测通过。

## 任务 5：跨仓库引用显式检查

### TDD 证据

- **规格/缺陷/验收:** NFR-010, ERR-004
- **测试类型:** config
- **RED 测试:** `scripts/test_preflight.py::test_external_reference_check_is_explicit_and_rejects_missing_paths`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** preflight 没有 `check_external_references`。
- **GREEN 变更:** 新增 `external_references` 路径检查和 `--check-external-references` 参数，默认 preflight 不启用外部路径检查。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py`
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py`
- **最终验证:** preflight 单测通过。
