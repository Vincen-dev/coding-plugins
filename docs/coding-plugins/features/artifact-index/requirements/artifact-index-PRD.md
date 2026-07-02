---
title: Coding Plugins 产物总索引
type: feature
status: approved
feature: artifact-index
doc_id: artifact-index
created: 2026-06-26
updated: 2026-07-02
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
  - docs/coding-plugins/features/preflight/requirements/preflight-PRD.md
related_technical:
  - docs/coding-plugins/features/artifact-index/technicals/artifact-index-TDD.md
  - docs/coding-plugins/features/artifact-index/technicals/artifact-index-TID.md
related_plans:
  - docs/coding-plugins/features/artifact-index/plans/artifact-index-IPD.md
related_evidence:
  - docs/coding-plugins/features/artifact-index/evidences/artifact-index-TED.md
---

# Coding Plugins 产物总索引规格

## 目标

提供一个面向维护者和使用者的总索引，把规格、计划和 TDD 证据 按 feature 聚合，降低功能数量增长后的检索成本。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不引入数据库、外部索引服务或非 Markdown 格式。 |
| NON-002 | 不要求每个 feature 都必须同时拥有 spec、technical design、implementation plan 和 evidence。 |
| NON-003 | 不从 Git 历史、文件 mtime 或网络服务推断更新时间；更新时间只来自文档 frontmatter。 |

## 背景

- 当前行为：feature-first 迁移后，规格、技术设计、计划和证据已经集中到 `docs/coding-plugins/features/{feature}/`，但总索引仍需要人工同步，容易在功能增多后产生漂移。
- 目标用户或调用方：插件维护者、实现代理、评审代理、后续接手者。
- 约束：索引文件必须是普通 Markdown 表格；preflight 校验只依赖 Python 标准库。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 仓库必须提供 `docs/coding-plugins/INDEX.md` 作为规格、计划和证据的统一检索入口。 | 单元测试 `test_artifact_index_requires_index_file`。 |
| REQ-002 | 必须 | 总索引必须包含 `领域`、`能力`、`功能根目录`、`规格`、`技术设计`、`实现计划`、`证据`、`标签`、`更新日期` 列。 | 单元测试 `test_artifact_index_requires_expected_headers`。 |
| REQ-003 | 必须 | preflight 必须校验所有真实规格文件都出现在总索引中。 | 单元测试 `test_artifact_index_requires_spec_paths`。 |
| REQ-004 | 必须 | preflight 必须校验所有计划文件都出现在总索引中。 | 单元测试 `test_artifact_index_requires_plan_paths`。 |
| REQ-005 | 必须 | preflight 必须校验所有 TDD 证据 文件都出现在总索引中。 | 单元测试 `test_artifact_index_requires_evidence_paths`。 |
| REQ-006 | 必须 | 仓库必须提供标准库实现的索引生成器，能根据 feature root、README metadata、spec、technical design、implementation plan 和 evidence 生成完整 `docs/coding-plugins/INDEX.md` 内容。 | 单元测试 `test_render_artifact_index_includes_feature_metadata_and_documents`。 |
| REQ-007 | 必须 | preflight 必须校验当前 `docs/coding-plugins/INDEX.md` 与生成器输出完全一致，防止人工编辑造成漂移。 | 单元测试 `test_artifact_index_requires_generated_content_match`。 |
| REQ-008 | 应该 | 索引生成器应该按 `Feature` 稳定排序，并在单元格内用 HTML 换行标记连接同类多文件路径。 | 单元测试 `test_render_artifact_index_sorts_rows_and_joins_multiple_files`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | `docs/coding-plugins` 下没有任何 spec、plan 或 evidence 文件。 | preflight 不要求总索引存在。 | 单元测试或函数评审。 |
| ERR-002 | 总索引缺少必需表头。 | preflight 失败并指出缺失表头。 | 单元测试 `test_artifact_index_requires_expected_headers`。 |
| ERR-003 | 新增 evidence 文件但没有更新总索引。 | preflight 失败并指出缺失路径。 | 单元测试 `test_artifact_index_requires_evidence_paths`。 |
| ERR-004 | feature README 缺少 `标签` 行。 | 生成器输出 `标签` 为 `-`，preflight 仍校验路径覆盖和内容一致。 | 单元测试 `test_render_artifact_index_handles_missing_tags`。 |
| ERR-005 | feature 没有任何 frontmatter `updated`。 | 生成器输出 `更新日期` 为 `-`，不得使用不稳定 mtime。 | 单元测试 `test_render_artifact_index_handles_missing_updated_metadata`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 使用者查找 feature 全链路产物 | 已知 feature | 打开 `docs/coding-plugins/INDEX.md` | 能看到对应 spec、plan 和 evidence 路径。 |
| AC-002 | 维护者发布前检查 | 新增或修改规格、计划、证据 | 运行 `python3 scripts/preflight.py` | 索引缺失路径或和生成器输出不一致时失败，重新生成后通过。 |
| AC-003 | 维护者刷新索引 | feature 文档结构已经变化 | 运行 `python3 scripts/preflight.py --write-index` | `docs/coding-plugins/INDEX.md` 被重写为生成器输出。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| REQ-007 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| REQ-008 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| AC-001 | 文件检查 | `docs/coding-plugins/INDEX.md` | 任务 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | 任务 3 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py --write-index` | 任务 3 | 已覆盖 |
