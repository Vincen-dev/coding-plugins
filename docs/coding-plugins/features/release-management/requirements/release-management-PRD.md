---
title: 插件发布和版本管理
type: feature
status: approved
feature: release-management
doc_id: release-management
created: 2026-06-26
updated: 2026-07-02
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
  - scripts/prepare_release.py
  - scripts/test_prepare_release.py
  - scripts/preflight.py
  - .github/workflows/release.yml
related_specs:
  - docs/coding-plugins/features/preflight/requirements/preflight-PRD.md
related_technical:
  - docs/coding-plugins/features/release-management/technicals/release-management-TDD.md
  - docs/coding-plugins/features/release-management/technicals/release-management-TID.md
related_plans:
  - docs/coding-plugins/features/release-management/plans/release-management-IPD.md
related_evidence:
  - docs/coding-plugins/features/release-management/evidences/release-management-TED.md
---

# 插件发布和版本管理规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | release-management |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/release-management/technicals/release-management-TDD.md` |

## 目标

提供可重复的版本提升、release notes 提取、tag 校验和 GitHub Release 创建流程，让 Codex 与 Claude manifest、版本配置、release notes 和公开发布产物保持一致。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不替代维护者决定版本号、发布时间和是否 push tag。 |
| NON-002 | 不在 preflight 中执行网络发布、push tag 或创建 GitHub Release。 |
| NON-003 | 不修改 Git 用户配置。 |
| NON-004 | 不取消仓库所有者 `Vincen-dev` 的 push 权限；权限治理目标是确认没有其他直接协作者可 push。 |

## 背景

