---
title: Feature-first 文档结构迁移实现计划
status: approved
feature: feature-first-docs
created: 2026-06-26
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/feature-first-docs/requirements/feature-first-docs-PRD.md
related_technical:
  - docs/coding-plugins/features/feature-first-docs/technicals/feature-first-docs-TDD.md
related_evidence:
  - docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md
---

# Feature-first 文档结构迁移 实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | feature-first-docs |
| 需求文档 | `docs/coding-plugins/features/feature-first-docs/requirements/feature-first-docs-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/feature-first-docs/technicals/feature-first-docs-TDD.md` |
| TDD 证据 | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [x]`) 语法追踪。

**目标:** 将 `docs/coding-plugins` 迁移到 feature-first 文档结构，并去除 feature root 下裸露的技术设计和实现计划文件。

**架构:** `features/<feature-name>` 成为唯一活跃文档根。规格、技术设计、计划和证据分别落到 `requirements/`、`technicals/`、`plans/` 和 `evidences/` 子目录。preflight 从 feature root 派生文档集合，并拒绝旧四类目录残留和 flat feature-root 技术/计划文件。

**技术栈:** Python 标准库、Markdown、Codex/Claude plugin manifests 和 skills。

**规格来源:** `docs/coding-plugins/features/feature-first-docs/requirements/feature-first-docs-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/feature-first-docs/technicals/feature-first-docs-TDD.md`

## 技术设计快照

本计划执行 feature-first 技术设计：集中 feature 文档、移除旧产物类型根、保留单一总索引。核心改动是先用单元测试固定新路径契约，再改 preflight collector，最后移动文档并更新所有活跃路径引用。

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| NFR-001 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_spec_files_uses_feature_first_path` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| NFR-002 | `python3 -m unittest scripts/test_preflight.py` | spec collector returns `features/.../requirements/<feature-name>-PRD.md` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| NFR-003 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_technical_design_files_uses_feature_first_technical_subdir` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| NFR-004 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_plan_files_uses_feature_first_plans_subdir` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| NFR-005 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_tdd_evidence_files_uses_feature_first_path` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| NFR-006 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_roots_require_readme` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| NFR-007 | `python3 scripts/preflight.py` | total index covers feature roots and documents | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 最终验证 | 任务 3 |
| NFR-008 | `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests` | no active old default paths | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 最终验证 | 任务 4 |
| NFR-009 | `python3 -m unittest scripts/test_preflight.py` | `test_flat_feature_root_technical_and_plan_files_are_rejected` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 6 | 任务 6 |
| ERR-001 | `python3 -m unittest scripts/test_preflight.py` | `test_legacy_docs_roots_are_rejected` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| ERR-002 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_roots_require_readme` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| ERR-003 | `python3 -m unittest scripts/test_preflight.py` | metadata mismatch tests | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 1 | 任务 1 |
| ERR-004 | `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests` | no active old path references | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 最终验证 | 任务 4 |
| ERR-005 | `python3 scripts/preflight.py` | existing Spec ID checks still pass | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 最终验证 | 任务 5 |
| ERR-006 | `python3 -m unittest scripts/test_preflight.py` | flat feature root document is rejected | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 6 | 任务 6 |
| MIG-001 | `git status --short` | moved docs under `features/` | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 2 | 任务 2 |
| MIG-002 | `python3 -m unittest scripts/test_preflight.py` | legacy root rejection | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 2 | 任务 2 |
| MIG-003 | `python3 scripts/preflight.py` | all references and docs pass | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 最终验证 | 任务 4 |
| MIG-004 | `find docs/coding-plugins/features -maxdepth 3 -type f \( -name technical-design-document.md -o -name implementation.md \) -print` | no flat feature root technical/plan files | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` / 任务 6 | 任务 6 |

## 任务 1： Preflight feature-first contract

