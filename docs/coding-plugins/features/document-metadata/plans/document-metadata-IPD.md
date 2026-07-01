---
title: 文档元数据规则和技能化实现计划
status: approved
feature: document-metadata
created: 2026-06-26
updated: 2026-07-01
related_specs:
  - docs/coding-plugins/features/document-metadata/requirements/document-metadata-PRD.md
related_technical:
  - docs/coding-plugins/features/document-metadata/technicals/document-metadata-TDD.md
related_evidence:
  - docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md
---

# 文档元数据规则和技能化 实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | document-metadata |
| 需求文档 | `docs/coding-plugins/features/document-metadata/requirements/document-metadata-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/document-metadata/technicals/document-metadata-TDD.md` |
| TDD 证据 | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 优化文档 metadata 表达，让 Plan 也具备机器 frontmatter 和中文摘要，并补充 `document-metadata` skill 作为 metadata 规则入口。

**架构:** 保持机器 key 英文稳定，在正文用中文 `文档信息` 表提供人工可读摘要。preflight 同时校验机器 metadata 和中文摘要。新增 `document-metadata` skill 和模板，用于把 README、spec、technical、plan 和 evidence 的关联关系固定在 frontmatter。

**技术栈:** Python 标准库、Markdown 文档、Codex/Claude skills。

**规格来源:** `docs/coding-plugins/features/document-metadata/requirements/document-metadata-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/document-metadata/technicals/document-metadata-TDD.md`

## 技术设计快照

本计划执行 technical design 中的 metadata 双层模型：frontmatter 保持脚本稳定，中文摘要面向维护者阅读。实现重点是 Plan metadata 校验、中文摘要校验、模板更新和现有 Plan 回填。

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_plan_metadata_check_rejects_missing_frontmatter` | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_plan_metadata_check_rejects_mismatched_path_metadata` | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_document_info_check_rejects_missing_chinese_summary` | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-004 | `python3 scripts/preflight.py` | technical template includes `文档信息` | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / 最终验证 | 任务 2 |
| REQ-005 | `python3 scripts/preflight.py` | plan template includes frontmatter and `文档信息` | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / 最终验证 | 任务 2 |
| REQ-006 | `python3 scripts/preflight.py` | full preflight passes | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / 最终验证 | 任务 3 |
| REQ-007 | `python3 -m unittest tests.behavior.test_routing` | using entry and Claude namespace cover `document-metadata` | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / 任务 3 | 任务 4 |
| REQ-008 | `python3 scripts/preflight.py` | skill template and agent metadata pass plugin checks | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / 任务 3 | 任务 4 |
| REQ-009 | `rg "document-metadata" skills docs README.md` | primary document skills reference metadata skill | `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md` / 任务 3 | 任务 4 |

## 任务 1： Plan metadata and Chinese summary checks

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-006, ERR-001, ERR-002, ERR-003, ERR-004

**文件:**
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`

- [x] **步骤 1：Write failing tests**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: FAIL because Plan metadata and Chinese summary checks do not exist.

- [x] **步骤 2：Implement preflight checks**

Add Plan frontmatter validation, path metadata validation and Chinese `文档信息` validation.

- [x] **步骤 3：Run tests**

运行: `python3 -m unittest scripts/test_preflight.py`
预期: PASS.

## 任务 2： Template and existing Plan updates

**规格 ID:** REQ-004, REQ-005, AC-001

**文件:**
- 修改: `skills/writing-plans/SKILL.md`
- 修改: `skills/writing-technicals/templates/technical-design-document.md`
- 修改: `docs/coding-plugins/features/technical-design-artifacts/plans/technical-design-artifacts-IPD.md`
- 修改: `docs/coding-plugins/features/document-metadata/plans/document-metadata-IPD.md`

- [x] **步骤 1：Update templates**

Add frontmatter and `## 文档信息` to plan template, and add `## 文档信息` to technical design template.

- [x] **步骤 2：Backfill existing plans**

Ensure existing plan docs include frontmatter and Chinese summary.

## 任务 3： 最终验证

**规格 ID:** AC-002

**文件:**
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: `docs/coding-plugins/INDEX.md`
- 创建: `docs/coding-plugins/features/document-metadata/evidences/document-metadata-TED.md`

- [x] **步骤 1：Update indexes and evidence**

Add document-metadata rows and record TDD 证据.

- [x] **步骤 2：Run final verification**

运行: `python3 scripts/preflight.py`
预期: PASS.

## 任务 4：Document metadata skill and template

**规格 ID:** REQ-007, REQ-008, REQ-009, AC-003

**文件:**
- 创建: `skills/document-metadata/SKILL.md`
- 创建: `skills/document-metadata/templates/document-metadata.md`
- 创建: `skills/document-metadata/agents/openai.yaml`
- 修改: `skills/using-coding-plugins/SKILL.md`
- 修改: `skills/using-coding-plugins/references/claude-tools.md`
- 修改: `skills/spec-driven-development/SKILL.md`
- 修改: `skills/writing-technicals/SKILL.md`
- 修改: `skills/writing-plans/SKILL.md`
- 修改: `skills/test-driven-development/SKILL.md`
- 修改: `README.md`
- 修改: `docs/workflow-chain.md`
- 修改: `docs/coding-plugins/document-contract.md`
- 修改: `tests/behavior/test_routing.py`

- [x] **步骤 1：Create metadata skill**

新增 `document-metadata` skill，强调先读 README 和目标文档 frontmatter，再按 `related_*` 追链，最后阅读正文。

- [x] **步骤 2：Create document-metadata template**

新增 `document-metadata.md` 模板，覆盖通用、Spec、Technical、Plan、Evidence 和 Archived evidence frontmatter。

- [x] **步骤 3：Wire skill references**

入口技能、Claude namespace、SDD、Technical、Plan 和 TDD 文档链路统一指向 `document-metadata`。

- [x] **步骤 4：Validate**

运行行为测试、preflight 和 source scan，确认 skill 可发现、模板存在、metadata-first 规则可被后续代理读取。
