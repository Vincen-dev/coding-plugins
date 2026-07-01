---
title: 文档元数据规则和技能化
status: approved
feature: document-metadata
doc_id: document-metadata
created: 2026-06-29
updated: 2026-07-01
related_specs:
  - docs/coding-plugins/features/document-metadata/requirements/document-metadata-PRD.md
related_technical:
  - docs/coding-plugins/features/document-metadata/technicals/document-metadata-TDD.md
related_plans:
  - docs/coding-plugins/features/document-metadata/plans/document-metadata-IPD.md
---
# 文档元数据规则和技能化

## 任务 1： Plan metadata and Chinese summary checks

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / REQ-003 / REQ-006 / ERR-001 / ERR-002 / ERR-003 / ERR-004
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_plan_metadata_check_rejects_missing_frontmatter`、`test_plan_metadata_check_rejects_mismatched_path_metadata`、`test_document_info_check_rejects_missing_chinese_summary`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** preflight 单测失败于缺少 Plan metadata 校验和中文 `文档信息` 摘要校验函数。
- **GREEN 变更:** 新增 Plan frontmatter 必填字段校验、路径一致性校验和中文 `文档信息` 摘要校验。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 2： Template and existing Plan updates

### TDD 证据

- **规格/缺陷/验收:** REQ-004 / REQ-005 / AC-001 / AC-002
- **RED 测试:** `python3 scripts/preflight.py`
- **RED 命令:** `python3 scripts/preflight.py`
- **RED 失败:** 完整 preflight 会在现有 Plan 缺少 frontmatter 或中文摘要时失败。
- **GREEN 变更:** 更新 `writing-plans` 计划模板、technical design 模板，并回填现有 Plan 文档 metadata 与中文 `文档信息`。
- **GREEN 命令:** `python3 scripts/preflight.py` PASS
- **REFACTOR 命令:** `python3 scripts/preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 3：Document metadata skill and template

### TDD 证据

- **规格/缺陷/验收:** REQ-007 / REQ-008 / REQ-009 / AC-003
- **测试类型:** behavior
- **RED 测试:** `tests/behavior/test_routing.py::RoutingBehaviorTests.test_using_entry_routes_direct_intents_to_required_skills`
- **RED 命令:** `python3 -m unittest tests.behavior.test_routing`
- **RED 失败:** 新增 `document-metadata` skill 之前，入口路由和 Claude namespace 没有该技能，代理仍只能依赖分散的文档契约。
- **GREEN 变更:** 新增 `skills/document-metadata/SKILL.md`、`skills/document-metadata/templates/document-metadata.md` 和 `skills/document-metadata/agents/openai.yaml`；入口技能、Claude namespace、SDD、TDD、Technical、Plan、README、workflow-chain 和 document-contract 都指向 `document-metadata`。
- **GREEN 命令:** `python3 -m unittest tests.behavior.test_routing`
- **REFACTOR 命令:** `rg "document-metadata" skills docs README.md`
- **最终验证:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`。

## 任务 4：Document sync freshness gate

### TDD 证据

- **规格/缺陷/验收:** REQ-010 / ERR-006 / AC-004
- **测试类型:** unit
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_document_sync_freshness_rejects_stale_downstream_doc`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** 新增测试期望 preflight 拦截上游 PRD 晚于下游 TDD、TCD 晚于 IPD 的情况，但旧 preflight 没有文档同步新鲜度校验。
- **GREEN 变更:** `scripts/preflight.py` 新增 `check_document_sync_freshness`，按 `PRD -> TDD -> TID -> TCD -> IPD -> TED` 依赖图比较 `updated`；`document-metadata` skill 和模板补充同步更新规则。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 -m py_compile scripts/preflight.py` PASS；`git diff --check` PASS
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS。

## 任务 5：Doc ID scoped document chains

### TDD 证据

- **规格/缺陷/验收:** REQ-011 / ERR-007 / AC-005
- **测试类型:** unit
- **RED 测试:** `scripts/test_docs_index.py::DocsIndexTests.test_docs_index_renders_one_row_per_doc_id`、`scripts/test_preflight.py::PreflightTests.test_feature_document_chain_closure_is_scoped_by_doc_id`、`test_document_sync_freshness_is_scoped_by_doc_id`、`skills/writing-technicals/scripts/test_validate_technicals.py::TechnicalDesignValidatorTests.test_validator_scopes_must_coverage_to_related_doc_chain`
- **RED 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py skills/writing-technicals/scripts/test_validate_technicals.py skills/spec-driven-development/scripts/test_scaffold_feature_docs.py`
- **RED 失败:** 旧规则按 feature 全局聚合需求链路，无法表达一个 feature 模块下多个 PRD 独立沉淀的情况。
- **GREEN 变更:** `docs_index.py` 增加 Doc ID 分行索引；`preflight.py` 按 doc_id 限定链路闭包、related metadata、technical coverage 和 freshness；technical validator 与 scaffold 支持同一规则。
- **GREEN 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py skills/writing-technicals/scripts/test_validate_technicals.py skills/spec-driven-development/scripts/test_scaffold_feature_docs.py` PASS
- **REFACTOR 命令:** `python3 -m py_compile scripts/preflight.py scripts/docs_index.py skills/writing-technicals/scripts/validate_technicals.py skills/spec-driven-development/scripts/scaffold_feature_docs.py` PASS
- **最终验证:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`。

