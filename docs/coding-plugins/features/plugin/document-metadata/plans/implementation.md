---
title: 文档元数据中文展示优化实现计划
status: approved
area: plugin
capability: document-metadata
created: 2026-06-26
updated: 2026-06-26
related_specs:
  - docs/coding-plugins/features/plugin/document-metadata/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/document-metadata/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md
---

# 文档元数据中文展示优化 Implementation Plan

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | document-metadata |
| 规格 | `docs/coding-plugins/features/plugin/document-metadata/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/document-metadata/technical/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** 优化文档 metadata 表达，让 Plan 也具备机器 frontmatter 和中文摘要。

**Architecture:** 保持机器 key 英文稳定，在正文用中文 `文档信息` 表提供人工可读摘要。preflight 同时校验机器 metadata 和中文摘要。

**Tech Stack:** Python 标准库、Markdown 文档、Codex/Claude skills。

**Spec Source:** `docs/coding-plugins/features/plugin/document-metadata/specs/feature.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/document-metadata/technical/technical-design.md`

## Technical Design Snapshot

本计划执行 technical design 中的 metadata 双层模型：frontmatter 保持脚本稳定，中文摘要面向维护者阅读。实现重点是 Plan metadata 校验、中文摘要校验、模板更新和现有 Plan 回填。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_plan_metadata_check_rejects_missing_frontmatter` | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_plan_metadata_check_rejects_mismatched_path_metadata` | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_document_info_check_rejects_missing_chinese_summary` | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-004 | `python3 scripts/preflight.py` | technical template includes `文档信息` | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` / Final verification | Task 2 |
| REQ-005 | `python3 scripts/preflight.py` | plan template includes frontmatter and `文档信息` | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` / Final verification | Task 2 |
| REQ-006 | `python3 scripts/preflight.py` | full preflight passes | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` / Final verification | Task 3 |

## Task 1: Plan metadata and Chinese summary checks

**Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-006, ERR-001, ERR-002, ERR-003, ERR-004

**Files:**
- Modify: `scripts/preflight.py`
- Modify: `scripts/test_preflight.py`

- [x] **Step 1: Write failing tests**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL because Plan metadata and Chinese summary checks do not exist.

- [x] **Step 2: Implement preflight checks**

Add Plan frontmatter validation, path metadata validation and Chinese `文档信息` validation.

- [x] **Step 3: Run tests**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 2: Template and existing Plan updates

**Spec IDs:** REQ-004, REQ-005, AC-001

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/writing-technical-design/templates/technical-design.md`
- Modify: `docs/coding-plugins/features/plugin/technical-design-artifacts/plans/implementation.md`
- Modify: `docs/coding-plugins/features/plugin/document-metadata/plans/implementation.md`

- [x] **Step 1: Update templates**

Add frontmatter and `## 文档信息` to plan template, and add `## 文档信息` to technical design template.

- [x] **Step 2: Backfill existing plans**

Ensure existing plan docs include frontmatter and Chinese summary.

## Task 3: Final verification

**Spec IDs:** AC-002

**Files:**
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: `docs/coding-plugins/INDEX.md`
- Create: `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md`

- [x] **Step 1: Update indexes and evidence**

Add document-metadata rows and record TDD Evidence.

- [x] **Step 2: Run final verification**

Run: `python3 scripts/preflight.py`
Expected: PASS.
