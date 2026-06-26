---
title: Feature-first 文档结构迁移实现计划
status: approved
area: plugin
capability: feature-first-docs
created: 2026-06-26
updated: 2026-06-26
related_specs:
  - docs/coding-plugins/features/plugin/feature-first-docs/specs/maintenance.md
related_technical:
  - docs/coding-plugins/features/plugin/feature-first-docs/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md
---

# Feature-first 文档结构迁移 Implementation Plan

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | feature-first-docs |
| 规格 | `docs/coding-plugins/features/plugin/feature-first-docs/specs/maintenance.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/feature-first-docs/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [x]`) 语法追踪。

**Goal:** 将 `docs/coding-plugins` 迁移到 feature-first 文档结构。

**Architecture:** `features/<area>/<capability>` 成为唯一活跃文档根。preflight 从 feature root 派生文档集合，并拒绝旧四类目录残留。

**Tech Stack:** Python 标准库、Markdown、Codex/Claude plugin manifests 和 skills。

**Spec Source:** `docs/coding-plugins/features/plugin/feature-first-docs/specs/maintenance.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/feature-first-docs/technical-design.md`

## Technical Design Snapshot

本计划执行 feature-first 技术设计：集中 capability 文档、移除旧产物类型根、保留单一总索引。核心改动是先用单元测试固定新路径契约，再改 preflight collector，最后移动文档并更新所有活跃路径引用。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| NFR-001 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_spec_files_uses_feature_first_path` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-002 | `python3 -m unittest scripts/test_preflight.py` | spec collector returns `features/.../specs/feature.md` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-003 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_technical_design_files_uses_feature_first_path` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-004 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_plan_files_uses_feature_first_path` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-005 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_tdd_evidence_files_uses_feature_first_path` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-006 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_roots_require_readme` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-007 | `python3 scripts/preflight.py` | total index covers feature roots and documents | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Final verification | Task 3 |
| NFR-008 | `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests` | no active old default paths | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Final verification | Task 4 |
| ERR-001 | `python3 -m unittest scripts/test_preflight.py` | `test_legacy_docs_roots_are_rejected` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| ERR-002 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_roots_require_readme` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| ERR-003 | `python3 -m unittest scripts/test_preflight.py` | metadata mismatch tests | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| ERR-004 | `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests` | no active old path references | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Final verification | Task 4 |
| ERR-005 | `python3 scripts/preflight.py` | existing Spec ID checks still pass | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Final verification | Task 5 |
| MIG-001 | `git status --short` | moved docs under `features/` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| MIG-002 | `python3 -m unittest scripts/test_preflight.py` | legacy root rejection | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| MIG-003 | `python3 scripts/preflight.py` | all references and docs pass | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` / Final verification | Task 4 |

## Task 1: Preflight feature-first contract

**Spec IDs:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, NFR-006, ERR-001, ERR-002, ERR-003

**Files:**
- Modify: `scripts/test_preflight.py`
- Modify: `scripts/preflight.py`

- [x] **Step 1: Write failing tests**

Add tests for feature-first collector paths, required feature README, legacy root rejection and metadata/path matching.

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL because current preflight still scans old four docs roots.

- [x] **Step 2: Implement collector and static checks**

Refactor preflight to collect docs from `docs/coding-plugins/features/<area>/<capability>/`, require README, reject old roots and validate metadata against feature root path.

- [x] **Step 3: Run tests**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 2: Move existing documents

**Spec IDs:** MIG-001, MIG-002, ERR-001

**Files:**
- Move: legacy spec files into `docs/coding-plugins/features/plugin/*/specs/`
- Move: legacy technical design files into `docs/coding-plugins/features/plugin/*/technical-design.md`
- Move: legacy implementation plans into `docs/coding-plugins/features/plugin/*/implementation.md`
- Move: legacy TDD Evidence files into `docs/coding-plugins/features/plugin/*/evidence/`
- Delete: `docs/coding-plugins/INDEX.md`
- Delete: `docs/coding-plugins/INDEX.md`
- Create: `docs/coding-plugins/features/plugin/*/README.md`

- [x] **Step 1: Move docs into feature roots**

Use `git mv` or equivalent file moves so each capability owns its complete chain.

- [x] **Step 2: Create README files**

Create a short README per feature root with document links, status, tags and related code where known.

- [x] **Step 3: Run legacy path test**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 3: Rebuild indexes and cross references

**Spec IDs:** NFR-007, ERR-005

**Files:**
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: moved docs under `docs/coding-plugins/features/**`

- [x] **Step 1: Rebuild total index**

Update total index to include `Feature Root`, `Spec`, `Technical Design`, `Implementation Plan`, `Evidence`, `Tags` and `Updated`.

- [x] **Step 2: Replace moved document cross references**

Replace old paths inside moved specs, technical designs, plans and evidence with new feature-first paths.

- [x] **Step 3: Run preflight**

Run: `python3 scripts/preflight.py`
Expected: PASS after all active references are updated.

## Task 4: Update skills, templates and user docs

**Spec IDs:** NFR-008, ERR-004, MIG-003

**Files:**
- Modify: `README.md`
- Modify: `docs/installation.md`
- Modify: `docs/workflow-chain.md`
- Modify: `skills/spec-driven-development/SKILL.md`
- Modify: `skills/spec-driven-development/references/*.md`
- Modify: `skills/spec-driven-development/templates/*.md`
- Modify: `skills/writing-technical-design/SKILL.md`
- Modify: `skills/writing-technical-design/templates/technical-design.md`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`

- [x] **Step 1: Update active path guidance**

Replace old default paths with feature-first paths.

- [x] **Step 2: Run old path scan**

Run: `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests`
Expected: only allowed migration history or release notes references remain.

## Task 5: Final verification and release

**Spec IDs:** OBS-001, ERR-005

**Files:**
- Modify: `.codex-plugin/plugin.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.version-bump.json`
- Modify: `RELEASE-NOTES.md`
- Modify: `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md`

- [x] **Step 1: Record TDD Evidence**

Write RED/GREEN/REFACTOR and final verification evidence.

- [x] **Step 2: Run full verification**

Run:

```bash
python3 scripts/preflight.py
git diff --check
claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict
```

Expected: all PASS.

- [x] **Step 3: Commit, bump version, reinstall and push**

Create Chinese Conventional Commit with `Authored-by: Vincen <hx001007@gmail.com>`, bump patch version, run verification again, install personal plugin and push.
