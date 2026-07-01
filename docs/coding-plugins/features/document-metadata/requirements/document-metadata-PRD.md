---
title: 文档元数据规则和技能化
type: feature
status: approved
feature: document-metadata
doc_id: document-metadata
created: 2026-06-26
updated: 2026-07-01
tags:
  - metadata
  - chinese
  - plan
  - preflight
  - skill
  - template
related_code:
  - scripts/preflight.py
  - scripts/test_preflight.py
  - scripts/docs_index.py
  - skills/document-metadata/SKILL.md
  - skills/document-metadata/templates/document-metadata.md
  - skills/spec-driven-development/scripts/scaffold_feature_docs.py
  - skills/writing-requirements/SKILL.md
  - skills/writing-requirements/templates/product-requirements-document.md
  - skills/writing-plans/SKILL.md
  - skills/writing-technicals/templates/technical-design-document.md
related_specs:
  - docs/coding-plugins/features/technical-design-artifacts/requirements/technical-design-artifacts-PRD.md
related_technical:
  - docs/coding-plugins/features/document-metadata/technicals/document-metadata-TDD.md
related_plans:
  - docs/coding-plugins/features/document-metadata/plans/document-metadata-IPD.md
related_evidence:
  - docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md
---

# 文档元数据规则和技能化规格

## 目标

