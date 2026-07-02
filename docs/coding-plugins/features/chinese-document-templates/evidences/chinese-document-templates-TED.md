---
title: 中文文档模板展示字段 TDD 证据
status: approved
feature: chinese-document-templates
doc_id: chinese-document-templates
created: 2026-06-29
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/chinese-document-templates/requirements/chinese-document-templates-PRD.md
related_technical:
  - docs/coding-plugins/features/chinese-document-templates/technicals/chinese-document-templates-TDD.md
  - docs/coding-plugins/features/chinese-document-templates/technicals/chinese-document-templates-TID.md
related_plans:
  - docs/coding-plugins/features/chinese-document-templates/plans/chinese-document-templates-IPD.md
---

# 中文文档模板展示字段 TDD 证据

## 任务 1：更新校验器和 RED/GREEN 单测

### TDD 证据

- **规格/缺陷/验收:** REQ-002, REQ-003, REQ-004, ERR-002, ERR-003, ERR-004
- **RED 测试:** `skills/test-driven-development/scripts/test_validate_tdd_evidence.py`、`skills/writing-technicals/scripts/test_validate_technicals.py`、`scripts/test_preflight.py`
- **RED 命令:** `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py`; `python3 -m unittest skills/writing-technicals/scripts/test_validate_technicals.py`; `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** TDD 证据校验器仍只识别旧英文结构，technical 校验器仍要求旧英文映射表头，preflight 尚未实现 plan 和 TDD 证据模板中文检查函数。
- **GREEN 变更:** `validate_tdd_evidence.py` 改为中文 TDD 证据字段契约，`validate_technicals.py` 改为中文 technical 映射表头，`preflight.py` 增加 plan/TDD 模板中文门禁，`docs_index.py` 生成中文索引表头。
- **GREEN 命令:** `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py skills/writing-technicals/scripts/test_validate_technicals.py` PASS；`python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` PASS。
- **REFACTOR 命令:** `python3 scripts/preflight.py --write-index` PASS。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 2：中文化模板源头

### TDD 证据

- **规格/缺陷/验收:** REQ-001, AC-001, AC-002, AC-003, ERR-001
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_plan_template_check_rejects_english_headings`、`scripts/test_preflight.py::PreflightTests.test_tdd_evidence_template_check_rejects_english_fields`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** preflight 起初没有 plan/TDD 模板中文检查函数；模板源头仍包含英文展示字段。
- **GREEN 变更:** `writing-plans`、`test-driven-development`、`writing-technicals` 和 SDD 模板源头改为中文标题、表头和字段标签。
- **GREEN 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` PASS。
- **REFACTOR 命令:** `rg` 残留扫描确认模板源头没有旧英文展示字段。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 3：迁移既有沉淀文档

### TDD 证据

- **规格/缺陷/验收:** REQ-005, REQ-006, AC-004
- **RED 测试:** `python3 scripts/preflight.py --write-index`
- **RED 命令:** `python3 scripts/preflight.py --write-index`
- **RED 失败:** 迁移过程中 preflight 先暴露轻量例外 README 仍缺少中文 `验证方式` 字段，随后暴露新增 technical 设计引用了未声明的 `TD-006`。
- **GREEN 变更:** 既有 feature-first README、plan、technical、evidence、索引和相关 workflow 文档迁移为中文展示字段，并补齐 `TD-006` 关键决策。
- **GREEN 命令:** `python3 scripts/preflight.py --write-index` PASS。
- **REFACTOR 命令:** 残留扫描只剩 preflight 黑名单常量、测试反例和允许保留的工程标识。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 4：最终验证、提交和刷新本地插件

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, AC-004
- **RED 测试:** `python3 scripts/preflight.py`
- **RED 命令:** `python3 scripts/preflight.py`
- **RED 失败:** 本任务没有新的失败实现点；使用任务 1 到任务 3 的 RED 失败作为行为证据，最终阶段只验证完整链路。
- **GREEN 变更:** 写回 evidence 和计划状态，提交并推送到远程 main，随后刷新本地 personal 插件安装。
- **GREEN 命令:** `python3 scripts/preflight.py` PASS。
- **REFACTOR 命令:** `python3 scripts/preflight.py` PASS。
- **最终验证:** `python3 scripts/preflight.py` PASS。
