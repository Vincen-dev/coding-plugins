# 文档元数据中文展示优化

## 任务 1： Plan metadata and Chinese summary checks

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / REQ-003 / REQ-006 / ERR-001 / ERR-002 / ERR-003 / ERR-004
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_plan_metadata_check_rejects_missing_frontmatter`、`test_plan_metadata_check_rejects_mismatched_path_metadata`、`test_document_info_check_rejects_missing_chinese_summary`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** preflight 单测失败于缺少 Plan metadata 校验和中文 `文档信息` 摘要校验函数。
- **GREEN 变更:** 新增 Plan frontmatter 必填字段校验、路径一致性校验和中文 `文档信息` 摘要校验。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 2： Template and existing Plan updates

### TDD 证据

- **规格/缺陷/验收:** REQ-004 / REQ-005 / AC-001 / AC-002
- **RED 测试:** `python3 scripts/preflight.py`
- **RED 命令:** `python3 scripts/preflight.py`
- **RED 失败:** 完整 preflight 会在现有 Plan 缺少 frontmatter 或中文摘要时失败。
- **GREEN 变更:** 更新 `writing-plans` 计划模板、technical design 模板，并回填现有 Plan 文档 metadata 与中文 `文档信息`。
- **GREEN 命令:** `python3 scripts/preflight.py` PASS
- **REFACTOR 命令:** `python3 scripts/preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。
