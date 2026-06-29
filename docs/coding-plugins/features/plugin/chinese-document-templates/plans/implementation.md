---
title: 中文文档模板展示字段实现计划
status: approved
area: plugin
capability: chinese-document-templates
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/chinese-document-templates/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/chinese-document-templates/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md
---

# 中文文档模板展示字段实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | chinese-document-templates |
| 规格 | `docs/coding-plugins/features/plugin/chinese-document-templates/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/chinese-document-templates/technical/technical-design.md` |
| TDD 证据 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 在当前会话按任务实现本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** 让插件的模板、校验器、索引和既有沉淀文档统一使用中文展示字段。

**架构:** 校验契约先改为中文字段，再迁移模板和真实文档。preflight 负责防止模板源头重新出现英文展示结构。

**技术栈:** Python unittest、Markdown 模板、feature-first docs、Codex plugin scripts。

**规格来源:** `docs/coding-plugins/features/plugin/chinese-document-templates/specs/feature.md`

**技术设计来源:** `docs/coding-plugins/features/plugin/chinese-document-templates/technical/technical-design.md`

## 技术设计快照

**设计摘要:** TDD evidence、technical mapping、plan 模板、轻量例外和 docs index 统一使用中文标题和表头。metadata key、路径、命令、代码符号和稳定 ID 仍保留英文。preflight 增加模板门禁，真实文档通过 validators 和 docs index 校验闭环。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 中文字段作为唯一新展示契约 | 用户要求所有模板展示描述中文化 | 需要迁移历史 evidence 和 technical 文档 |
| preflight 检查模板源头 | 防止后续复制旧英文结构 | 黑名单需要持续维护 |
| 索引表头同步中文化 | 索引属于沉淀文档，不应继续显示英文表头 | docs index 单测要同步更新 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `skills/test-driven-development/scripts/validate_tdd_evidence.py` | 使用中文 evidence heading 和字段契约 | REQ-002 |
| `skills/writing-technical-design/scripts/validate_technical_design.py` | technical 映射表头改中文 | REQ-003 |
| `scripts/preflight.py`、`scripts/docs_index.py` | 增加中文模板门禁并生成中文索引 | REQ-001, REQ-004 |
| `skills/*`、`docs/coding-plugins/features/plugin/**` | 模板和既有沉淀文档展示字段迁移中文 | REQ-001, REQ-005 |

**数据流 / 控制流:** 修改测试制造 RED，更新校验器和模板达成 GREEN，迁移 docs 后运行索引生成和全量 preflight。

**接口和契约:** TDD evidence 字段、technical mapping 表头、docs index 表头和 README 轻量例外表头使用 technical design 中定义的中文契约。

**迁移 / 兼容性:** 旧英文展示字段迁移为中文；frontmatter key、路径、命令、代码符号、测试名、Spec ID 和 TD ID 保持不变。

**测试策略:** 每个行为变更先运行对应 RED 单测，再实现。文档迁移通过 validator、`preflight.py --write-index` 和全量 preflight 验证。

**TDD 证据目标:** `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| 批量迁移误伤命令或路径 | 只做明确标签替换，最后用 preflight 和 Spec ID 引用检查兜底。 |
| 校验器与模板契约不一致 | 单元测试覆盖 validator、template check 和真实 docs index。 |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | plan 和 TDD 模板英文展示字段失败 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` / TDD 证据 | 任务 1、任务 2 |
| REQ-002 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 中文 TDD evidence 通过，英文展示字段失败 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` / TDD 证据 | 任务 1 |
| REQ-003 | `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py` | 中文 technical 映射表通过 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` / TDD 证据 | 任务 1 |
| REQ-004 | `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` | docs index 和轻量例外表头中文 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` / TDD 证据 | 任务 1、任务 3 |
| REQ-005 | `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py` | 既有文档迁移后全量门禁通过 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` / TDD 证据 | 任务 3、任务 4 |
| REQ-006 | `python3 scripts/preflight.py` | metadata key 和工程标识不触发中文化失败 | `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` / TDD 证据 | 任务 1、任务 4 |

## 任务 1：更新校验器和 RED/GREEN 单测

**规格 ID:** REQ-002, REQ-003, REQ-004, ERR-002, ERR-003, ERR-004

