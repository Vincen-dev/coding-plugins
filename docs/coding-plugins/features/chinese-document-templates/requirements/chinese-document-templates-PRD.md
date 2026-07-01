---
spec_id: plugin-chinese-document-templates-feature
title: 中文文档模板展示字段规格
type: feature
status: approved
feature: chinese-document-templates
created: 2026-06-29
updated: 2026-06-29
tags:
  - docs
  - templates
  - chinese
related_code:
  - skills/writing-plans/SKILL.md
  - skills/test-driven-development/templates/tdd-evidence.md
  - skills/writing-technicals/templates/technical-design-document.md
  - skills/test-driven-development/scripts/validate_tdd_evidence.py
  - skills/writing-technicals/scripts/validate_technicals.py
  - scripts/preflight.py
related_specs: []
related_technical:
  - docs/coding-plugins/features/chinese-document-templates/technicals/chinese-document-templates-TDD.md
related_plans:
  - docs/coding-plugins/features/chinese-document-templates/plans/chinese-document-templates-IPD.md
related_evidence:
  - docs/coding-plugins/features/chinese-document-templates/evidences/chinese-document-templates-TED.md
---

# 中文文档模板展示字段规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | chinese-document-templates |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/chinese-document-templates/technicals/chinese-document-templates-TDD.md` |

## 目标

让插件内用于沉淀规格、技术设计、实现计划、TDD 证据和索引的模板与生成文档，默认使用中文章节标题、表格表头和字段标签，同时保留机器可读 metadata key、路径、命令、代码标识和稳定 ID 的英文形式。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不把 frontmatter key、路径、命令、代码符号、测试名称或协议关键字强制翻译成中文。 |
| NON-002 | 不改变 feature-first 目录结构和现有文档链路。 |
| NON-003 | 不修改插件运行时功能或 marketplace 发布逻辑。 |

## 背景

- 当前行为：`writing-plans`、`test-driven-development`、technical 映射表和 docs 索引仍保留部分英文展示字段，导致后续沉淀文档继续生成英文章节或英文表头。
- 目标用户或调用方：使用 Coding Plugins 的 Codex、Claude Code 和后续代理执行者。
- 约束：metadata key 保持英文稳定；中文化只作用于人工可读结构和说明文字。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | SDD、technical、plan、TDD 证据 模板中的 Markdown 章节标题、表格展示表头和字段标签必须使用中文。 | 单元测试 `scripts/test_preflight.py` 覆盖模板门禁；`python3 scripts/preflight.py` 覆盖真实模板。 |
| REQ-002 | 必须 | TDD 证据校验器必须以中文字段为契约，接受 `TDD 证据` 和 `TDD 例外记录`，拒绝旧的英文展示字段。 | 单元测试 `skills/test-driven-development/scripts/test_validate_tdd_evidence.py`。 |
| REQ-003 | 必须 | Technical design 校验器必须以中文映射表头为契约，使用 `规格 ID` 和 `证据`，拒绝旧的 `Spec ID` 和 `Evidence` 表头。 | 单元测试 `skills/writing-technicals/scripts/test_validate_technicals.py`。 |
| REQ-004 | 必须 | feature 索引和轻量例外 README 表格必须使用中文表头，便于所有沉淀文档保持中文展示结构。 | 单元测试 `scripts/test_preflight.py` 和 `scripts/test_docs_index.py`。 |
| REQ-005 | 必须 | 既有 feature-first 沉淀文档必须迁移为中文展示字段，避免旧文档成为后续复制来源。 | `python3 scripts/preflight.py --write-index` 和 `python3 scripts/preflight.py`。 |
| REQ-006 | 必须 | metadata frontmatter key、状态枚举、路径、命令、代码符号、测试名称、Spec ID、TD ID 和 HTTP/JSON 等工程标识必须允许保留英文。 | 单元测试和 preflight 不应因为这些机器可读或工程标识失败。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 模板中重新出现 `Goal`、`Task N`、`规格/缺陷/验收`、`最终验证` 等英文展示字段 | preflight 失败并指出对应模板。 | `scripts/test_preflight.py`。 |
| ERR-002 | TDD 证据 文件只使用旧英文 evidence 字段 | TDD 证据 校验失败。 | `skills/test-driven-development/scripts/test_validate_tdd_evidence.py`。 |
| ERR-003 | Technical design 使用旧英文映射表头 | Technical validator 校验失败。 | `skills/writing-technicals/scripts/test_validate_technicals.py`。 |
| ERR-004 | 索引或轻量例外 README 使用英文表头 | preflight 或 docs index 校验失败。 | `scripts/test_preflight.py`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 新建 TDD 证据 | 模板已更新 | 使用 TDD 证据 模板 | 文件包含 `TDD 证据`、`规格/缺陷/验收`、`最终验证` 等中文字段。 |
| AC-002 | 新建 technical design | 模板和 validator 已更新 | 使用 technical 模板并运行 validator | 映射表头为 `规格 ID` 和 `证据`，validator 通过。 |
| AC-003 | 新建 implementation plan | `writing-plans` 已更新 | 使用计划模板 | 计划标题、任务结构、字段标签和追踪表头均为中文。 |
| AC-004 | 运行全量门禁 | 既有文档已迁移 | 执行 `python3 scripts/preflight.py` | preflight 通过，且不会因为 metadata key 或工程标识为英文而失败。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试、仓库校验 | `python3 -m unittest scripts/test_preflight.py`、`python3 scripts/preflight.py` | 任务 1、任务 2、任务 3 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 任务 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest skills/writing-technicals/scripts/test_validate_technicals.py` | 任务 1 | 已覆盖 |
| REQ-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py`、`python3 -m unittest scripts/test_docs_index.py` | 任务 1、任务 2 | 已覆盖 |
| REQ-005 | 仓库校验 | `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py` | 任务 3 | 已覆盖 |
| REQ-006 | 单元测试、仓库校验 | `python3 -m unittest scripts/test_preflight.py`、`python3 scripts/preflight.py` | 任务 1、任务 3 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 任务 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest skills/writing-technicals/scripts/test_validate_technicals.py` | 任务 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1、任务 2 | 已覆盖 |
| AC-001 | 人工审查、仓库校验 | `skills/test-driven-development/templates/tdd-evidence.md`、`python3 scripts/preflight.py` | 任务 2 | 已覆盖 |
| AC-002 | 单元测试 | `python3 -m unittest skills/writing-technicals/scripts/test_validate_technicals.py` | 任务 1、任务 2 | 已覆盖 |
| AC-003 | 人工审查、仓库校验 | `skills/writing-plans/SKILL.md`、`python3 scripts/preflight.py` | 任务 2 | 已覆盖 |
| AC-004 | 仓库校验 | `python3 scripts/preflight.py` | 任务 4 | 已覆盖 |
