---
spec_id: plugin-document-contract-feature
title: 文档契约和 metadata-first 读取规则
type: feature
status: approved
feature: document-contract
created: 2026-06-29
updated: 2026-06-29
tags:
  - docs
  - metadata
  - contract
  - index
  - traceability
related_code:
  - scripts/docs_index.py
  - scripts/preflight.py
  - scripts/test_docs_index.py
  - scripts/test_preflight.py
related_specs:
  - docs/coding-plugins/features/document-metadata/requirements/document-metadata-PRD.md
  - docs/coding-plugins/features/artifact-index/requirements/artifact-index-PRD.md
related_technical:
  - docs/coding-plugins/features/document-contract/technicals/document-contract-TDD.md
---

# 文档契约和 metadata-first 读取规则规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | document-contract |
| 规格类型 | feature |

## 目标

把文档关系、索引、正式内容和人工摘要的职责边界固定成可校验契约，降低后续 feature 增多后的检索和维护成本。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不把 frontmatter key 改成中文。 |
| NON-002 | 不删除计划和技术设计中执行所需的来源引用。 |
| NON-003 | 不引入第三方 YAML 解析依赖。 |

## 背景

- 当前行为：README 正文中存在标签和产物链路表，Evidence 缺少 frontmatter，索引曾从 README 正文表格读取标签。
- 目标用户或调用方：插件维护者、Codex、Claude Code、preflight、后续执行代理。
- 约束：机器字段保持英文稳定；中文正文用于人工阅读；生成索引由脚本写回。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | `docs_index.py` 生成索引时，标签来源必须是 feature README frontmatter 的 `tags` 列表。 | 单元测试 `test_docs_index_uses_readme_frontmatter_tags_not_body_table`。 |
| REQ-002 | 必须 | feature README 必须包含 frontmatter，并声明 `title`、`status`、`feature`、`updated` 和 `tags`。 | 单元测试 `test_feature_readme_metadata_contract_rejects_missing_frontmatter`。 |
| REQ-003 | 必须 | feature README 不得维护手写 `## 产物链路` 或 `## 文档链路` 章节。 | 单元测试 `test_feature_readme_metadata_contract_rejects_handwritten_link_sections`。 |
| REQ-004 | 必须 | TDD Evidence 必须包含 frontmatter，并声明 `title`、`status`、`feature`、`created`、`updated`。 | 单元测试 `test_document_path_metadata_check_rejects_missing_evidence_metadata`。 |
| REQ-005 | 必须 | TDD Evidence frontmatter 必须在对应文档存在时声明 `related_specs`、`related_technical` 和 `related_plans`，且路径真实存在。 | `python3 scripts/preflight.py`。 |
| REQ-006 | 必须 | 文档契约说明必须明确 metadata 是关系源，正式正文只承载需求、设计、计划和证据。 | 文档评审和 `python3 scripts/preflight.py`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | README 没有 frontmatter。 | preflight 失败并指出 Feature README metadata 无效。 | 单元测试。 |
| ERR-002 | README frontmatter 的 `feature` 与路径不一致。 | preflight 失败并指出 README metadata 与路径不一致。 | 单元测试和 preflight。 |
| ERR-003 | README 正文存在手写链路章节。 | preflight 失败并指出 README 不应包含手写文档链路章节。 | 单元测试。 |
| ERR-004 | Evidence 没有 metadata 或 metadata 不完整。 | preflight 失败并指出 Evidence metadata 不完整。 | 单元测试。 |
| ERR-005 | Evidence 的 `related_*` 指向不存在的文档。 | preflight 失败并指出 Evidence related metadata 无效。 | preflight。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 生成索引 | README frontmatter 和正文表格标签不一致 | 运行 `docs_index.render_artifact_index` | 索引使用 frontmatter 标签。 |
| AC-002 | 发布前检查 | README 缺少 metadata 或保留手写链路章节 | 运行 `python3 scripts/preflight.py` | preflight 失败并指出具体文件。 |
| AC-003 | 发布前检查 | Evidence 缺少 metadata 或关联路径不完整 | 运行 `python3 scripts/preflight.py` | preflight 失败并指出具体字段。 |
| AC-004 | 文档维护 | 新增或移动 feature 文档 | 运行 `python3 scripts/preflight.py --write-index` | `INDEX.md` 按真实文件树重新生成。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_docs_index.py` | 任务 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-005 | 命令验证 | `python3 scripts/preflight.py` | 任务 2 | 已覆盖 |
| REQ-006 | 文档评审 | `docs/coding-plugins/document-contract.md` | 任务 3 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-005 | 命令验证 | `python3 scripts/preflight.py` | 任务 2 | 已覆盖 |
| AC-001 | 单元测试 | `python3 -m unittest scripts/test_docs_index.py` | 任务 1 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | 任务 2 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py` | 任务 2 | 已覆盖 |
| AC-004 | 命令验证 | `python3 scripts/preflight.py --write-index` | 任务 3 | 已覆盖 |
