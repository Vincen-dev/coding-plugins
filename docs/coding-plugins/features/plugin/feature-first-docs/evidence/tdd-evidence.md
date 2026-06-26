# Feature-first 文档结构迁移

## Task 1: Preflight feature-first contract

### TDD Evidence

- **Spec/Bug/AC:** NFR-001 / NFR-002 / NFR-003 / NFR-004 / NFR-005 / NFR-006 / ERR-001 / ERR-002 / ERR-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_collect_spec_files_excludes_index`、`test_collect_tdd_evidence_files_uses_feature_first_path`、`test_collect_plan_files_uses_feature_first_path`、`test_collect_technical_design_files_uses_feature_first_path`、`test_feature_roots_require_readme`、`test_legacy_docs_roots_are_rejected`
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
