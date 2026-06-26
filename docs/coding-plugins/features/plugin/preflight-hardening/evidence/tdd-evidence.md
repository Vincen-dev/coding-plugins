# Preflight 覆盖面增强

## Task 1: 增强插件结构和追踪校验

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_skill_agent_metadata_check_rejects_missing_agent_file`、`test_manifest_asset_check_rejects_missing_asset`、`test_document_path_metadata_check_rejects_mismatched_spec_metadata`、`test_evidence_spec_id_check_rejects_unknown_ids` 和 `test_docs_sync_check_rejects_missing_key_paths`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 单测失败于 `AttributeError`，说明 preflight 尚未提供 skill metadata、manifest 资源路径、文档路径 metadata、Evidence Spec ID 和关键文档路径同步检查函数。
- **GREEN change:** 新增 `check_skill_agent_metadata()`、`check_manifest_asset_paths()`、`check_document_path_metadata()`、`check_tdd_evidence_spec_ids()` 和 `check_documentation_path_references()`，并接入 `run_static_checks()`。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS，包含 skill metadata、manifest 资源路径、文档路径 metadata、Evidence Spec ID 和关键文档路径同步检查。
