---
title: Technical Design Validator 实现计划
status: approved
area: plugin
capability: technical-design-validator
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/technical-design-validator/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/technical-design-validator/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md
---

# Technical Design Validator 实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | technical-design-validator |
| 规格 | `docs/coding-plugins/features/plugin/technical-design-validator/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/technical-design-validator/technical/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** 增加独立 technical design validator，并让它支持泛化映射 warning、stale warning 和 strict 审计。

**Architecture:** validator 位于 `skills/writing-technical-design/scripts/`，直接读取 feature-first 文档链路。preflight 通过非 strict 入口复用 validator 的错误检查，并继续运行 validator 单测。

**Tech Stack:** Python 标准库、Markdown 文档、unittest、现有 `scripts/docs_index.py`。

**Spec Source:** `docs/coding-plugins/features/plugin/technical-design-validator/specs/feature.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/technical-design-validator/technical/technical-design.md`

## Technical Design Snapshot

validator 负责 technical 文档校验，输出结构化 errors 和 warnings。普通模式只让 errors 决定退出码；strict 模式把 warnings 也视为失败。preflight 接入普通模式，保持当前仓库历史 technical 不被泛化映射 warning 阻断。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_cli_validates_repository_technical_docs` | `docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-002 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_rejects_missing_required_sections`, `test_validator_rejects_missing_must_spec_mapping`, `test_validator_rejects_missing_related_metadata_path` | 同上 | Task 1 |
| REQ-003 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_warns_about_generic_mapping`, `test_strict_validator_rejects_generic_mapping` | 同上 | Task 2 |
| REQ-004 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_warns_when_spec_is_newer_than_technical`, `test_strict_validator_rejects_stale_technical` | 同上 | Task 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_build_commands_include_core_validation_steps` includes validator tests | 同上 | Task 3 |
| REQ-006 | `python3 scripts/preflight.py` | skill and docs validation pass | 同上 | Task 4 |

## Task 1: Standalone validator structural checks

**Spec IDs:** REQ-001, REQ-002, ERR-001, ERR-002, ERR-003, AC-001

**Files:**
- Create: `skills/writing-technical-design/scripts/validate_technical_design.py`
- Create: `skills/writing-technical-design/scripts/test_validate_technical_design.py`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
Expected: FAIL because the validator module does not exist.

- [x] **Step 2: Write minimal implementation after RED**

Implement technical file discovery, frontmatter parsing, required section checks, MUST Spec ID coverage and related metadata path validation.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
Expected: PASS.

## Task 2: Generic mapping and stale warnings

**Spec IDs:** REQ-003, REQ-004, ERR-004, ERR-005, ERR-006, AC-002, AC-003

**Files:**
- Modify: `skills/writing-technical-design/scripts/validate_technical_design.py`
- Modify: `skills/writing-technical-design/scripts/test_validate_technical_design.py`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
Expected: FAIL for missing generic mapping and stale warning behavior.

- [x] **Step 2: Write minimal implementation after RED**

Detect generic mapping phrases and spec.updated later than technical.updated. Keep warnings non-fatal unless `strict=True` or `--strict` is used.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
Expected: PASS.

## Task 3: Preflight integration

**Spec IDs:** REQ-005, AC-004

**Files:**
- Modify: `scripts/preflight.py`
- Modify: `scripts/test_preflight.py`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL until validator tests are included in preflight validation commands or validator errors are wired.

- [x] **Step 2: Write minimal implementation after RED**

Load or execute validator in non strict mode from preflight and include `skills/writing-technical-design/scripts/test_validate_technical_design.py` in validation commands.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 4: Docs, evidence and final verification

**Spec IDs:** REQ-006, AC-001, AC-004

**Files:**
- Modify: `skills/writing-technical-design/SKILL.md`
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: `docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md`

- [x] **Step 1: Update writing-technical-design guidance**

Document standalone validator and strict mode audit command.

- [x] **Step 2: Record TDD Evidence**

Write RED/GREEN/REFACTOR evidence into `docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md`.

- [x] **Step 3: Run final verification**

Run: `python3 scripts/preflight.py --write-index` and `python3 scripts/preflight.py`.
Expected: PASS.
