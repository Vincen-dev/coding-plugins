# Coding Plugins 产物总索引

## Task 1: preflight 校验总索引覆盖

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_collect_plan_files_uses_default_docs_path`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_index_file`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_expected_headers`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_spec_paths`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_plan_paths` 和 `scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_evidence_paths`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 单测失败于 `AttributeError: module 'preflight' has no attribute 'collect_plan_files'` 和 `AttributeError: module 'preflight' has no attribute 'check_artifact_index_covers_documents'`，说明 preflight 尚不能收集计划文件，也不能校验总索引覆盖。
- **GREEN change:** 新增 `collect_plan_files()`、`check_artifact_index_covers_documents()` 和 Markdown 表头解析；创建 `docs/coding-plugins/INDEX.md`，覆盖当前规格和 TDD Evidence。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS，包含总索引覆盖校验、严格规格校验和严格 TDD Evidence 校验；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS。
