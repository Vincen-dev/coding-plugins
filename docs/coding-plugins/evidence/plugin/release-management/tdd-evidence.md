# 插件发布和版本管理

## Task 1: 版本 bump 脚本和 release 校验

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_release_management_check_rejects_missing_release_notes_version`、`scripts/test_preflight.py::PreflightTests.test_release_management_check_rejects_mismatched_config_version` 和 `scripts/test_bump_version.py`
- **RED command:** `python3 -m unittest scripts/test_preflight.py` 和 `python3 -m unittest scripts/test_bump_version.py`
- **RED failure:** preflight 单测失败于 `AttributeError: module 'preflight' has no attribute 'check_release_management_files'`，版本脚本单测失败于 `ModuleNotFoundError: No module named 'bump_version'`，说明尚无 release 管理校验和版本 bump 脚本。
- **GREEN change:** 新增 `RELEASE-NOTES.md`、`.version-bump.json`、`scripts/bump_version.py` 和 `scripts/test_bump_version.py`，并让 preflight 校验 release notes、版本配置和 manifest 版本一致性。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py` 和 `python3 -m unittest scripts/test_bump_version.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_bump_version.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS，包含版本脚本单测和 release 管理一致性校验。