统一 Spec、Technical Design、Plan、README 和 Evidence 的元数据表达：机器可读 frontmatter 保持稳定英文 key，正文提供中文 `文档信息` 摘要；新增 `document-metadata` skill 作为文档 metadata 的操作入口，并用 `document-metadata.md` 模板把各类文档关联起来。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | document-metadata |
| Doc ID | document-metadata |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/document-metadata/technicals/document-metadata-TDD.md` |

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
| REQ-001 | 必须 | Plan 文档必须包含 frontmatter，并声明 `title`、`status`、`feature`、`created`、`updated`。 | 单元测试 `test_plan_metadata_check_rejects_missing_frontmatter`。 |
| REQ-002 | 必须 | Plan frontmatter 的 `feature` 必须与 `features/document-metadata/plans/document-metadata-IPD.md` 这类 feature-first 分层路径一致。 | 单元测试 `test_plan_metadata_check_rejects_mismatched_path_metadata`。 |
| REQ-003 | 必须 | Plan 文档必须包含中文 `## 文档信息` 摘要表。 | 单元测试 `test_document_info_check_rejects_missing_chinese_summary`。 |
| REQ-004 | 必须 | Technical Design 模板必须包含中文 `## 文档信息` 摘要表。 | 文档评审和 preflight。 |
| REQ-005 | 必须 | `writing-plans` 计划模板必须包含 frontmatter 和中文 `## 文档信息` 摘要表。 | 文档评审和 preflight。 |
| REQ-006 | 必须 | preflight 必须校验 Plan metadata、路径一致性和中文摘要。 | `python3 scripts/preflight.py`。 |
| REQ-007 | 必须 | 插件必须提供 `document-metadata` skill，明确读取文档时先读 frontmatter metadata，再读正文。 | `python3 -m unittest tests.behavior.test_routing` 和文档评审。 |
| REQ-008 | 必须 | 插件必须提供 `document-metadata.md` 模板，覆盖 README、Spec、Technical、Plan、Evidence 和 Archived evidence 的 metadata 关系。 | 文档评审和 preflight。 |
| REQ-009 | 必须 | 入口技能和 SDD/TDD/Technical/Plan 技能必须把文档关系读取导向 `document-metadata`。 | `python3 -m unittest tests.behavior.test_routing` 和 `rg` 检查。 |
| REQ-010 | 必须 | preflight 必须按 metadata 关系校验文档同步新鲜度：PRD、TDD、TID、TCD、IPD 的下游文档 `updated` 不得早于上游文档。 | 单元测试 `test_document_sync_freshness_rejects_stale_downstream_doc`。 |
| REQ-011 | 必须 | 文档 metadata 必须区分 `feature` 与 `doc_id`：`feature` 表示模块目录，`doc_id` 表示同一 feature 下的具体文档链路，索引、preflight 和模板按 `doc_id` 关联 PRD、TDD、TID、TCD、IPD、TED。 | 单元测试 `test_docs_index_renders_one_row_per_doc_id`、`test_feature_document_chain_closure_is_scoped_by_doc_id`、`test_document_sync_freshness_is_scoped_by_doc_id`。 |
| REQ-012 | 必须 | PRD 不再使用文档级 `spec_id` metadata；文档链路唯一标识统一由 `doc_id` 承担，具体需求条目仍使用正文中的 `REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON-xxx`。 | 单元测试 `test_prd_doc_id_metadata_is_required`、`test_prd_doc_id_metadata_must_match_filename` 和脚手架测试。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | Plan 没有 frontmatter。 | preflight 失败并指出缺少 Plan metadata。 | 单元测试。 |
| ERR-002 | Plan metadata 与路径不一致。 | preflight 失败并指出 feature 不一致。 | 单元测试。 |
| ERR-003 | Plan 没有中文 `文档信息` 摘要。 | preflight 失败并指出缺少中文文档信息。 | 单元测试。 |
| ERR-004 | 文档存在机器 frontmatter 但中文摘要缺少状态或 Feature。 | preflight 失败并指出中文文档信息不完整。 | 单元测试。 |
| ERR-005 | 新增 skill 缺少 Codex 展示 metadata。 | preflight 失败并指出缺少 `agents/openai.yaml`。 | `python3 scripts/preflight.py`。 |
| ERR-006 | PRD、TDD、TID、TCD 或 IPD 的 `updated` 晚于相关下游文档。 | preflight 失败并指出下游文档早于上游文档，需要同步更新或同步评审。 | 单元测试。 |
| ERR-007 | 同一 feature 下存在多条 PRD 链路，但 metadata、索引或校验按 feature 全局混合。 | preflight 和 validator 只比较同一 `doc_id` 的上下游文档；跨链路依赖必须显式写入 `related_specs`。 | 单元测试。 |
| ERR-008 | PRD 缺少 `doc_id`，或 `doc_id` 与 `routing-login-PRD.md` 这类文件名前缀不一致。 | preflight 失败并提示 doc_id metadata 缺失或与路径不一致。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 创建新计划 | 已有 Spec 和 Technical Design | 使用 `writing-plans` 生成 plan | plan 同时包含 frontmatter 和中文 `文档信息`。 |
| AC-002 | 发布前检查 | 仓库存在 plan 文档 | 运行 `python3 scripts/preflight.py` | 缺少 Plan metadata 或中文摘要时失败。 |
| AC-003 | 读取 feature 文档 | 仓库存在 README/spec/technical/plan/evidence | 使用 `document-metadata` | 先根据 frontmatter 和 `related_*` 建立关系，再阅读正文。 |
| AC-004 | 上游文档变更后发布前检查 | PRD、TDD、TID、TCD 或 IPD 更新晚于下游文档 | 运行 `python3 scripts/preflight.py` | preflight 阻止发布并提示需要同步下游文档。 |
| AC-005 | 同一 feature 下多需求链路 | `features/routing` 同时存在 `routing-login-PRD.md` 和 `routing-register-PRD.md` | 运行 `python3 scripts/preflight.py --write-index` 和 `python3 scripts/preflight.py` | INDEX 按 Doc ID 分行，链路闭包、metadata relation、同步新鲜度和 technical coverage 只检查对应 `doc_id`。 |
| AC-006 | 新建 PRD 文档 | 使用 SDD scaffold 或 writing-requirements 模板创建 PRD | 查看 frontmatter | 文档包含 `doc_id`，不包含文档级 `spec_id`。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 文档评审 | `skills/writing-technicals/templates/technical-design-document.md` | Task 2 | 已覆盖 |
| REQ-005 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 2 | 已覆盖 |
| REQ-006 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| REQ-007 | 行为测试 / 文档评审 | `python3 -m unittest tests.behavior.test_routing` | Task 4 | 已覆盖 |
| REQ-008 | 文档评审 | `skills/document-metadata/templates/document-metadata.md` | Task 4 | 已覆盖 |
| REQ-009 | 行为测试 / source scan | `python3 -m unittest tests.behavior.test_routing` / `rg "document-metadata" skills docs README.md` | Task 4 | 已覆盖 |
| REQ-010 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 5 | 已覆盖 |
| REQ-011 | 单元测试 | `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py skills/writing-technicals/scripts/test_validate_technicals.py skills/spec-driven-development/scripts/test_scaffold_feature_docs.py` | Task 6 | 已覆盖 |
| REQ-012 | 单元测试 | `python3 -m unittest scripts/test_preflight.py skills/spec-driven-development/scripts/test_scaffold_feature_docs.py` | Task 7 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-005 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| ERR-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 5 | 已覆盖 |
| ERR-007 | 单元测试 | `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py skills/writing-technicals/scripts/test_validate_technicals.py` | Task 6 | 已覆盖 |
| ERR-008 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 7 | 已覆盖 |
| AC-001 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| AC-003 | 文档评审 | `skills/document-metadata/SKILL.md` | Task 4 | 已覆盖 |
| AC-004 | 命令验证 | `python3 scripts/preflight.py` | Task 5 | 已覆盖 |
| AC-005 | 命令验证 | `python3 scripts/preflight.py --write-index && python3 scripts/preflight.py` | Task 6 | 已覆盖 |
| AC-006 | 文档评审 / 单元测试 | `rg "^spec_id:" skills docs` / `python3 -m unittest skills/spec-driven-development/scripts/test_scaffold_feature_docs.py` | Task 7 | 已覆盖 |
