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

## Task 2: Release tag 和 GitHub Release 自动化

### TDD Evidence

- **Spec/Bug/AC:** REQ-006 / REQ-007 / REQ-008 / ERR-004 / ERR-005 / ERR-006 / AC-003 / AC-004
- **RED test:** `scripts/test_prepare_release.py`、`scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps` 和 `scripts/test_preflight.py::PreflightTests.test_release_management_check_rejects_missing_release_automation`
- **RED command:** `python3 -m unittest scripts/test_prepare_release.py` 和 `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** `scripts/test_prepare_release.py` 失败于 `ModuleNotFoundError: No module named 'prepare_release'`；`scripts/test_preflight.py` 失败于缺少 `test_prepare_release.py` validation command，且 `check_release_management_files()` 未拒绝缺少 release automation 的状态。
- **GREEN change:** 新增 `scripts/prepare_release.py`、`scripts/test_prepare_release.py` 和 `.github/workflows/release.yml`；增强 `scripts/preflight.py`，要求 release 准备脚本、单测和 GitHub Release workflow 存在，并把 release 单测纳入 preflight validation commands。
- **GREEN command:** `python3 -m unittest scripts/test_prepare_release.py` 和 `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR command:** `python3 -m unittest scripts/test_prepare_release.py scripts/test_preflight.py` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.22`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。