## 任务 6：Remove PRD document-level spec_id

### TDD 证据

- **规格/缺陷/验收:** REQ-012 / ERR-008 / AC-006
- **测试类型:** unit
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_prd_doc_id_metadata_is_required`、`test_prd_doc_id_metadata_must_match_filename`、`test_optional_downstream_doc_id_metadata_must_match_filename`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py skills/spec-driven-development/scripts/test_scaffold_feature_docs.py`
- **RED 失败:** 旧规则没有要求 PRD `doc_id` 必填，脚手架和模板仍输出文档级 `spec_id`。
- **GREEN 变更:** 新增 `check_document_doc_id_metadata`；脚手架、模板和真实 PRD 移除文档级 `spec_id`，统一使用 `doc_id` 表达文档链路。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py skills/spec-driven-development/scripts/test_scaffold_feature_docs.py` PASS
- **REFACTOR 命令:** `python3 -m py_compile scripts/preflight.py skills/spec-driven-development/scripts/scaffold_feature_docs.py` PASS；`rg "^spec_id:" .` 无结果
- **最终验证:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`。

## 任务 7：Centralized metadata registry hardening

### TDD 证据

- **规格/缺陷/验收:** metadata 规则中心化优化：全链路 `doc_id` 必填、路径规则从 registry 推导、所有 artifact 统一校验 `related_*`。
- **测试类型:** unit
- **RED 测试:** `scripts.test_document_metadata.DocumentMetadataTests.test_registry_defines_active_document_artifacts`、`test_filename_patterns_are_derived_from_registry`、`scripts.test_preflight.PreflightTests.test_all_artifact_metadata_requires_related_chain_paths`、`skills/spec-driven-development/scripts/test_scaffold_feature_docs.py::ScaffoldFeatureDocsTests.test_creates_artifact_directories_from_metadata_registry`
- **RED 命令:** `python3 -m unittest scripts.test_document_metadata`、`python3 -m unittest scripts.test_preflight.PreflightTests.test_all_artifact_metadata_requires_related_chain_paths`、`python3 -m unittest skills/spec-driven-development/scripts/test_scaffold_feature_docs.py`
- **RED 失败:** `document_metadata` 尚未要求 TDD/TID/TCD/IPD/TED 声明 `doc_id`，没有 `filename_patterns_by_directory()`；`preflight` 没有统一 `check_document_related_metadata()`；scaffold 仍手写 artifact 目录。
- **GREEN 变更:** `DocumentArtifact.doc_id_required` 改为全链路默认必填；新增 registry 派生的 artifact 目录和文件名 pattern；`preflight` 使用 registry 校验路径并新增全 artifact `related_*` 校验；scaffold 使用 registry 创建目录和 PRD 路径；历史 TDD/IPD/TED 文档补齐 `doc_id`。
- **GREEN 命令:** `python3 -m unittest scripts.test_document_metadata scripts.test_preflight skills.spec-driven-development.scripts.test_scaffold_feature_docs skills.writing-technicals.scripts.test_validate_technicals` PASS
- **REFACTOR 命令:** `git diff --check` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 8：Frontmatter parser centralization

### TDD 证据

- **规格/缺陷/验收:** metadata 规则继续中心化：frontmatter 拆分、解析、渲染必须由 `document_metadata.py` 统一提供；迁移脚本不能保留第二套解析实现；空列表 `related_*: []` 必须按空列表处理，不能误判为 scalar 或字符串值。
- **测试类型:** unit
- **RED 测试:** `scripts.test_document_metadata.DocumentMetadataTests.test_frontmatter_block_round_trips_scalars_and_lists`、`test_frontmatter_compat_helpers_use_central_parser`
- **RED 命令:** `python3 -m unittest scripts.test_document_metadata`
- **RED 失败:** `document_metadata` 尚未提供 `split_frontmatter`、`parse_frontmatter_block`、`render_frontmatter_block`；兼容 helper 会把 `related_specs:` 和 `related_technical: []` 误解析成 scalar。
- **GREEN 变更:** 新增 `Frontmatter` 数据结构和集中 frontmatter split/parse/render helper；`parse_frontmatter`、`frontmatter_list_values` 改为复用集中 parser，并正确处理空列表。
- **GREEN 命令:** `python3 -m unittest scripts.test_document_metadata` PASS
- **REFACTOR 变更:** `migrate_document_contract.py` 移除本地重复的 frontmatter split/parse/render，统一调用 `document_metadata`。
- **REFACTOR 命令:** `python3 -m unittest scripts.test_document_metadata scripts.test_document_contract_migration` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS。
