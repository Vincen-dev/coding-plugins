---
title: 文档元数据规则和技能化
status: approved
feature: document-metadata
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
