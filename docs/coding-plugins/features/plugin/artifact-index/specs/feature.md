---
spec_id: plugin-artifact-index-feature
title: Coding Plugins 产物总索引
type: feature
status: approved
area: plugin
capability: artifact-index
created: 2026-06-26
updated: 2026-06-26
tags:
  - index
  - retrieval
  - traceability
  - preflight
related_code:
  - docs/coding-plugins/INDEX.md
  - scripts/preflight.py
  - scripts/test_preflight.py
related_specs:
  - docs/coding-plugins/features/plugin/preflight/specs/feature.md
---

# Coding Plugins 产物总索引规格

## 目标

提供一个面向维护者和使用者的总索引，把规格、计划和 TDD Evidence 按 area/capability 聚合，降低功能数量增长后的检索成本。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不替代 `docs/coding-plugins/INDEX.md` 的规格专用索引。 |
| NON-002 | 不自动生成索引文件；本次只提供人工维护格式和 preflight 覆盖校验。 |
| NON-003 | 不要求每个 capability 都必须同时拥有 spec、plan 和 evidence。 |

## 背景

- 当前行为：规格有 `docs/coding-plugins/INDEX.md`，但 plans 和 evidence 没有统一入口；使用者需要记住路径或全文搜索。
- 目标用户或调用方：插件维护者、实现代理、评审代理、后续接手者。
- 约束：索引文件必须是普通 Markdown 表格；preflight 校验只依赖 Python 标准库。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 仓库必须提供 `docs/coding-plugins/INDEX.md` 作为规格、计划和证据的统一检索入口。 | 单元测试 `test_artifact_index_requires_index_file`。 |
| REQ-002 | 必须 | 总索引必须包含 `Area`、`Capability`、`Spec`、`Plan`、`Evidence`、`Tags`、`Updated` 列。 | 单元测试 `test_artifact_index_requires_expected_headers`。 |
| REQ-003 | 必须 | preflight 必须校验所有真实规格文件都出现在总索引中。 | 单元测试 `test_artifact_index_requires_spec_paths`。 |
| REQ-004 | 必须 | preflight 必须校验所有计划文件都出现在总索引中。 | 单元测试 `test_artifact_index_requires_plan_paths`。 |
| REQ-005 | 必须 | preflight 必须校验所有 TDD Evidence 文件都出现在总索引中。 | 单元测试 `test_artifact_index_requires_evidence_paths`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | `docs/coding-plugins` 下没有任何 spec、plan 或 evidence 文件。 | preflight 不要求总索引存在。 | 单元测试或函数评审。 |
| ERR-002 | 总索引缺少必需表头。 | preflight 失败并指出缺失表头。 | 单元测试 `test_artifact_index_requires_expected_headers`。 |
| ERR-003 | 新增 evidence 文件但没有更新总索引。 | preflight 失败并指出缺失路径。 | 单元测试 `test_artifact_index_requires_evidence_paths`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 使用者查找 capability 全链路产物 | 已知 area/capability | 打开 `docs/coding-plugins/INDEX.md` | 能看到对应 spec、plan 和 evidence 路径。 |
| AC-002 | 维护者发布前检查 | 新增或修改规格、计划、证据 | 运行 `python3 scripts/preflight.py` | 未更新总索引时失败，更新后通过。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| AC-001 | 文件检查 | `docs/coding-plugins/INDEX.md` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
