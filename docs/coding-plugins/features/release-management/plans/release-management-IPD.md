---
title: 插件发布和版本管理实现计划
status: completed
feature: release-management
doc_id: release-management
created: 2026-06-29
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/release-management/requirements/release-management-PRD.md
related_technical:
  - docs/coding-plugins/features/release-management/technicals/release-management-TDD.md
  - docs/coding-plugins/features/release-management/technicals/release-management-TID.md
related_evidence:
  - docs/coding-plugins/features/release-management/evidences/release-management-TED.md
---

# 插件发布和版本管理实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已完成 |
| Feature | release-management |
| 需求文档 | `docs/coding-plugins/features/release-management/requirements/release-management-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/release-management/technicals/release-management-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/release-management/technicals/release-management-TID.md` |
| TDD 证据 | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` |

**目标:** 补齐 release tag、GitHub Release 和远程 push 权限的可重复发布链路。

**架构:** 版本同步、release metadata 准备和 GitHub Release 创建拆成独立步骤。`scripts/prepare_release.py` 提供本地和 GitHub Actions 共用的 release metadata 契约，`.github/workflows/release.yml` 在 tag push 时执行发布。

**技术栈:** Python 标准库、Git CLI、GitHub Actions、GitHub CLI。

**规格来源:** `docs/coding-plugins/features/release-management/requirements/release-management-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/release-management/technicals/release-management-TDD.md`

**技术实现来源:** `docs/coding-plugins/features/release-management/technicals/release-management-TID.md`

## 技术设计快照

**设计摘要:** `scripts/bump_version.py` 保持版本同步职责；新增 `scripts/prepare_release.py` 负责生成 `v<version>` tag 名和当前版本 release notes 正文；GitHub Actions 在 `v*` tag push 后运行 preflight 并创建 GitHub Release。preflight 只检查 release automation 文件和测试，不做网络发布。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 新增独立 release 准备脚本 | 让本地和 CI 共享 release metadata 规则 | 增加一个测试入口 |
| GitHub Release 只由 tag workflow 创建 | 避免 preflight 或普通 push 触发发布 | 发布依赖维护者 push tag |
| release notes 从 `RELEASE-NOTES.md` 当前版本提取 | 保持发布说明单一来源 | 标题格式必须稳定 |
| 只有 `Vincen-dev` 可直接 push | public 仓库仍可被 fork，直接写权限只授予维护者 | 维护者仍可按需 bypass PR 规则 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `scripts/test_prepare_release.py` | 新增 RED 测试覆盖 tag 名和 release notes 提取 | REQ-006, ERR-005, AC-003 |
| `scripts/prepare_release.py` | 新增 release metadata 校验和输出 | REQ-006, ERR-005, AC-003 |
| `scripts/test_preflight.py` | 要求 preflight 运行 release 单测并检查 release automation 文件 | REQ-004, REQ-008, ERR-004 |
| `scripts/preflight.py` | 增加 release automation 文件和 workflow 内容检查 | REQ-004, REQ-008, ERR-004 |
| `.github/workflows/release.yml` | 新增 tag workflow 和 GitHub Release 创建步骤 | REQ-007, ERR-006, AC-004 |
| GitHub repository settings | 确认只有 `Vincen-dev` 是直接协作者且具备 push/admin 权限 | REQ-010, AC-006 |

**数据流 / 控制流:** 维护者提升版本并更新 release notes 后运行 preflight；本地用 `prepare_release.py` 生成 release metadata；维护者 push `v<version>` tag；GitHub Actions 运行 preflight、准备 notes、校验 tag 与 manifest 一致，并调用 `gh release create`。

**接口和契约:** `scripts/prepare_release.py --notes-out <path> --github-output <path>` 输出 release notes 正文、`version` 和 `tag`。tag contract 固定为 `v<version>`。

**迁移 / 兼容性:** 现有 bump 和 preflight 命令继续可用；新增 release workflow 只响应 tag push。

**测试策略:** 先写 `scripts/test_prepare_release.py` 和 preflight release automation 测试，确认 RED；实现后运行 `python3 -m unittest scripts/test_prepare_release.py` 和 `python3 -m unittest scripts/test_preflight.py`；最终运行 `python3 scripts/preflight.py`。

**TDD 证据目标:** `docs/coding-plugins/features/release-management/evidences/release-management-TED.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| release workflow 与 manifest 版本不一致 | workflow 在创建 GitHub Release 前比较 GitHub ref 和脚本输出 tag |
| release notes 提取错误 | 单测覆盖当前版本段落提取和缺失版本失败 |
| 本地误创建重复 tag | `prepare_release.py` 默认检查 tag 是否已存在 |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_missing_release_notes_version` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_mismatched_config_version` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_bump_version.py` | `test_update_versions_updates_manifests_and_config` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | `test_build_commands_include_core_validation_steps` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_missing_release_notes_version` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| REQ-006 | `python3 -m unittest scripts/test_prepare_release.py` | `test_tag_name_for_version_uses_v_prefix_and_semver`, `test_extract_release_notes_section_for_version`, `test_validate_release_metadata_returns_version_tag_and_notes` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| REQ-007 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_missing_release_automation` and workflow review | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| REQ-008 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_missing_release_automation` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| ERR-001 | `python3 -m unittest scripts/test_bump_version.py` | `test_validate_version_rejects_invalid_semver` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| ERR-002 | `python3 -m unittest scripts/test_preflight.py` | version config missing path in `check_release_management_files` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| ERR-003 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_missing_release_notes_version` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 1 | Task 1 |
| ERR-004 | `python3 -m unittest scripts/test_preflight.py` | `test_release_management_check_rejects_missing_release_automation` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| ERR-005 | `python3 -m unittest scripts/test_prepare_release.py` | `test_extract_release_notes_rejects_missing_version` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| ERR-006 | `.github/workflows/release.yml` | tag 校验步骤 | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| AC-003 | `python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/plugin-release-notes.md` | 输出 `Release ready: v<version>` 并生成 notes | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| AC-004 | `.github/workflows/release.yml` | tag push release workflow | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 2 | Task 2 |
| REQ-009 | `git ls-remote --tags origin v<version>` / `gh release view v<version>` | current version tag and release exist | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 3 | Task 3 |
| REQ-010 | `gh api repos/Vincen-dev/coding-plugins/collaborators?affiliation=direct` | direct push-capable collaborator is only `Vincen-dev` | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 3 | Task 3 |
| AC-005 | `gh release view v<version>` | GitHub Release exists for current version | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 3 | Task 3 |
| AC-006 | `gh api` collaborators and branch protection queries | public repo direct push permission is restricted to maintainer | `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` / Task 3 | Task 3 |

## 任务 2： Release tag 和 GitHub Release 自动化

**规格 ID:** REQ-006, REQ-007, REQ-008, ERR-004, ERR-005, ERR-006, AC-003, AC-004

**文件:**

- 创建: `scripts/prepare_release.py`
- 创建: `scripts/test_prepare_release.py`
- 创建: `.github/workflows/release.yml`
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`
- 修改: `docs/coding-plugins/features/release-management/evidences/release-management-TED.md`