**文件:**
- 修改: `skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- 修改: `skills/test-driven-development/scripts/validate_tdd_evidence.py`
- 修改: `skills/writing-technical-design/scripts/test_validate_technical_design.py`
- 修改: `skills/writing-technical-design/scripts/validate_technical_design.py`
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_docs_index.py`
- 修改: `scripts/docs_index.py`

- [x] **步骤 1：根据规格 ID 写失败测试**

已将 TDD evidence、technical mapping、plan template、TDD template 和 docs index 相关测试改成中文展示字段契约。

- [x] **步骤 2：运行测试确认失败**

运行:

```bash
python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py
python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py
python3 -m unittest scripts/test_preflight.py
```

预期: FAIL，原因是校验器仍要求英文展示字段，preflight 尚无 plan/TDD template 中文检查函数。

- [x] **步骤 3：RED 后写最小实现**

更新 validator 常量、preflight 检查函数、docs index 表头契约和相关错误信息。

- [x] **步骤 4：运行测试确认通过**

运行:

```bash
python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py
python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py
python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py
```

预期: PASS。

- [x] **步骤 5：记录 TDD 证据**

更新 `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md` 的任务 1。

## 任务 2：中文化模板源头

**规格 ID:** REQ-001, AC-001, AC-002, AC-003, ERR-001

**文件:**
- 修改: `skills/writing-plans/SKILL.md`
- 修改: `skills/test-driven-development/SKILL.md`
- 修改: `skills/test-driven-development/templates/tdd-evidence.md`
- 修改: `skills/writing-technical-design/SKILL.md`
- 修改: `skills/writing-technical-design/templates/technical-design.md`
- 修改: `skills/spec-driven-development/templates/schema-spec.md`
- 修改: `skills/spec-driven-development/templates/traceability-matrix.md`

- [x] **步骤 1：更新模板字段**

把计划模板、TDD evidence 模板、technical 模板和少量 SDD 模板中的展示标题、表头、字段标签改中文。

- [x] **步骤 2：运行模板门禁**

运行:

```bash
python3 -m unittest scripts/test_preflight.py
```

预期: PASS。

- [x] **步骤 3：记录 TDD 证据**

更新任务 2 evidence。

## 任务 3：迁移既有沉淀文档

**规格 ID:** REQ-005, REQ-006, AC-004

**文件:**
- 修改: `docs/coding-plugins/INDEX.md`
- 修改: `docs/coding-plugins/features/plugin/**/plans/implementation.md`
- 修改: `docs/coding-plugins/features/plugin/**/evidence/tdd-evidence.md`
- 修改: `docs/coding-plugins/features/plugin/**/technical/technical-design.md`
- 修改: `docs/coding-plugins/features/plugin/**/README.md`

- [x] **步骤 1：迁移展示字段**

将旧英文展示标题、表头和字段标签迁移为中文，不修改 metadata key、路径、命令、代码符号、Spec ID 或 TD ID。

- [x] **步骤 2：重新生成索引**

运行:

```bash
python3 scripts/preflight.py --write-index
```

预期: 索引更新为中文表头，命令成功。

- [x] **步骤 3：运行文档链路校验**

运行:

```bash
python3 scripts/preflight.py
```

预期: PASS。

- [x] **步骤 4：记录 TDD 证据**

更新任务 3 evidence。

## 任务 4：最终验证、提交和刷新本地插件

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, AC-004

**文件:**
- 修改: `docs/coding-plugins/features/plugin/chinese-document-templates/evidence/tdd-evidence.md`
- 修改: `.codex-plugin/plugin.json` 和 `.claude-plugin/plugin.json` 仅在版本流程需要时修改

- [x] **步骤 1：运行完整验证**

运行:

```bash
python3 scripts/preflight.py
```

预期: PASS。

- [x] **步骤 2：提交并推送**

使用 `coding-plugins:git-commit` 生成中文 Conventional Commit，footer 使用 `Authored-by:`，禁止 AI 作者。

- [x] **步骤 3：刷新本地插件**

运行:

```bash
codex plugin add coding-plugins@personal
```

预期: 本地插件缓存更新到新版本或当前工作副本对应版本。