**规格 ID:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, NFR-006, ERR-001, ERR-002, ERR-003

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`

- [x] **步骤 1：Write failing tests**

Add tests for feature-first collector paths, required feature README, legacy root rejection and metadata/path matching.

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because current preflight still scans old four docs roots.

- [x] **步骤 2：Implement collector and static checks**

Refactor preflight to collect docs from `docs/coding-plugins/features/<feature-name>/`, require README, reject old roots and validate metadata against feature root path.

- [x] **步骤 3：Run tests**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 2： Move existing documents

**规格 ID:** MIG-001, MIG-002, ERR-001

**文件:**
- Move: legacy spec files into `docs/coding-plugins/features/*/requirements/`
- Move: legacy technical design files into `docs/coding-plugins/features/*/technicals/*-TDD.md`
- Move: legacy implementation plans into `docs/coding-plugins/features/*/plans/*-IPD.md`
- Move: legacy TDD 证据 files into `docs/coding-plugins/features/*/evidences/`
- Delete: `docs/coding-plugins/INDEX.md`
- Delete: `docs/coding-plugins/INDEX.md`
- 创建: `docs/coding-plugins/features/*/README.md`

- [x] **步骤 1：Move docs into feature roots**

Use `git mv` or equivalent file moves so each feature owns its complete chain.

- [x] **步骤 2：Create README files**

Create a short README per feature root with document links, status, tags and related code where known.

- [x] **步骤 3：Run legacy path test**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 3： Rebuild indexes and cross references

**规格 ID:** NFR-007, ERR-005

**文件:**
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: moved docs under `docs/coding-plugins/features/**`

- [x] **步骤 1：Rebuild total index**

Update total index to include `功能根目录`、`规格`、`技术设计`、`实现计划`、`证据`、`标签` 和 `更新日期`.

- [x] **步骤 2：Replace moved document cross references**

Replace old paths inside moved specs, technical designs, plans and evidence with new feature-first paths.

- [x] **步骤 3：Run preflight**

运行: `python3 scripts/preflight.py`
预期: PASS after all active references are updated.

## 任务 4： Update skills, templates and user docs

**规格 ID:** NFR-008, ERR-004, MIG-003

**文件:**
- 修改: `README.md`
- 修改: `docs/installation.md`
- 修改: `docs/workflow-chain.md`
- 修改: `skills/spec-driven-development/SKILL.md`
- 修改: `skills/spec-driven-development/references/*.md`
- 修改: `skills/spec-driven-development/templates/*.md`
- 修改: `skills/writing-technicals/SKILL.md`
- 修改: `skills/writing-technicals/templates/technical-design-document.md`
- 修改: `skills/writing-plans/SKILL.md`
- 修改: `skills/test-driven-development/SKILL.md`

- [x] **步骤 1：Update active path guidance**

Replace old default paths with feature-first paths.

- [x] **步骤 2：Run old path scan**

运行: `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests`
预期: only allowed migration history or release notes references remain.

## 任务 5： 最终验证 and release

**规格 ID:** OBS-001, ERR-005

**文件:**
- 修改: `.codex-plugin/plugin.json`
- 修改: `.claude-plugin/plugin.json`
- 修改: `.version-bump.json`
- 修改: `RELEASE-NOTES.md`
- 修改: `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md`

- [x] **步骤 1：Record TDD 证据**

Write RED/GREEN/REFACTOR and final verification evidence.

- [x] **步骤 2：Run full verification**

运行:

```bash
python3 scripts/preflight.py
git diff --check
claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict
```

预期: all PASS.

- [x] **步骤 3：Commit, bump version, reinstall and push**

Create Chinese Conventional Commit with `Authored-by: Vincen <hx001007@gmail.com>`, bump patch version, run verification again, install personal plugin and push.

## 任务 6： Remove flat feature-root technical and plan files

**规格 ID:** NFR-003, NFR-004, NFR-009, ERR-006, MIG-004

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`
- Move: legacy flat feature-root technical design files into `docs/coding-plugins/features/*/technicals/*-TDD.md`
- Move: legacy flat feature-root implementation plan files into `docs/coding-plugins/features/*/plans/*-IPD.md`
- 修改: `docs/coding-plugins/features/**`
- 修改: `skills/**`

- [x] **步骤 1：Write failing tests**

Add tests that collectors only accept `technicals/<feature-name>-TDD.md` and `plans/<feature-name>-IPD.md`, and that flat feature-root `technical-design-document.md` or `implementation.md` fails preflight.

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because collectors still expect flat feature-root files and the flat-root rejection check does not exist.

- [x] **步骤 2：Implement nested collectors and reject flat files**

Update preflight collectors, index rendering, plan/source validation and static checks to use `technical/` and `plans/` subdirectories.

- [x] **步骤 3：Migrate docs and references**

Move all existing flat feature-root technical and plan files into the new subdirectories, then update active README、workflow、skill、spec、technical、plan 和 evidence 引用。

- [x] **步骤 4：Run final verification and release**

Run `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`、`git diff --check`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`，确认无旧 flat feature-root 文件残留，然后 bump patch version、重装本地插件并提交推送。
