---
title: Coding Plugins 产物总索引生成器实现计划
status: approved
feature: artifact-index
doc_id: artifact-index
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/artifact-index/requirements/artifact-index-PRD.md
related_technical:
  - docs/coding-plugins/features/artifact-index/technicals/artifact-index-TDD.md
related_evidence:
  - docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md
---

# Coding Plugins 产物总索引生成器 实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | artifact-index |
| 需求文档 | `docs/coding-plugins/features/artifact-index/requirements/artifact-index-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/artifact-index/technicals/artifact-index-TDD.md` |
| TDD 证据 | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [x]`) 语法追踪。

**目标:** 让 `docs/coding-plugins/INDEX.md` 由 feature-first 文件树确定性生成，并在 preflight 中拒绝索引漂移。

**架构:** `scripts/preflight.py` 继续作为发布前入口，内部新增索引渲染函数和 `--write-index` 参数。生成器只使用 Python 标准库和当前 feature root 文档，不依赖 Git、mtime 或网络。

**技术栈:** Python 标准库、Markdown、unittest、Codex/Claude plugin docs。

**规格来源:** `docs/coding-plugins/features/artifact-index/requirements/artifact-index-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/artifact-index/technicals/artifact-index-TDD.md`

## 技术设计快照

本计划执行 `technicals/<feature-name>-TDD.md` 中的确定性索引生成方案。关键路径是先用 RED 测试固定渲染输出和漂移校验，再在 `preflight.py` 中复用 feature root collector 实现生成器，最后用 `--write-index` 刷新真实索引并记录 TDD 证据。

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 scripts/preflight.py` | existing artifact index exists | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / 最终验证 | Task 3 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_expected_headers` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 1 | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_spec_paths` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 1 | Task 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_plan_paths` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 1 | Task 1 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_evidence_paths` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 1 | Task 1 |
| REQ-006 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_includes_feature_metadata_and_documents` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 2 | Task 2 |
| REQ-007 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_generated_content_match` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 2 | Task 2 |
| REQ-008 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_sorts_rows_and_joins_multiple_files` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 2 | Task 2 |
| ERR-004 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_handles_missing_tags` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 2 | Task 2 |
| ERR-005 | `python3 -m unittest scripts/test_preflight.py` | `test_render_artifact_index_handles_missing_updated_metadata` | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / Task 2 | Task 2 |
| AC-003 | `python3 scripts/preflight.py --write-index` | rewrites `docs/coding-plugins/INDEX.md` before checks | `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` / 最终验证 | Task 3 |

## 任务 1： 保留总索引覆盖校验基线

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, ERR-001, ERR-002, ERR-003

**文件:**
- Existing: `scripts/test_preflight.py`
- Existing: `scripts/preflight.py`

- [x] **步骤 1：Run existing baseline tests**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS，确认已有路径覆盖校验仍然可用。

## 任务 2： 生成器和漂移校验

**规格 ID:** REQ-006, REQ-007, REQ-008, ERR-004, ERR-005

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`

- [x] **步骤 1：Write failing tests from Spec IDs**

Add tests for `render_artifact_index()` output, stable sorting, multi-file `<br>` joining, missing tags fallback, missing updated fallback and generated-content mismatch.

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL with `AttributeError: module 'preflight' has no attribute 'render_artifact_index'` and one drift test failing because `check_artifact_index_covers_documents()` does not reject content mismatch.

- [x] **步骤 2：Write minimal implementation after RED**

Implement README metadata parsing, feature document collection helpers, Markdown path cell rendering, `render_artifact_index()`, `write_artifact_index()` and generated-content comparison inside `check_artifact_index_covers_documents()`.

- [x] **步骤 3：Run GREEN tests**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 3： Refresh index, docs and evidence

**规格 ID:** AC-001, AC-002, AC-003

**文件:**
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: `docs/coding-plugins/features/artifact-index/README.md`
- 修改: `docs/coding-plugins/features/artifact-index/requirements/artifact-index-PRD.md`
- 创建: `docs/coding-plugins/features/artifact-index/technicals/artifact-index-TDD.md`
- 创建: `docs/coding-plugins/features/artifact-index/plans/artifact-index-IPD.md`
- 修改: `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md`

- [x] **步骤 1：Update feature docs**

Update the spec, README, technical design and implementation plan so the feature root describes the generator workflow.

- [x] **步骤 2：Rewrite generated index**

运行: `python3 scripts/preflight.py --write-index`
预期: rewrites `docs/coding-plugins/INDEX.md` and then passes full preflight.

- [x] **步骤 3：Record final TDD 证据**

Update `docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md` with RED/GREEN/REFACTOR and final verification output.
