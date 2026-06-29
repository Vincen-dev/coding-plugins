---
title: Coding Plugins 产物总索引生成器实现计划
status: approved
area: plugin
capability: artifact-index
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/artifact-index/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/artifact-index/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md
---

# Coding Plugins 产物总索引生成器 Implementation Plan

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | artifact-index |
| 规格 | `docs/coding-plugins/features/plugin/artifact-index/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/artifact-index/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [x]`) 语法追踪。

**Goal:** 让 `docs/coding-plugins/INDEX.md` 由 feature-first 文件树确定性生成，并在 preflight 中拒绝索引漂移。

**Architecture:** `scripts/preflight.py` 继续作为发布前入口，内部新增索引渲染函数和 `--write-index` 参数。生成器只使用 Python 标准库和当前 feature root 文档，不依赖 Git、mtime 或网络。

**Tech Stack:** Python 标准库、Markdown、unittest、Codex/Claude plugin docs。

**Spec Source:** `docs/coding-plugins/features/plugin/artifact-index/specs/feature.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/artifact-index/technical-design.md`

## Technical Design Snapshot

本计划执行 `technical-design.md` 中的确定性索引生成方案。关键路径是先用 RED 测试固定渲染输出和漂移校验，再在 `preflight.py` 中复用 feature root collector 实现生成器，最后用 `--write-index` 刷新真实索引并记录 TDD Evidence。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 scripts/preflight.py` | existing artifact index exists | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Final verification | Task 3 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_expected_headers` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_spec_paths` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_plan_paths` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_evidence_paths` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| REQ-006 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_includes_feature_metadata_and_documents` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| REQ-007 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_generated_content_match` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| REQ-008 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_sorts_rows_and_joins_multiple_files` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| ERR-004 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_handles_missing_tags` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| ERR-005 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_handles_missing_updated_metadata` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| AC-003 | `python3 scripts/preflight.py --write-index` | rewrites `docs/coding-plugins/INDEX.md` before checks | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` / Final verification | Task 3 |

## Task 1: 保留总索引覆盖校验基线

**Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, ERR-001, ERR-002, ERR-003

**Files:**
- Existing: `scripts/test_preflight.py`
- Existing: `scripts/preflight.py`

- [x] **Step 1: Run existing baseline tests**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS，确认已有路径覆盖校验仍然可用。

## Task 2: 生成器和漂移校验

**Spec IDs:** REQ-006, REQ-007, REQ-008, ERR-004, ERR-005

**Files:**
- Modify: `scripts/test_preflight.py`
- Modify: `scripts/preflight.py`

- [x] **Step 1: Write failing tests from Spec IDs**

Add tests for `render_artifact_index()` output, stable sorting, multi-file `<br>` joining, missing tags fallback, missing updated fallback and generated-content mismatch.

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL with `AttributeError: module 'preflight' has no attribute 'render_artifact_index'` and one drift test failing because `check_artifact_index_covers_documents()` does not reject content mismatch.

- [x] **Step 2: Write minimal implementation after RED**

Implement README metadata parsing, feature document collection helpers, Markdown path cell rendering, `render_artifact_index()`, `write_artifact_index()` and generated-content comparison inside `check_artifact_index_covers_documents()`.

- [x] **Step 3: Run GREEN tests**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 3: Refresh index, docs and evidence

**Spec IDs:** AC-001, AC-002, AC-003

**Files:**
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: `docs/coding-plugins/features/plugin/artifact-index/README.md`
- Modify: `docs/coding-plugins/features/plugin/artifact-index/specs/feature.md`
- Create: `docs/coding-plugins/features/plugin/artifact-index/technical-design.md`
- Create: `docs/coding-plugins/features/plugin/artifact-index/implementation.md`
- Modify: `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md`

- [x] **Step 1: Update feature docs**

Update the spec, README, technical design and implementation plan so the feature root describes the generator workflow.

- [x] **Step 2: Rewrite generated index**

Run: `python3 scripts/preflight.py --write-index`
Expected: rewrites `docs/coding-plugins/INDEX.md` and then passes full preflight.

- [x] **Step 3: Record final TDD Evidence**

Update `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` with RED/GREEN/REFACTOR and final verification output.