- 当前行为：版本号可通过 `scripts/bump_version.py` 同步，preflight 会检查 manifest、`.version-bump.json` 和 `RELEASE-NOTES.md` 一致；仓库缺少 tag/GitHub Release 的可重复流程。
- 目标用户或调用方：插件维护者、本地发布前检查、GitHub Actions。
- 约束：Python 脚本必须只依赖标准库；GitHub Release 创建只在 GitHub Actions tag workflow 中运行。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 仓库必须包含 `RELEASE-NOTES.md`，并记录当前 manifest 版本。 | 单元测试 `test_release_management_check_rejects_missing_release_notes_version`。 |
| REQ-002 | 必须 | 仓库必须包含 `.version-bump.json`，且其中版本必须和两个 manifest 版本一致。 | 单元测试 `test_release_management_check_rejects_mismatched_config_version`。 |
| REQ-003 | 必须 | `scripts/bump_version.py` 必须校验 semver，并能同步更新 Codex manifest、Claude manifest 和 `.version-bump.json`。 | 单元测试 `scripts/test_bump_version.py`。 |
| REQ-004 | 必须 | preflight 必须运行版本脚本单测。 | 单元测试 `test_build_commands_include_core_validation_steps`。 |
| REQ-005 | 必须 | preflight 必须校验 release notes、版本配置和 manifest 版本一致性。 | 单元测试 `test_release_management_check_rejects_missing_release_notes_version`。 |
| REQ-006 | 必须 | `scripts/prepare_release.py` 必须读取当前 manifest 版本，生成 `v` 前缀 tag 名，例如 `v0.6.22`，并提取当前版本 release notes 正文。 | 单元测试 `scripts/test_prepare_release.py`。 |
| REQ-007 | 必须 | GitHub Actions 必须在 `v*` tag push 时运行 preflight、校验 tag 和 manifest 版本一致，并用当前版本 release notes 创建 GitHub Release。 | 单元测试 `test_release_management_check_rejects_missing_release_automation` 和人工评审 `.github/workflows/release.yml`。 |
| REQ-008 | 必须 | preflight 必须拒绝缺少 release 准备脚本、release 脚本单测或 GitHub Release workflow 的仓库状态。 | 单元测试 `test_release_management_check_rejects_missing_release_automation`。 |
| REQ-009 | 必须 | 当前 manifest 版本发布时必须创建并推送对应 `v` 前缀 tag，让 GitHub Release workflow 创建发布产物；本轮版本为 `v0.6.27`。 | `git tag --list v0.6.27`、`git ls-remote --tags origin v0.6.27` 和 `gh release view v0.6.27`。 |
| REQ-010 | 必须 | 远程仓库直接协作者中，只有 `Vincen-dev` 具备 push/admin 权限；其他公开用户只能 fork 或提 PR。 | `gh api repos/Vincen-dev/coding-plugins/collaborators?affiliation=direct` 和 main branch protection 查询。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 输入版本不是严格 semver。 | `scripts/bump_version.py` 拒绝并返回非零状态。 | 单元测试 `test_validate_version_rejects_invalid_semver`。 |
| ERR-002 | `.version-bump.json` 缺失。 | preflight 失败并指出缺失版本配置。 | 单元测试。 |
| ERR-003 | `RELEASE-NOTES.md` 未包含当前版本标题。 | preflight 失败并指出 release notes 缺失当前版本。 | 单元测试。 |
| ERR-004 | release 自动化脚本、测试或 workflow 缺失。 | preflight 失败并指出缺失 release automation。 | 单元测试 `test_release_management_check_rejects_missing_release_automation`。 |
| ERR-005 | 当前版本 release notes 标题缺失或正文为空。 | `scripts/prepare_release.py` 失败并指出当前版本 release notes 不可用。 | 单元测试 `test_extract_release_notes_rejects_missing_version`。 |
| ERR-006 | GitHub tag 名和 manifest 版本生成的 tag 名不一致。 | release workflow 在创建 GitHub Release 前失败。 | 人工评审 `.github/workflows/release.yml` 中的 tag 校验步骤。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 提升版本 | 维护者准备发布新版本 | 运行 `python3 scripts/bump_version.py 0.6.16` | 两个 manifest 和 `.version-bump.json` 同步为 `0.6.16`。 |
| AC-002 | 发布前检查 | release notes 包含当前版本 | 运行 `python3 scripts/preflight.py` | 版本管理检查通过。 |
| AC-003 | 本地准备发布 metadata | manifest、版本配置和 release notes 已同步 | 运行 `python3 scripts/prepare_release.py --skip-git-checks --notes-out release-notes.md` | 输出类似 `Release ready: v0.6.22`，并生成当前版本 release notes 正文。 |
| AC-004 | tag 触发 GitHub Release | 维护者 push 当前版本对应的 `v` 前缀 tag 到 GitHub，例如 `v0.6.22` | GitHub Actions 执行 release workflow | workflow 运行 preflight、校验 tag 匹配 manifest，并创建 GitHub Release。 |
| AC-005 | 当前版本正式发布 | 当前仓库 main 已同步且 preflight 通过 | 创建并 push 当前版本 tag | GitHub Release 存在，release notes 来自当前版本段落。 |
| AC-006 | 只有维护者可直接 push | 仓库为 public | 查询直接协作者和 main 保护规则 | 只有 `Vincen-dev` 拥有 push/admin 权限；其他用户不能直接 push。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_bump_version.py` | Task 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-006 | 单元测试 | `python3 -m unittest scripts/test_prepare_release.py` | Task 2 | 已覆盖 |
| REQ-007 | 单元测试 + 人工评审 | `python3 -m unittest scripts/test_preflight.py`，评审 `.github/workflows/release.yml` | Task 2 | 已覆盖 |
| REQ-008 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| REQ-009 | 远程验证 | `git ls-remote --tags origin v0.6.27`、`gh release view v0.6.27` | Task 3 | 已覆盖 |
| REQ-010 | 远程验证 | `gh api repos/Vincen-dev/coding-plugins/collaborators?affiliation=direct` | Task 3 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_bump_version.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest scripts/test_prepare_release.py` | Task 2 | 已覆盖 |
| ERR-006 | 人工评审 | `.github/workflows/release.yml` tag 校验步骤 | Task 2 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/bump_version.py 0.6.16 --root /tmp/plugin-version-test` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/plugin-release-notes.md` | Task 2 | 已覆盖 |
| AC-004 | 人工评审 | `.github/workflows/release.yml` | Task 3 | 已覆盖 |
| AC-005 | 远程验证 | `gh release view v0.6.27` | Task 3 | 已覆盖 |
| AC-006 | 远程验证 | `gh api` collaborators 和 branch protection 查询 | Task 3 | 已覆盖 |
