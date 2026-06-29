# Coding Plugins 产物总索引

## Task 1: preflight 校验总索引覆盖

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_collect_plan_files_uses_feature_first_plans_subdir`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_index_file`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_expected_headers`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_spec_paths`、`scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_plan_paths` 和 `scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_evidence_paths`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 单测失败于 `AttributeError: module 'preflight' has no attribute 'collect_plan_files'` 和 `AttributeError: module 'preflight' has no attribute 'check_artifact_index_covers_documents'`，说明 preflight 尚不能收集计划文件，也不能校验总索引覆盖。
- **GREEN change:** 新增 `collect_plan_files()`、`check_artifact_index_covers_documents()` 和 Markdown 表头解析；创建 `docs/coding-plugins/INDEX.md`，覆盖当前规格和 TDD Evidence。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS，包含总索引覆盖校验、严格规格校验和严格 TDD Evidence 校验；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS。

## Task 2: 生成式总索引和漂移校验

### TDD Evidence

- **Spec/Bug/AC:** REQ-006 / REQ-007 / REQ-008 / ERR-004 / ERR-005 / AC-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_render_artifact_index_includes_feature_metadata_and_documents`、`scripts/test_preflight.py::PreflightTests.test_render_artifact_index_sorts_rows_and_joins_multiple_files`、`scripts/test_preflight.py::PreflightTests.test_render_artifact_index_handles_missing_tags`、`scripts/test_preflight.py::PreflightTests.test_render_artifact_index_handles_missing_updated_metadata` 和 `scripts/test_preflight.py::PreflightTests.test_artifact_index_requires_generated_content_match`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 单测失败于 `AttributeError: module 'preflight' has no attribute 'render_artifact_index'`，并且内容漂移测试报 `PreflightError not raised`，说明仓库尚不能生成总索引，也不能拒绝路径覆盖但内容错误的索引。
- **GREEN change:** 在 `scripts/preflight.py` 中新增 README metadata 解析、feature 文档收集、Markdown 路径单元格渲染、`render_artifact_index()`、`write_artifact_index()`、`--write-index` 参数和生成结果一致性校验；同步刷新 `docs/coding-plugins/INDEX.md`。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS，41 个测试通过。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS，确认路径覆盖测试和生成器测试同时保持 green。
- **Final verification:** `python3 scripts/preflight.py --write-index` PASS，包含索引重写、41 个 preflight 单测、bump version 单测、behavior routing 单测、hook 测试、严格规格校验和严格 TDD Evidence 校验；随后 `python3 scripts/preflight.py` PASS，`git diff --check` PASS，`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。