- [x] **步骤 1：Write failing tests from Spec IDs**

新增 `scripts/test_prepare_release.py` 覆盖 `tag_name_for_version()`、`extract_release_notes_section()` 和 `validate_release_metadata()`；修改 `scripts/test_preflight.py` 要求 validation commands 包含 `scripts/test_prepare_release.py`，并要求缺少 release automation 文件时失败。

- [x] **步骤 2：Run tests to verify RED**

运行: `python3 -m unittest scripts/test_prepare_release.py`
预期: FAIL with `ModuleNotFoundError: No module named 'prepare_release'`

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because `test_prepare_release.py` is not in validation commands and release automation is not checked.

- [x] **步骤 3：Write minimal implementation after RED**

新增 `scripts/prepare_release.py`，并让 `scripts/preflight.py` 检查 `scripts/prepare_release.py`、`scripts/test_prepare_release.py`、`.github/workflows/release.yml` 和 workflow 中的 release 创建命令。

- [x] **步骤 4：Run tests to verify GREEN**

运行: `python3 -m unittest scripts/test_prepare_release.py`
预期: PASS

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS

- [x] **步骤 5：Record TDD 证据**

更新 `docs/coding-plugins/features/release-management/evidences/release-management-TED.md` 的 Task 2。

## 任务 3： 发布当前版本并确认 push 权限

**规格 ID:** REQ-009, REQ-010, AC-005, AC-006

**文件:**

- 修改: `docs/coding-plugins/features/release-management/requirements/release-management-PRD.md`
- 修改: `docs/coding-plugins/features/release-management/technicals/release-management-TDD.md`
- 修改: `docs/coding-plugins/features/release-management/plans/release-management-IPD.md`
- 修改: `docs/coding-plugins/features/release-management/evidences/release-management-TED.md`

- [x] **步骤 1：Prepare release metadata**

运行: `python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md`
预期: outputs `Release ready: v<current-version>`.

- [x] **步骤 2：Confirm only Vincen-dev has direct push permission**

运行:

```bash
gh api repos/Vincen-dev/coding-plugins --jq '{name:.full_name, visibility:.visibility, permissions:.permissions}'
gh api 'repos/Vincen-dev/coding-plugins/collaborators?affiliation=direct&per_page=100'
gh api repos/Vincen-dev/coding-plugins/branches/main/protection
```

预期: direct collaborator list contains only `Vincen-dev` with push/admin permission; public users without collaborator rights cannot directly push.

- [x] **步骤 3：Create and push release tag**

运行:

```bash
git tag v<current-version>
git push origin v<current-version>
```

预期: tag push succeeds and GitHub release workflow starts.

- [x] **步骤 4：Verify remote tag and GitHub Release**

运行:

```bash
git ls-remote --tags origin v<current-version>
gh release view v<current-version>
```

预期: remote tag exists and GitHub Release is visible.

- [x] **步骤 5：Record TDD Exception evidence**

This task is release governance and remote state verification, not code behavior. Record final verification in `docs/coding-plugins/features/release-management/evidences/release-management-TED.md`.
