---
title: Spec 与 Technical 质量门禁实现计划
status: approved
feature: spec-technical-quality-gates
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/spec-technical-quality-gates/requirements/feature.md
related_technical:
  - docs/coding-plugins/features/spec-technical-quality-gates/technicals/technical-design.md
related_evidence:
  - docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md
---

# Spec 与 Technical 质量门禁实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | spec-technical-quality-gates |
| 需求文档 | `docs/coding-plugins/features/spec-technical-quality-gates/requirements/feature.md` |
| 技术设计 | `docs/coding-plugins/features/spec-technical-quality-gates/technicals/technical-design.md` |
| TDD 证据 | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 增加 spec 和 technical design 的质量门禁，防止 MUST 规格缺少技术落点。

**架构:** preflight 从 approved spec 提取 MUST ID，并要求 technical 的映射或豁免章节显式处理这些 ID。模板和技能同步更新，现有 technical 文档一次性迁移。

**技术栈:** Python 标准库、Markdown 文档、Codex/Claude skills。

**规格来源:** `docs/coding-plugins/features/spec-technical-quality-gates/requirements/feature.md`

**技术设计来源:** `docs/coding-plugins/features/spec-technical-quality-gates/technicals/technical-design.md`

## 技术设计快照

本计划执行 technical design 中的新增门禁：模板新增 `规格到设计映射` 和 `无需技术设计的规格`，preflight 校验真实 technical 文档的章节、MUST Spec ID 反向覆盖和 related metadata 链路。

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_template_requires_spec_design_mapping_sections` | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_template_requires_spec_design_mapping_sections` | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_design_requires_spec_design_mapping_sections` | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_design_must_cover_required_spec_ids` | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_metadata_requires_related_chain_paths` | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 3 | Task 3 |
| REQ-006 | `python3 scripts/preflight.py` | full preflight validates skill/template/docs | `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md` / Task 4 | Task 4 |

## 任务 1： Technical template and section gates

**规格 ID:** REQ-001, REQ-002, REQ-003, ERR-001, ERR-002, AC-001

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`
- 修改: `skills/writing-technical-design/templates/technical-design.md`
- 修改: `skills/writing-technical-design/SKILL.md`
- 修改: `docs/coding-plugins/features/*/technicals/technical-design.md`

- [x] **步骤 1：Write failing tests from Spec IDs**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because template and technical section checks do not exist.

- [x] **步骤 2：Write minimal implementation after RED**

Add preflight checks for `## 规格到设计映射` and `## 无需技术设计的规格`; update the template and skill.

- [x] **步骤 3：Run test to verify it passes**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 2： MUST Spec ID reverse coverage

**规格 ID:** REQ-004, ERR-003, AC-002

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`
- 修改: `docs/coding-plugins/features/*/technicals/technical-design.md`

- [x] **步骤 1：Write failing tests from Spec IDs**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because MUST Spec ID reverse coverage is not checked.

- [x] **步骤 2：Write minimal implementation after RED**

Extract MUST Spec IDs from approved specs and compare them against technical mapping and exemption sections.

- [x] **步骤 3：Run test to verify it passes**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 3： Technical metadata chain

**规格 ID:** REQ-005, ERR-004, AC-003

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`
- 修改: `docs/coding-plugins/features/*/technicals/technical-design.md`

- [x] **步骤 1：Write failing tests from Spec IDs**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because technical related metadata is not enforced.

- [x] **步骤 2：Write minimal implementation after RED**

Require `related_specs`, `related_plans` and `related_evidence` when the corresponding files exist, and verify referenced paths exist.

- [x] **步骤 3：Run test to verify it passes**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 4： Docs, evidence and final verification

**规格 ID:** REQ-006, ERR-005, AC-001, AC-002, AC-003

**文件:**
- 修改: `docs/workflow-chain.md`
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md`

- [x] **步骤 1：Update workflow documentation**

Document the technical coverage gate and metadata chain.

- [x] **步骤 2：Record TDD 证据**

Write RED/GREEN/REFACTOR evidence into `docs/coding-plugins/features/spec-technical-quality-gates/evidence/tdd-evidence.md`.

- [x] **步骤 3：Run final verification**

运行: `python3 scripts/preflight.py --write-index` and `python3 scripts/preflight.py`.
预期: PASS.
