---
title: Feature-first 文档结构迁移
status: approved
feature: feature-first-docs
doc_id: feature-first-docs
created: 2026-06-29
updated: 2026-07-01
related_specs:
  - docs/coding-plugins/features/feature-first-docs/requirements/feature-first-docs-PRD.md
related_technical:
  - docs/coding-plugins/features/feature-first-docs/technicals/feature-first-docs-TDD.md
related_plans:
  - docs/coding-plugins/features/feature-first-docs/plans/feature-first-docs-IPD.md
---
# Feature-first 文档结构迁移

## 任务 1： Preflight feature-first contract

### TDD 证据

- **规格/缺陷/验收:** NFR-001 / NFR-002 / NFR-003 / NFR-004 / NFR-005 / NFR-006 / ERR-001 / ERR-002 / ERR-003
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_collect_spec_files_excludes_index`、`test_collect_tdd_evidence_files_uses_feature_first_path`、`test_collect_plan_files_uses_feature_first_plans_subdir`、`test_collect_technical_design_files_uses_feature_first_technical_subdir`、`test_feature_roots_require_readme`、`test_legacy_docs_roots_are_rejected`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** 测试失败于旧 collector 仍扫描旧四类目录，且缺少 `check_feature_readmes` 和 `check_legacy_docs_roots`。
- **GREEN 变更:** 将 preflight collector 改为扫描 `docs/coding-plugins/features/{feature}`，新增 feature README 校验、legacy docs root 拒绝和 feature root metadata 校验。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 2： Move existing documents

### TDD 证据

- **规格/缺陷/验收:** MIG-001 / MIG-002 / NFR-007 / NFR-008 / ERR-004 / ERR-005
- **RED 测试:** `python3 scripts/preflight.py`
- **RED 命令:** `python3 scripts/preflight.py`
- **RED 失败:** 迁移后首次完整 preflight 在 `feature-first-docs` 规格校验阶段失败，原因是规格中残留模板占位符和 Markdown 表格内的正则管道符。
- **GREEN 变更:** 将现有 Spec、Technical Design、Plan 和 TDD 证据 移动到 feature-first 目录，重建总索引，新增每个 feature root 的 README，并修复迁移规格格式。
- **GREEN 命令:** `python3 scripts/preflight.py` PASS
- **REFACTOR 命令:** `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests` 无活跃命中。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 3： Remove flat feature-root technical and plan files

### TDD 证据

- **规格/缺陷/验收:** NFR-003 / NFR-004 / NFR-009 / ERR-006 / MIG-004
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_collect_plan_files_uses_feature_first_plans_subdir`、`test_collect_technical_design_files_uses_feature_first_technical_subdir`、`test_flat_feature_root_technical_and_plan_files_are_rejected`、`test_render_artifact_index_includes_feature_metadata_and_documents`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** 新测试失败于 `preflight.check_feature_first_document_layout` 不存在，计划和技术设计 collector 仍返回旧 flat feature-root 路径，生成式索引未包含 `technicals/<feature-name>-TDD.md` 和 `plans/<feature-name>-IPD.md`。
- **GREEN 变更:** 将 preflight collectors、索引生成、技术设计引用解析和计划校验切换到 `technicals/` 与 `plans/` 子目录；新增 flat feature-root 技术/计划文件拒绝；迁移现有文档并更新 README、workflow、skill、spec、technical、plan 和 evidence 引用。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 scripts/preflight.py --write-index` PASS
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS；`python3 scripts/preflight.py` PASS；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.24`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS；`find docs/coding-plugins/features -maxdepth 3 -type f \( -name technical-design-document.md -o -name implementation.md \) -print` 无输出。

## 任务 4： Single-level feature metadata migration

### TDD 证据

- **规格/缺陷/验收:** NFR-001 / NFR-010 / NFR-011 / NFR-012 / ERR-003 / MIG-003
- **RED 测试:** `scripts/test_preflight.py`、`scripts/test_docs_index.py` 中的单级 `docs/coding-plugins/features/<feature-name>/` 路径、`Feature` 索引列和 `feature` metadata 断言。
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_docs_index.py`
- **RED 失败:** 旧实现仍把 `features/<feature-name>/specs` 当作二级 feature root，collector 返回空列表或错误索引行，`docs_index.py` 仍要求 `领域`、`能力` 列。
- **GREEN 变更:** 将 `docs_index.py` 和 `preflight.py` 切换为单级 feature root；README、spec、technical、plan、evidence frontmatter 使用 `feature`；17 个 feature 目录从旧二级目录上移到单级 feature 目录；全局 `INDEX.md` 改为唯一生成式索引；未新增局部 `INDEX.md`、`contract/current.md` 或 `contract/ai-ref.md`。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_docs_index.py scripts/test_document_contract_migration.py skills/spec-driven-development/scripts/test_validate_spec.py skills/writing-technicals/scripts/test_validate_technicals.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` PASS。
- **REFACTOR 命令:** `旧二级归属和旧路径残留扫描` 无输出。
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS；`find docs/coding-plugins/features -name INDEX.md -print` 无输出；`find docs/coding-plugins/features -path '*/contract/*' -print` 无输出。
