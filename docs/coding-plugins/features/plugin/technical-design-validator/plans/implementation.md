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

**Goal:** 增加独立 technical design validator，并让它支持泛化映射 warning、stale warning、strict 发布门禁、TD 决策 ID、lifecycle metadata、隐藏需求拦截和轻量例外追踪。

**Architecture:** validator 位于 `skills/writing-technical-design/scripts/`，直接读取 feature-first 文档链路。preflight 通过 strict 入口复用 validator 的错误检查，并继续运行 validator 单测；README 轻量例外追踪由 preflight 的 feature chain closure 检查负责。

**Tech Stack:** Python 标准库、Markdown 文档、unittest、现有 `scripts/docs_index.py`。

**Spec Source:** `docs/coding-plugins/features/plugin/technical-design-validator/specs/feature.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/technical-design-validator/technical/technical-design.md`

## Technical Design Snapshot

validator 负责 technical 文档校验，输出结构化 errors 和 warnings。普通模式只让 errors 决定退出码；strict 模式把 warnings 也视为失败。preflight 接入 strict 模式，确保发布前不能残留泛化映射、stale technical、旧映射表头、缺 TD ID、缺 lifecycle metadata 或隐藏需求。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_cli_validates_repository_technical_docs` | `docs/coding-plugins/features/plugin/technical-design-validator/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-002 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_rejects_missing_required_sections`, `test_validator_rejects_missing_must_spec_mapping`, `test_validator_rejects_missing_related_metadata_path` | 同上 | Task 1 |
| REQ-003 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_warns_about_generic_mapping`, `test_strict_validator_rejects_generic_mapping` | 同上 | Task 2 |
| REQ-004 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_warns_when_spec_is_newer_than_technical`, `test_strict_validator_rejects_stale_technical` | 同上 | Task 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_preflight_runs_technical_design_validator_in_strict_mode` | 同上 | Task 3 / Task 5 |
| REQ-006 | `python3 scripts/preflight.py` | skill and docs validation pass | 同上 | Task 4 / Task 5 |
| REQ-007 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_rejects_legacy_mapping_header` | 同上 | Task 5 |
| REQ-008 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_rejects_mapping_without_existing_decision_id` | 同上 | Task 5 |
| REQ-009 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_rejects_missing_lifecycle_metadata` | 同上 | Task 5 |
| REQ-010 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | `test_validator_rejects_hidden_requirement_without_spec_reference` | 同上 | Task 5 |
| REQ-011 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_document_chain_requires_plan_or_lightweight_exception` | 同上 | Task 5 |

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

Load validator in strict mode from preflight and include `skills/writing-technical-design/scripts/test_validate_technical_design.py` in validation commands.

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

## Task 5: Strict traceability hardening

**Spec IDs:** REQ-005, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, ERR-007, ERR-008, ERR-009, ERR-010, ERR-011, AC-005

**Files:**
- Modify: `skills/writing-technical-design/scripts/validate_technical_design.py`
- Modify: `skills/writing-technical-design/scripts/test_validate_technical_design.py`
- Modify: `scripts/preflight.py`
- Modify: `scripts/test_preflight.py`
- Modify: `skills/writing-technical-design/templates/technical-design.md`
- Modify: `skills/writing-technical-design/SKILL.md`
- Modify: `docs/coding-plugins/features/plugin/*/technical/technical-design.md`
- Modify: `docs/coding-plugins/features/plugin/*/README.md`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` and `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL for missing legacy mapping header rejection, unknown TD ID rejection, lifecycle metadata rejection, hidden requirement rejection, preflight strict invocation and lightweight exception traceability.

- [x] **Step 2: Write minimal implementation after RED**

Implement validator checks for 7-column mapping schema, `TD-xxx` references, lifecycle metadata and hidden requirements. Switch preflight to strict validator and add lightweight exception `Spec ID -> Evidence` checks.

- [x] **Step 3: Migrate historical documents**

Update historical technical docs, template, skill docs and lightweight README files so strict validator returns zero errors and zero warnings.

- [x] **Step 4: Run verification**

Run: `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`, `python3 -m unittest scripts/test_preflight.py`, `python3 skills/writing-technical-design/scripts/validate_technical_design.py --strict --format json`, and `python3 scripts/preflight.py`.
Expected: PASS, and strict validator reports `ok=true`, `error_count=0`, `warning_count=0`.
