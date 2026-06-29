# TDD 证据 固定落地路径

## 任务 1： preflight 校验 evidence 文件

### TDD 证据

- **规格/缺陷/验收:** REQ-005 / ERR-001
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_collect_tdd_evidence_files_uses_feature_first_path` 和 `scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** `AttributeError: module 'preflight' has no attribute 'collect_tdd_evidence_files'`，且 `build_validation_commands()` 仍只接收 2 个参数，说明 preflight 尚未支持 evidence 文件收集和校验命令。
- **GREEN 变更:** 新增 `collect_tdd_evidence_files()`，让 `build_validation_commands()` 接收 evidence 文件列表，并在存在 evidence 文件时运行 `validate_tdd_evidence.py --strict`。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py`
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py`
- **最终验证:** `python3 scripts/preflight.py` PASS，包含 `validate_tdd_evidence.py --strict docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md`
