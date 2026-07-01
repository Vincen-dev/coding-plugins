---
title: 技术设计产物独立维护实现计划
status: approved
feature: technical-design-artifacts
created: 2026-06-26
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/technical-design-artifacts/specs/feature.md
related_technical:
  - docs/coding-plugins/features/technical-design-artifacts/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md
---

# 技术设计产物独立维护 实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | technical-design-artifacts |
| 规格 | `docs/coding-plugins/features/technical-design-artifacts/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/technical-design-artifacts/technical/technical-design.md` |
| TDD 证据 | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 将技术设计作为独立产物层落地，并通过 preflight 维护引用链路。

**架构:** Spec 定义契约，技术设计 定义工程方案，Plan 拆任务，证据 记录 TDD 证据。preflight 负责校验真实文件、索引和 Spec ID 追踪。

**技术栈:** Python 标准库、Markdown 文档、Codex/Claude skills。

**规格来源:** `docs/coding-plugins/features/technical-design-artifacts/specs/feature.md`

**技术设计来源:** `docs/coding-plugins/features/technical-design-artifacts/technical/technical-design.md`

## 技术设计快照

本计划执行 technical design 中的四层链路：Spec -> Technical -> Plan -> 证据。实现重点是新增 `writing-technical-design` skill、technical 索引、总索引 `Technical` 列，以及 preflight 引用校验。

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_technical_design_files_uses_feature_first_technical_subdir` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_index_requires_design_paths` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_technical_paths` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-004 | `python3 -m unittest tests.behavior.test_routing` | `test_using_entry_routes_development_intents_to_required_skills` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_plan_technical_design_source_check_rejects_missing_source` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 2 |
| REQ-006 | `python3 -m unittest scripts/test_preflight.py` | technical preflight unit tests | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-007 | `python3 -m unittest tests.behavior.test_routing` | `test_claude_reference_documents_explicit_namespace_for_each_skill` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 2 |
| REQ-008 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_design_gap_review_requires_section`, `test_technical_design_gap_review_rejects_unresolved_gap` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / 任务 4 | 任务 4 |
| REQ-009 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_template_check_rejects_english_headings` | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / 任务 4 | 任务 4 |
| REQ-010 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_design_gap_review_requires_section` plus full preflight | `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md` / 任务 4 | 任务 4 |

## 任务 1： Technical document and preflight support

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-006, ERR-001, ERR-002, ERR-003, ERR-004, ERR-005

**文件:**
- 创建: `docs/coding-plugins/INDEX.md`
- 创建: `docs/coding-plugins/features/technical-design-artifacts/technical/technical-design.md`
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`

- [x] **步骤 1：Write failing tests from Spec IDs**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because technical collection, index and reference checks do not exist.

- [x] **步骤 2：Write minimal implementation after RED**

Add technical file collection, index coverage, Spec/Plan technical reference checks and technical Spec ID validation.

- [x] **步骤 3：Run test to verify it passes**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 2： Skill and workflow routing

**规格 ID:** REQ-004, REQ-005, REQ-007, AC-002

**文件:**
- 创建: `skills/writing-technical-design/SKILL.md`
- 创建: `skills/writing-technical-design/agents/openai.yaml`
- 创建: `skills/writing-technical-design/templates/technical-design.md`
- 修改: `skills/using-coding-plugins/SKILL.md`
- 修改: `skills/writing-plans/SKILL.md`
- 修改: `skills/using-coding-plugins/references/claude-tools.md`
- 修改: `tests/behavior/test_routing.py`

- [x] **步骤 1：Write failing behavior test**

运行: `python3 -m unittest tests.behavior.test_routing`
预期: FAIL because `writing-technical-design` is not routed.

- [x] **步骤 2：Add skill and route it**

Add the skill, OpenAI metadata, template, entry routing and Claude namespace reference.

- [x] **步骤 3：Run behavior test to verify it passes**

运行: `python3 -m unittest tests.behavior.test_routing`
预期: PASS.

## 任务 3： Workflow docs, evidence and final verification

**规格 ID:** AC-001, AC-003

**文件:**
- 修改: `README.md`
- 修改: `docs/installation.md`
- 修改: `docs/workflow-chain.md`
- 创建: `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md`

- [x] **步骤 1：Update workflow documentation**

Document the Spec -> Technical -> Plan -> 证据 chain and default paths.

- [x] **步骤 2：Record TDD 证据**

Write `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md`.

- [x] **步骤 3：Run final verification**

运行: `python3 scripts/preflight.py`
预期: PASS.

## 任务 4： Technical gap gate and Chinese template

**规格 ID:** REQ-008, REQ-009, REQ-010, ERR-006, ERR-007, ERR-008, AC-004

**文件:**
- 修改: `skills/writing-technical-design/SKILL.md`
- 修改: `skills/writing-technical-design/templates/technical-design.md`
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`
- 修改: `docs/coding-plugins/features/*/technical/technical-design.md`
- 修改: `docs/workflow-chain.md`
- 修改: `docs/coding-plugins/features/technical-design-artifacts/evidence/tdd-evidence.md`

- [x] **步骤 1：Write failing tests from Spec IDs**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because technical template Chinese heading checks and technical spec gap review checks do not exist.

- [x] **步骤 2：Write minimal implementation after RED**

Add preflight checks for Chinese technical template structure and `## 规格缺口审查`; update the technical design skill, template and existing technical docs.

- [x] **步骤 3：Run test to verify it passes**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.
