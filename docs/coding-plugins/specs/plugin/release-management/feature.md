---
spec_id: plugin-release-management-feature
title: 插件发布和版本管理
type: feature
status: approved
area: plugin
capability: release-management
created: 2026-06-26
updated: 2026-06-26
tags:
  - release
  - version
  - changelog
  - automation
related_code:
  - RELEASE-NOTES.md
  - .version-bump.json
  - scripts/bump_version.py
  - scripts/test_bump_version.py
  - scripts/preflight.py
related_specs:
  - docs/coding-plugins/specs/plugin/preflight/feature.md
---

# 插件发布和版本管理规格

## 目标

提供可重复的版本提升脚本和发布记录，让 Codex 与 Claude manifest、版本配置和 release notes 保持一致。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不自动创建 GitHub Release 或 tag。 |
| NON-002 | 不自动 push 或发布 marketplace。 |
| NON-003 | 不修改 Git 用户配置。 |

## 背景

- 当前行为：版本号通过手工修改 `.codex-plugin/plugin.json` 和 `.claude-plugin/plugin.json` 维护，容易漏同步；仓库没有 release notes。
- 目标用户或调用方：插件维护者、本地发布前检查、GitHub Actions。
- 约束：脚本必须只依赖 Python 标准库。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 仓库必须包含 `RELEASE-NOTES.md`，并记录当前 manifest 版本。 | 单元测试 `test_release_management_check_rejects_missing_release_notes_version`。 |
| REQ-002 | 必须 | 仓库必须包含 `.version-bump.json`，且其中版本必须和两个 manifest 版本一致。 | 单元测试 `test_release_management_check_rejects_mismatched_config_version`。 |
| REQ-003 | 必须 | `scripts/bump_version.py` 必须校验 semver，并能同步更新 Codex manifest、Claude manifest 和 `.version-bump.json`。 | 单元测试 `scripts/test_bump_version.py`。 |
| REQ-004 | 必须 | preflight 必须运行版本脚本单测。 | 单元测试 `test_build_commands_include_core_validation_steps`。 |
| REQ-005 | 必须 | preflight 必须校验 release notes、版本配置和 manifest 版本一致性。 | 单元测试 `test_release_management_check_rejects_missing_release_notes_version`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 输入版本不是严格 semver。 | `scripts/bump_version.py` 拒绝并返回非零状态。 | 单元测试 `test_validate_version_rejects_invalid_semver`。 |
| ERR-002 | `.version-bump.json` 缺失。 | preflight 失败并指出缺失版本配置。 | 单元测试。 |
| ERR-003 | `RELEASE-NOTES.md` 未包含当前版本标题。 | preflight 失败并指出 release notes 缺失当前版本。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 提升版本 | 维护者准备发布新版本 | 运行 `python3 scripts/bump_version.py 0.6.16` | 两个 manifest 和 `.version-bump.json` 同步为 `0.6.16`。 |
| AC-002 | 发布前检查 | release notes 包含当前版本 | 运行 `python3 scripts/preflight.py` | 版本管理检查通过。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_bump_version.py` | Task 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_bump_version.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/bump_version.py 0.6.16 --root /tmp/plugin-version-test` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
