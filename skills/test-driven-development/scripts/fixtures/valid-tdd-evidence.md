# 导出配置

## TDD 证据

- **规格/缺陷/验收:** REQ-001
- **RED 测试:** `tests/export-config.test.ts::test_export_includes_version`
- **RED 命令:** `node --test tests/export-config.test.ts::test_export_includes_version -v`
- **RED 失败:** AssertionError because exported payload lacks `version`.
- **GREEN 变更:** Added `version` to the export payload.
- **GREEN 命令:** `node --test tests/export-config.test.ts::test_export_includes_version -v`
- **REFACTOR 命令:** `node --test tests/export-config.test.ts -v`
- **最终验证:** `node --test tests/export-config.test.ts -v` PASS
