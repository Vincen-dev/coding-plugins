# 技术设计产物独立维护

## Task 1: technical 文档层和 preflight 校验

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-006 / ERR-001 / ERR-002 / ERR-003 / ERR-004 / ERR-005
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_collect_technical_design_files_uses_default_docs_path`、`test_artifact_index_requires_technical_paths`、`test_technical_index_requires_design_paths`、`test_spec_technical_reference_check_rejects_missing_paths`、`test_plan_technical_design_source_check_rejects_missing_source`、`test_technical_design_spec_id_check_rejects_unknown_ids`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** preflight 单测失败于缺少 technical 文件收集、索引校验、Spec/Plan 技术设计引用校验和 technical Spec ID 校验。
- **GREEN change:** 新增 technical 文件收集、technical 索引覆盖、总索引 Technical 列覆盖、Spec/Plan technical 引用和 technical Spec ID 校验。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS，包含 technical 文档、规格、计划和 Evidence 全链路校验。

## Task 2: writing-technical-design skill 和路由

### TDD Evidence

- **Spec/Bug/AC:** REQ-004 / REQ-005 / REQ-007 / AC-002
- **RED test:** `tests/behavior/test_routing.py::RoutingBehaviorTests.test_using_entry_routes_development_intents_to_required_skills`
- **RED command:** `python3 -m unittest tests.behavior.test_routing`
- **RED failure:** 行为测试失败于 `writing-technical-design` 未出现在 `using-coding-plugins` 开发任务路由中。
- **GREEN change:** 新增 `writing-technical-design` skill、OpenAI metadata、模板、Claude 命名空间引用，并更新 `using-coding-plugins` 与 `writing-plans`。
- **GREEN command:** `python3 -m unittest tests.behavior.test_routing` PASS
- **REFACTOR command:** `python3 -m unittest tests.behavior.test_routing` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS。
