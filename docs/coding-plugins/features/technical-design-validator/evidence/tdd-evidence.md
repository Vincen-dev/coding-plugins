---
title: Technical Design Validator
status: approved
feature: technical-design-validator
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/technical-design-validator/specs/feature.md
related_technical:
  - docs/coding-plugins/features/technical-design-validator/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/technical-design-validator/plans/implementation.md
---
# Technical Design Validator

## 任务 1： Standalone validator structural checks

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / ERR-001 / ERR-002 / ERR-003 / AC-001
- **RED 测试:** `skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED 失败:** 测试因缺少 `validate_technical_design.py` 报 `ModuleNotFoundError: No module named 'validate_technical_design'`。
- **GREEN 变更:** 新增 `skills/writing-technical-design/scripts/validate_technical_design.py`，实现 technical 文件发现、frontmatter 列表解析、必需章节校验、MUST Spec ID 覆盖和 related metadata 路径校验。
- **GREEN 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **REFACTOR 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **最终验证:** `python3 skills/writing-technical-design/scripts/validate_technical_design.py docs/coding-plugins/features/spec-technical-quality-gates/technical/technical-design.md`，Technical design validation passed: 1 file(s)。

## 任务 2： Generic mapping and stale warnings

### TDD 证据

- **规格/缺陷/验收:** REQ-003 / REQ-004 / ERR-004 / ERR-005 / ERR-006 / AC-002 / AC-003
- **RED 测试:** `skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED 失败:** 同一 RED 测试批次在 validator 缺失时失败，覆盖泛化映射 warning、strict rejection、stale warning、strict stale rejection 和缺少 updated 时跳过 stale 的预期行为。
- **GREEN 变更:** validator 增加泛化映射短语检测和 spec.updated 晚于 technical.updated 的 stale 检测；普通模式记录 warning，`--strict` 模式将 warning 升级为 error。
- **GREEN 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **REFACTOR 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **最终验证:** `python3 skills/writing-technical-design/scripts/validate_technical_design.py --strict --format json`，返回 ok=true、error_count=0、warning_count=0。

## 任务 3： Preflight integration

### TDD 证据

- **规格/缺陷/验收:** REQ-005 / AC-004
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps` and `scripts/test_preflight.py::PreflightTests.test_preflight_uses_technical_design_validator_errors`
- **RED 命令:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_build_commands_include_core_validation_steps` and `python3 -m unittest scripts.test_preflight.PreflightTests.test_preflight_uses_technical_design_validator_errors`
- **RED 失败:** 第一个测试因验证命令中缺少 `test_validate_technical_design.py` 失败；第二个测试因 `preflight.check_technical_design_validator` 不存在报 AttributeError。
- **GREEN 变更:** `scripts/preflight.py` 增加 validator 动态加载和 `check_technical_design_validator(root)`，并把 validator 单测加入 `build_validation_commands()`。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py`，58 tests OK。
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py`，58 tests OK。
- **最终验证:** `python3 -m unittest scripts/test_preflight.py`，58 tests OK。

## 任务 4： Docs, evidence and final verification

### TDD 证据

- **规格/缺陷/验收:** REQ-006 / AC-001 / AC-004
- **RED 测试:** `python3 scripts/preflight.py`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** 文档更新前，writing-technical-design 技能没有提示独立 validator 和 strict 审计命令。
- **GREEN 变更:** 更新 `skills/writing-technical-design/SKILL.md` 和 `docs/workflow-chain.md`，记录 validator 普通模式与 strict 模式用途。
- **GREEN 命令:** `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/features/technical-design-validator/specs/feature.md`，Spec validation passed。
- **REFACTOR 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` 和 `python3 -m unittest scripts/test_preflight.py`，validator 13 tests OK，preflight 58 tests OK。
- **最终验证:** `python3 scripts/preflight.py`，Preflight passed。

## 任务 5： Strict traceability hardening

### TDD 证据

- **规格/缺陷/验收:** REQ-005 / REQ-007 / REQ-008 / REQ-009 / REQ-010 / REQ-011 / ERR-007 / ERR-008 / ERR-009 / ERR-010 / ERR-011 / AC-005
- **RED 测试:** `skills/writing-technical-design/scripts/test_validate_technical_design.py` and `scripts/test_preflight.py`
- **RED 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` and `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** validator 单测新增 4 个失败，分别覆盖旧映射表头、未知 TD ID、缺 lifecycle metadata 和 hidden requirement；preflight 单测新增 2 个失败，分别覆盖 strict 调用和轻量例外追踪表。
- **GREEN 变更:** validator 增加 7 列映射表、TD 决策 ID、lifecycle metadata 和 hidden requirement 校验；preflight 改用 strict validator，并为轻量例外 README 增加 Spec ID 到 Evidence 表校验；历史 technical 和轻量 README 完成迁移。
- **GREEN 命令:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，13 tests OK；`python3 -m unittest scripts/test_preflight.py`，58 tests OK。
- **REFACTOR 命令:** `python3 skills/writing-technical-design/scripts/validate_technical_design.py --strict --format json`，ok=true、error_count=0、warning_count=0。
- **最终验证:** `python3 scripts/preflight.py`，Preflight passed。
