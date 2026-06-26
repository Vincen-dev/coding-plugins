# 文档元数据中文展示优化

## Task 1: Plan metadata and Chinese summary checks

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-006 / ERR-001 / ERR-002 / ERR-003 / ERR-004
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_plan_metadata_check_rejects_missing_frontmatter`、`test_plan_metadata_check_rejects_mismatched_path_metadata`、`test_document_info_check_rejects_missing_chinese_summary`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** preflight 单测失败于缺少 Plan metadata 校验和中文 `文档信息` 摘要校验函数。
- **GREEN change:** 新增 Plan frontmatter 必填字段校验、路径一致性校验和中文 `文档信息` 摘要校验。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS。

## Task 2: Template and existing Plan updates

### TDD Evidence

- **Spec/Bug/AC:** REQ-004 / REQ-005 / AC-001 / AC-002
- **RED test:** `python3 scripts/preflight.py`
- **RED command:** `python3 scripts/preflight.py`
- **RED failure:** 完整 preflight 会在现有 Plan 缺少 frontmatter 或中文摘要时失败。
- **GREEN change:** 更新 `writing-plans` 计划模板、technical design 模板，并回填现有 Plan 文档 metadata 与中文 `文档信息`。
- **GREEN command:** `python3 scripts/preflight.py` PASS
- **REFACTOR command:** `python3 scripts/preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS。
