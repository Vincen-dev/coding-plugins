---
spec_id: plugin-document-metadata-feature
title: 文档元数据中文展示优化
type: feature
status: approved
area: plugin
capability: document-metadata
created: 2026-06-26
updated: 2026-06-26
tags:
  - metadata
  - chinese
  - plan
  - preflight
related_code:
  - scripts/preflight.py
  - scripts/test_preflight.py
  - skills/writing-plans/SKILL.md
  - skills/writing-technical-design/templates/technical-design.md
related_specs:
  - docs/coding-plugins/specs/plugin/technical-design-artifacts/feature.md
related_technical:
  - docs/coding-plugins/technical/plugin/document-metadata/technical-design.md
---

# 文档元数据中文展示优化规格

## 目标

统一 Spec、Technical Design 和 Plan 的元数据表达：机器可读 frontmatter 保持稳定英文 key，正文提供中文 `文档信息` 摘要；Plan 也必须具备 frontmatter 和中文摘要。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | document-metadata |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/technical/plugin/document-metadata/technical-design.md` |

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不把 frontmatter key 改成中文。 |
| NON-002 | 不重写全部历史规格正文。 |
| NON-003 | 不引入 YAML 解析第三方依赖。 |

## 背景

- 当前行为：Spec 和 Technical Design 有 frontmatter，Plan 没有统一 frontmatter；中文读者需要从英文 key 推断文档状态和关联关系。
- 目标用户或调用方：插件维护者、后续代理、preflight、GitHub Actions。
- 约束：机器字段必须继续支持现有 preflight 和 validate_spec；中文展示不应破坏脚本解析。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | Plan 文档必须包含 frontmatter，并声明 `title`、`status`、`area`、`capability`、`created`、`updated`。 | 单元测试 `test_plan_metadata_check_rejects_missing_frontmatter`。 |
| REQ-002 | 必须 | Plan frontmatter 的 `area` 和 `capability` 必须与 `plans/plugin/document-metadata/implementation.md` 这类分层路径一致。 | 单元测试 `test_plan_metadata_check_rejects_mismatched_path_metadata`。 |
| REQ-003 | 必须 | Plan 文档必须包含中文 `## 文档信息` 摘要表。 | 单元测试 `test_document_info_check_rejects_missing_chinese_summary`。 |
| REQ-004 | 必须 | Technical Design 模板必须包含中文 `## 文档信息` 摘要表。 | 文档评审和 preflight。 |
| REQ-005 | 必须 | `writing-plans` 计划模板必须包含 frontmatter 和中文 `## 文档信息` 摘要表。 | 文档评审和 preflight。 |
| REQ-006 | 必须 | preflight 必须校验 Plan metadata、路径一致性和中文摘要。 | `python3 scripts/preflight.py`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | Plan 没有 frontmatter。 | preflight 失败并指出缺少 Plan metadata。 | 单元测试。 |
| ERR-002 | Plan metadata 与路径不一致。 | preflight 失败并指出 area 或 capability 不一致。 | 单元测试。 |
| ERR-003 | Plan 没有中文 `文档信息` 摘要。 | preflight 失败并指出缺少中文文档信息。 | 单元测试。 |
| ERR-004 | 文档存在机器 frontmatter 但中文摘要缺少状态、领域或能力。 | preflight 失败并指出中文文档信息不完整。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 创建新计划 | 已有 Spec 和 Technical Design | 使用 `writing-plans` 生成 plan | plan 同时包含 frontmatter 和中文 `文档信息`。 |
| AC-002 | 发布前检查 | 仓库存在 plan 文档 | 运行 `python3 scripts/preflight.py` | 缺少 Plan metadata 或中文摘要时失败。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 文档评审 | `skills/writing-technical-design/templates/technical-design.md` | Task 2 | 已覆盖 |
| REQ-005 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 2 | 已覆盖 |
| REQ-006 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| AC-001 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
