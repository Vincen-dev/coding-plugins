---
title: 插件发布和版本管理
status: approved
feature: release-management
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/release-management/specs/feature.md
related_technical:
  - docs/coding-plugins/features/release-management/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/release-management/plans/implementation.md
---
# 插件发布和版本管理

## 任务 1： 版本 bump 脚本和 release 校验

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_release_management_check_rejects_missing_release_notes_version`、`scripts/test_preflight.py::PreflightTests.test_release_management_check_rejects_mismatched_config_version` 和 `scripts/test_bump_version.py`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py` 和 `python3 -m unittest scripts/test_bump_version.py`
- **RED 失败:** preflight 单测失败于 `AttributeError: module 'preflight' has no attribute 'check_release_management_files'`，版本脚本单测失败于 `ModuleNotFoundError: No module named 'bump_version'`，说明尚无 release 管理校验和版本 bump 脚本。
- **GREEN 变更:** 新增 `RELEASE-NOTES.md`、`.version-bump.json`、`scripts/bump_version.py` 和 `scripts/test_bump_version.py`，并让 preflight 校验 release notes、版本配置和 manifest 版本一致性。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` 和 `python3 -m unittest scripts/test_bump_version.py` PASS
- **REFACTOR 命令:** `python3 -m unittest scripts/test_bump_version.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS，包含版本脚本单测和 release 管理一致性校验。

## 任务 2： Release tag 和 GitHub Release 自动化

### TDD 证据

- **规格/缺陷/验收:** REQ-006 / REQ-007 / REQ-008 / ERR-004 / ERR-005 / ERR-006 / AC-003 / AC-004
- **RED 测试:** `scripts/test_prepare_release.py`、`scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps` 和 `scripts/test_preflight.py::PreflightTests.test_release_management_check_rejects_missing_release_automation`
- **RED 命令:** `python3 -m unittest scripts/test_prepare_release.py` 和 `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** `scripts/test_prepare_release.py` 失败于 `ModuleNotFoundError: No module named 'prepare_release'`；`scripts/test_preflight.py` 失败于缺少 `test_prepare_release.py` validation command，且 `check_release_management_files()` 未拒绝缺少 release automation 的状态。
- **GREEN 变更:** 新增 `scripts/prepare_release.py`、`scripts/test_prepare_release.py` 和 `.github/workflows/release.yml`；增强 `scripts/preflight.py`，要求 release 准备脚本、单测和 GitHub Release workflow 存在，并把 release 单测纳入 preflight validation commands。
- **GREEN 命令:** `python3 -m unittest scripts/test_prepare_release.py` 和 `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 -m unittest scripts/test_prepare_release.py scripts/test_preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.22`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。

## 任务 3： 发布当前版本并确认 push 权限

### TDD 例外记录

- **原因:** 本任务验证的是 GitHub 远程仓库状态、tag 发布和权限治理，不是仓库内可用单元测试先驱动的代码行为。release workflow 是否创建 GitHub Release 必须通过远程 tag 和 GitHub API 结果确认。
- **用户批准:** 用户要求“补充计划实现1，5，4中只有我才能push”，其中 1 是发布 tag/GitHub Release，5 是继续拆分 preflight，4 是确认只有维护者可直接 push。
- **替代验证:** `python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md`、`gh api repos/Vincen-dev/coding-plugins --jq '{name:.full_name, visibility:.visibility, permissions:.permissions}'`、`gh api 'repos/Vincen-dev/coding-plugins/collaborators?affiliation=direct&per_page=100'`、`gh api repos/Vincen-dev/coding-plugins/branches/main/protection`、`git push origin v0.6.27`、`git ls-remote --tags origin v0.6.27`、`gh release view v0.6.27`。
- **风险:** GitHub 仓库权限和 release 状态会随远程设置漂移；发布前必须重新查询直接协作者、main 分支保护和目标 tag/release 状态。
- **最终验证:** 本轮使用 `v0.6.27` 作为当前版本 tag；远程 tag、GitHub Release 和直接协作者权限在发布后验证。
