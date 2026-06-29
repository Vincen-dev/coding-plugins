# Feature-first 文档结构迁移

## Task 1: Preflight feature-first contract

### TDD Evidence

- **Spec/Bug/AC:** NFR-001 / NFR-002 / NFR-003 / NFR-004 / NFR-005 / NFR-006 / ERR-001 / ERR-002 / ERR-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_collect_spec_files_excludes_index`、`test_collect_tdd_evidence_files_uses_feature_first_path`、`test_collect_plan_files_uses_feature_first_plans_subdir`、`test_collect_technical_design_files_uses_feature_first_technical_subdir`、`test_feature_roots_require_readme`、`test_legacy_docs_roots_are_rejected`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 测试失败于旧 collector 仍扫描旧四类目录，且缺少 `check_feature_readmes` 和 `check_legacy_docs_roots`。
- **GREEN change:** 将 preflight collector 改为扫描 `docs/coding-plugins/features/{area}/{capability}`，新增 feature README 校验、legacy docs root 拒绝和 feature root metadata 校验。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS。

## Task 2: Move existing documents

### TDD Evidence

- **Spec/Bug/AC:** MIG-001 / MIG-002 / NFR-007 / NFR-008 / ERR-004 / ERR-005
- **RED test:** `python3 scripts/preflight.py`
- **RED command:** `python3 scripts/preflight.py`
- **RED failure:** 迁移后首次完整 preflight 在 `feature-first-docs` 规格校验阶段失败，原因是规格中残留模板占位符和 Markdown 表格内的正则管道符。
- **GREEN change:** 将现有 Spec、Technical Design、Plan 和 TDD Evidence 移动到 feature-first 目录，重建总索引，新增每个 feature root 的 README，并修复迁移规格格式。
- **GREEN command:** `python3 scripts/preflight.py` PASS
- **REFACTOR command:** `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" README.md docs skills scripts tests` 无活跃命中。
- **Final verification:** `python3 scripts/preflight.py` PASS。

## Task 3: Remove flat feature-root technical and plan files

### TDD Evidence

- **Spec/Bug/AC:** NFR-003 / NFR-004 / NFR-009 / ERR-006 / MIG-004
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_collect_plan_files_uses_feature_first_plans_subdir`、`test_collect_technical_design_files_uses_feature_first_technical_subdir`、`test_flat_feature_root_technical_and_plan_files_are_rejected`、`test_render_artifact_index_includes_feature_metadata_and_documents`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 新测试失败于 `preflight.check_feature_first_document_layout` 不存在，计划和技术设计 collector 仍返回旧 flat feature-root 路径，生成式索引未包含 `technical/technical-design.md` 和 `plans/implementation.md`。
- **GREEN change:** 将 preflight collectors、索引生成、技术设计引用解析和计划校验切换到 `technical/` 与 `plans/` 子目录；新增 flat feature-root 技术/计划文件拒绝；迁移现有文档并更新 README、workflow、skill、spec、technical、plan 和 evidence 引用。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 scripts/preflight.py --write-index` PASS
- **Final verification:** `python3 scripts/preflight.py --write-index` PASS；`python3 scripts/preflight.py` PASS；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.24`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS；`find docs/coding-plugins/features -maxdepth 3 -type f \( -name technical-design.md -o -name implementation.md \) -print` 无输出。
