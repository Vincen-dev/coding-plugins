# 导出配置

先实现后补测试。

## TDD Evidence

- **Spec/Bug/AC:** REQ-001
- **RED test:** `tests/test_export_config.py::test_export_includes_version`
- **RED command:** `python3 -m pytest tests/test_export_config.py::test_export_includes_version -v`
- **RED failure:** AssertionError because exported payload lacks `version`.
- **GREEN change:** Added `version` to the export payload.
- **GREEN command:** `python3 -m pytest tests/test_export_config.py::test_export_includes_version -v`
- **REFACTOR command:** `python3 -m pytest tests/test_export_config.py -v`
- **Final verification:** `python3 -m pytest tests/test_export_config.py -v` PASS
