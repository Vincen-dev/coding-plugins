---
title: 文档契约和 metadata-first 读取规则 TDD 证据
status: approved
area: plugin
capability: document-contract
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/document-contract/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/document-contract/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/plugin/document-contract/plans/implementation.md
---

# 文档契约和 metadata-first 读取规则 TDD 证据

## 任务 1：工具层契约测试和实现

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-003, REQ-004, AC-001, AC-002, AC-003
- **RED 测试:** `scripts/test_docs_index.py::DocsIndexTests.test_docs_index_uses_readme_frontmatter_tags_not_body_table`、`scripts/test_preflight.py::PreflightTests.test_feature_readme_metadata_contract_rejects_missing_frontmatter`、`test_feature_readme_metadata_contract_rejects_handwritten_link_sections`、`test_document_path_metadata_check_rejects_missing_evidence_metadata`
- **RED 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
- **RED 失败:** 2 个索引断言失败，3 个 preflight 测试因缺少 README/Evidence metadata 校验入口而报错。
- **GREEN 变更:** `docs_index.py` 改为从 README frontmatter `tags` 读取标签；`preflight.py` 增加 README metadata 和 Evidence metadata 校验并接入静态检查；测试 fixture 迁移到 frontmatter 契约。
- **GREEN 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
- **REFACTOR 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
- **最终验证:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` PASS。

## 任务 2：迁移现有 README 和 Evidence

### TDD 证据

- **规格/缺陷/验收:** REQ-002, REQ-003, REQ-004, REQ-005, AC-004
- **RED 测试:** `python3 scripts/preflight.py --write-index`
- **RED 命令:** `python3 scripts/preflight.py --write-index`
- **RED 失败:** 在迁移前，新 preflight 契约会拒绝缺少 README frontmatter、Evidence frontmatter 和手写链路章节的历史文档。
- **GREEN 变更:** 为所有 feature README 补齐 frontmatter，删除 README 手写链路章节，为所有 TDD Evidence 补齐基础 metadata 和存在的 related 路径。
- **GREEN 命令:** `python3 scripts/preflight.py --write-index`
- **REFACTOR 命令:** `python3 scripts/preflight.py --write-index`
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS。

## 任务 3：文档契约和技能入口同步

### TDD 证据

- **规格/缺陷/验收:** REQ-006
- **RED 测试:** 文档评审：`docs/coding-plugins/document-contract.md` 不存在，技能入口没有强制 metadata-first 读取顺序。
- **RED 命令:** `rg -n "metadata-first|document-contract|related_\\*" docs README.md skills`
- **RED 失败:** 搜索不到独立文档契约说明，也没有统一的 metadata-first 入口规则。
- **GREEN 变更:** 新增文档契约说明，更新 README、workflow、installation、SDD、Technical、Plan、TDD 入口和相关模板。
- **GREEN 命令:** `python3 scripts/preflight.py`
- **REFACTOR 命令:** `python3 scripts/preflight.py`
- **最终验证:** `python3 scripts/preflight.py` PASS。
