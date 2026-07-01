---
spec_id: plugin-preflight-hardening-feature
title: Preflight 覆盖面增强
type: feature
status: approved
feature: preflight-hardening
created: 2026-06-26
updated: 2026-06-29
tags:
  - preflight
  - validation
  - manifest
  - traceability
  - docs-sync
related_code:
  - scripts/preflight.py
  - scripts/test_preflight.py
  - docs/coding-plugins/INDEX.md
related_specs:
  - docs/coding-plugins/features/preflight/requirements/preflight-PRD.md
---

# Preflight 覆盖面增强规格

## 目标

增强 `scripts/preflight.py` 的发布前检查能力，把插件结构、资源路径、文档路径一致性和 Evidence 追踪关系纳入自动校验。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不在 CI 中强制运行需要本机账号或外部认证的安装命令。 |
| NON-002 | 不替代 Claude Code 或 Codex 安装器自身的校验。 |
| NON-003 | 不自动修复文档、manifest 或索引。 |

## 背景

- 当前行为：preflight 已覆盖 manifest 版本、旧入口残留、SDD/TDD 校验、hook 测试和总索引覆盖。
- 目标用户或调用方：插件维护者、GitHub Actions、本地发布前检查。
- 约束：新增检查必须只依赖 Python 标准库和仓库内文件。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 每个 `skills/{skill-name}/SKILL.md` 都必须有对应 `skills/{skill-name}/agents/openai.yaml`。 | 单元测试 `test_skill_agent_metadata_check_rejects_missing_agent_file`。 |
| REQ-002 | 必须 | Codex manifest 中的 `interface.composerIcon`、`interface.logo`、`interface.logoDark` 和 screenshots 路径必须存在。 | 单元测试 `test_manifest_asset_check_rejects_missing_asset`。 |
| REQ-003 | 必须 | `docs/coding-plugins/features/{feature}/requirements/{file}.md` 必须和规格 metadata 的 `feature` 一致。 | 单元测试 `test_document_path_metadata_check_rejects_mismatched_spec_metadata`。 |
| REQ-004 | 必须 | `docs/coding-plugins/features/{feature}/evidences/{feature}-TDD-Evidence.md` 中引用的 Spec ID 必须能在同 feature 的规格文件中找到。 | 单元测试 `test_evidence_spec_id_check_rejects_unknown_ids`。 |
| REQ-005 | 必须 | README、安装说明和工作链路文档必须包含关键路径：总索引、hook 配置、preflight 命令。 | 单元测试 `test_docs_sync_check_rejects_missing_key_paths`。 |
| REQ-006 | 必须 | preflight 必须拒绝活跃文档、hook、skill、脚本和测试中的旧 TDD 证据 路径 `docs/coding-plugins/evidence/`。 | 单元测试 `test_legacy_tdd_evidence_path_references_are_rejected`。 |
| REQ-007 | 必须 | preflight 必须拒绝活跃技能和 hook 中的 `superpowers` 品牌或路径残留；测试 fixture、preflight 拦截规则和 release 历史可以保留必要字面量。 | 单元测试 `test_superpowers_references_are_rejected_in_active_guidance`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | skill 目录中没有 `SKILL.md`。 | 不视为 skill，不要求 agent metadata。 | 单元测试或函数评审。 |
| ERR-002 | evidence 文件没有同 feature 的规格文件。 | preflight 失败并指出无法匹配规格上下文。 | 单元测试 `test_evidence_spec_id_check_rejects_unknown_ids`。 |
| ERR-003 | Codex manifest 未声明可选资源字段。 | 不报错。 | 单元测试或函数评审。 |
| ERR-004 | 旧路径或旧品牌文字出现在 release notes 历史记录。 | 不报错。 | 单元测试 `test_removed_residue_scan_allows_release_history`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 发布前检查结构完整性 | 新增 skill、资源或文档产物 | 运行 `python3 scripts/preflight.py` | 缺少 metadata、资源或追踪关系时失败。 |
| AC-002 | 发布前检查通过 | 仓库符合所有结构规则 | 运行 `python3 scripts/preflight.py` | 命令输出 `Preflight passed.`。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| REQ-007 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/preflight.py` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 2 | 已覆盖 |
