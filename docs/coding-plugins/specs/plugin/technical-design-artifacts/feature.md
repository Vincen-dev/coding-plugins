---
spec_id: plugin-technical-design-artifacts-feature
title: 技术设计产物独立维护
type: feature
status: approved
area: plugin
capability: technical-design-artifacts
created: 2026-06-26
updated: 2026-06-26
tags:
  - technical-design
  - architecture
  - traceability
  - workflow
related_code:
  - skills/writing-technical-design/SKILL.md
  - skills/writing-technical-design/templates/technical-design.md
  - skills/writing-plans/SKILL.md
  - scripts/preflight.py
  - docs/coding-plugins/technical/INDEX.md
related_specs: []
related_technical:
  - docs/coding-plugins/technical/plugin/technical-design-artifacts/technical-design.md
---

# 技术设计产物独立维护规格

## 目标

将技术实现方案从计划文档中拆出到独立 `technical` 目录，并让规格、技术设计、计划和 TDD Evidence 形成可检索、可校验的链路。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不强制回填所有历史规格的技术设计文档。 |
| NON-002 | 不让技术设计替代规格或实现计划。 |
| NON-003 | 不引入外部文档生成器或非标准库依赖。 |

## 背景

- 当前行为：技术方案主要写在 `writing-plans` 产出的 `implementation.md` 中，规格和计划之间没有独立的技术设计产物。
- 目标用户或调用方：插件维护者、后续执行计划的代理、发布前 preflight、GitHub Actions。
- 约束：路径要按 `area/capability` 检索；新增规则不能破坏没有历史计划文档的现有 capability。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 技术设计文档默认保存到 `docs/coding-plugins/technical/plugin/technical-design-artifacts/technical-design.md` 这类 area/capability 分层路径。 | 单元测试 `test_collect_technical_design_files_uses_default_docs_path`。 |
| REQ-002 | 必须 | `docs/coding-plugins/technical/INDEX.md` 必须覆盖所有真实技术设计文档。 | 单元测试 `test_technical_index_requires_design_paths`。 |
| REQ-003 | 必须 | 总索引 `docs/coding-plugins/INDEX.md` 必须增加 `Technical` 列，并覆盖真实技术设计文档。 | 单元测试 `test_artifact_index_requires_technical_paths`。 |
| REQ-004 | 必须 | 新增 `writing-technical-design` skill，负责把已批准规格转成独立技术设计。 | 行为测试 `test_using_entry_routes_development_intents_to_required_skills`。 |
| REQ-005 | 必须 | `writing-plans` 必须引用 `Technical Design Source`，计划只保留方案快照和任务拆分。 | 单元测试 `test_plan_technical_design_source_check_rejects_missing_source`。 |
| REQ-006 | 必须 | preflight 必须校验技术设计路径、metadata、Spec ID 和引用路径。 | 单元测试 `scripts/test_preflight.py`。 |
| REQ-007 | 必须 | Claude Code 显式技能请求清单必须包含 `/coding-plugins:writing-technical-design`。 | 行为测试 `test_claude_reference_documents_explicit_namespace_for_each_skill`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 技术设计文档不在 area/capability 分层路径下，或 metadata 与路径不一致。 | preflight 失败并指出路径和 metadata 不一致。 | 单元测试。 |
| ERR-002 | 规格中的 `related_technical` 指向不存在的文档。 | preflight 失败并指出缺失技术设计引用。 | 单元测试。 |
| ERR-003 | 计划没有 `Technical Design Source` 或路径不存在。 | preflight 失败并指出计划缺少技术设计来源。 | 单元测试。 |
| ERR-004 | 技术设计文档引用了对应规格中不存在的 Spec ID。 | preflight 失败并指出未知 Spec ID。 | 单元测试。 |
| ERR-005 | 技术设计文档存在但总索引或 technical 索引未记录。 | preflight 失败并指出索引缺失路径。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 创建技术设计链路 | 已有批准规格 | 创建 `technical-design.md` 并在规格和计划中引用 | preflight 通过，索引能检索到 Spec、Technical、Plan、Evidence。 |
| AC-002 | 使用新技能 | 用户要求根据规格写技术方案 | 路由到 `writing-technical-design` | 生成独立技术设计文档，而不是把完整技术方案写入计划。 |
| AC-003 | 发布前检查 | 仓库包含 technical 文档和计划 | 运行 `python3 scripts/preflight.py` | 技术设计、规格、计划和 Evidence 校验全部通过。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 2 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| REQ-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-007 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 2 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| AC-002 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 2 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
