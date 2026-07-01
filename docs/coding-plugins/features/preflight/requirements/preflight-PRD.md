---
spec_id: plugin-preflight-feature
title: 插件发布前检查
type: feature
status: approved
feature: preflight
created: 2026-06-26
updated: 2026-06-29
tags:
  - ci
  - validation
  - release-gate
related_code:
  - scripts/preflight.py
  - scripts/docs_index.py
  - scripts/manifest_checks.py
  - .github/workflows/ci.yml
  - tests/hooks/test-session-start.sh
  - docs/coding-plugins/INDEX.md
related_specs: []
related_technical:
  - docs/coding-plugins/features/preflight/technicals/preflight-TDD.md
related_plans:
  - docs/coding-plugins/features/preflight/plans/preflight-IPD.md
related_evidence:
  - docs/coding-plugins/features/preflight/evidences/preflight-TED.md
---

# 插件发布前检查规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | preflight |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/preflight/technicals/preflight-TDD.md` |

## 目标

提供一个命令，在 push、发布或 marketplace 打包前校验插件仓库。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 该命令不负责发布插件，也不注册 marketplace 元数据。 |
| NON-002 | 该命令不替代对 skill 文案、产品适配和用户可见工作流判断的人工评审。 |

## 背景

- 当前行为：仓库已有 SDD 和 TDD 校验器，但维护者需要记住完整验证集合。
- 目标用户或调用方：插件维护者、本地 Codex 会话和 GitHub Actions。
- 约束：命令必须只依赖 Python 标准库和仓库内文件。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | preflight 命令运行 SDD 校验器、TDD 证据 校验器和 preflight 逻辑的仓库单测。 | 追踪矩阵中的单测命令。 |
| REQ-002 | 必须 | preflight 命令校验 `docs/coding-plugins/features/**/requirements/*.md` 下的真实规格文档。 | 追踪矩阵中的 strict 规格校验命令。 |
| REQ-003 | 必须 | preflight 命令拒绝 Codex 和 Claude 插件 manifest 版本不一致的仓库状态。 | 单测 `test_manifest_version_check_rejects_mismatched_versions`。 |
| REQ-004 | 必须 | preflight 命令拒绝 Git 内部目录之外仍引用已移除旧入口的仓库状态。 | 单测 `test_removed_entry_scan_ignores_git_and_detects_active_references`。 |
| REQ-005 | 必须 | GitHub Actions 在 push 到 `main` 和面向 `main` 的 pull request 中运行同一个 preflight 命令。 | 追踪矩阵中的 workflow 文件检查和命令执行。 |
| REQ-006 | 必须 | preflight 命令运行 Codex SessionStart hook 测试，防止入口注入链路发布时失效。 | 单测 `test_build_commands_include_core_validation_steps` 和 hook 测试命令。 |
| REQ-007 | 必须 | preflight 命令校验 `docs/coding-plugins/INDEX.md` 覆盖所有真实 spec、plan 和 TDD 证据 文件。 | 单测 `test_artifact_index_requires_spec_paths`、`test_artifact_index_requires_plan_paths` 和 `test_artifact_index_requires_evidence_paths`。 |
| REQ-008 | 必须 | 文档索引生成、写入和内容一致性校验必须封装在 `scripts/docs_index.py`，`scripts/preflight.py` 只保留 CLI 和发布门禁编排。 | 单测 `test_docs_index_module_exposes_index_contract` 和 `test_preflight_delegates_artifact_index_checks_to_docs_index`。 |
| REQ-009 | 必须 | manifest 相关检查必须封装在 `scripts/manifest_checks.py`，`scripts/preflight.py` 只保留错误转换、CLI 和发布门禁编排。 | 单测 `test_manifest_checks_module_exposes_manifest_contract` 和 `test_preflight_converts_manifest_check_errors`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | feature-first 结构下没有真实规格文件。 | preflight 跳过规格文件校验，仍运行单测和静态检查。 | 单测 `test_build_commands_include_core_validation_steps`。 |
| ERR-002 | 已移除旧入口的引用只出现在 `.git` 目录内。 | preflight 忽略 `.git` 目录。 | 单测 `test_removed_entry_scan_ignores_git_and_detects_active_references`。 |
| ERR-003 | 必需的 manifest 文件缺失。 | preflight 以非零状态退出，并输出缺失文件信息。 | `check_required_plugin_files` 的单测覆盖或手工命令失败证据。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 本地 preflight 成功 | 仓库干净、manifest 版本一致且规格有效 | 维护者运行 `python3 scripts/preflight.py` | 命令以 0 状态退出，并输出 `Preflight passed.` |
| AC-002 | CI preflight 运行 | push 或 pull request 目标分支为 `main` | GitHub Actions 启动 `ci` workflow | workflow 运行 `python3 scripts/preflight.py`。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | Task 1 | 已覆盖 |
| REQ-002 | 规格校验 | `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/features/preflight/requirements/preflight-PRD.md` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-005 | workflow 检查 | `.github/workflows/ci.yml` 包含 `python3 scripts/preflight.py` | Task 2 | 已覆盖 |
| REQ-006 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 2 | 已覆盖 |
| REQ-007 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 3 | 已覆盖 |
| REQ-008 | 单元测试 | `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` | Task 2 | 已覆盖 |
| REQ-009 | 单元测试 | `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py` | Task 3 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| AC-002 | workflow 评审 | `.github/workflows/ci.yml` | Task 2 | 已覆盖 |
