---
title: Spec 与 Technical 质量门禁实现计划
status: approved
area: plugin
capability: spec-technical-quality-gates
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/spec-technical-quality-gates/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/spec-technical-quality-gates/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md
---

# Spec 与 Technical 质量门禁实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | spec-technical-quality-gates |
| 规格 | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/technical/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** 增加 spec 和 technical design 的质量门禁，防止 MUST 规格缺少技术落点。

**Architecture:** preflight 从 approved spec 提取 MUST ID，并要求 technical 的映射或豁免章节显式处理这些 ID。模板和技能同步更新，现有 technical 文档一次性迁移。

**Tech Stack:** Python 标准库、Markdown 文档、Codex/Claude skills。

**Spec Source:** `docs/coding-plugins/features/plugin/spec-technical-quality-gates/specs/feature.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/spec-technical-quality-gates/technical/technical-design.md`

## Technical Design Snapshot

本计划执行 technical design 中的新增门禁：模板新增 `规格到设计映射` 和 `无需技术设计的规格`，preflight 校验真实 technical 文档的章节、MUST Spec ID 反向覆盖和 related metadata 链路。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_template_requires_spec_design_mapping_sections` | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_template_requires_spec_design_mapping_sections` | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_design_requires_spec_design_mapping_sections` | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_design_must_cover_required_spec_ids` | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_metadata_requires_related_chain_paths` | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 3 | Task 3 |
| REQ-006 | `python3 scripts/preflight.py` | full preflight validates skill/template/docs | `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 4 | Task 4 |

## Task 1: Technical template and section gates

**Spec IDs:** REQ-001, REQ-002, REQ-003, ERR-001, ERR-002, AC-001

**Files:**
- Modify: `scripts/test_preflight.py`
- Modify: `scripts/preflight.py`
- Modify: `skills/writing-technical-design/templates/technical-design.md`
- Modify: `skills/writing-technical-design/SKILL.md`
- Modify: `docs/coding-plugins/features/plugin/*/technical/technical-design.md`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL because template and technical section checks do not exist.

- [x] **Step 2: Write minimal implementation after RED**

Add preflight checks for `## 规格到设计映射` and `## 无需技术设计的规格`; update the template and skill.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 2: MUST Spec ID reverse coverage

**Spec IDs:** REQ-004, ERR-003, AC-002

**Files:**
- Modify: `scripts/test_preflight.py`
- Modify: `scripts/preflight.py`
- Modify: `docs/coding-plugins/features/plugin/*/technical/technical-design.md`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL because MUST Spec ID reverse coverage is not checked.

- [x] **Step 2: Write minimal implementation after RED**

Extract MUST Spec IDs from approved specs and compare them against technical mapping and exemption sections.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 3: Technical metadata chain

**Spec IDs:** REQ-005, ERR-004, AC-003

**Files:**
- Modify: `scripts/test_preflight.py`
- Modify: `scripts/preflight.py`
- Modify: `docs/coding-plugins/features/plugin/*/technical/technical-design.md`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL because technical related metadata is not enforced.

- [x] **Step 2: Write minimal implementation after RED**

Require `related_specs`, `related_plans` and `related_evidence` when the corresponding files exist, and verify referenced paths exist.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 4: Docs, evidence and final verification

**Spec IDs:** REQ-006, ERR-005, AC-001, AC-002, AC-003

**Files:**
- Modify: `docs/workflow-chain.md`
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md`

- [x] **Step 1: Update workflow documentation**

Document the technical coverage gate and metadata chain.

- [x] **Step 2: Record TDD Evidence**

Write RED/GREEN/REFACTOR evidence into `docs/coding-plugins/features/plugin/spec-technical-quality-gates/evidence/tdd-evidence.md`.

- [x] **Step 3: Run final verification**

Run: `python3 scripts/preflight.py --write-index` and `python3 scripts/preflight.py`.
Expected: PASS.
