---
title: 文档契约和 metadata-first 读取规则实现计划
status: approved
feature: document-contract
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/document-contract/specs/feature.md
related_technical:
  - docs/coding-plugins/features/document-contract/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md
---

# 文档契约和 metadata-first 读取规则实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | document-contract |
| 规格 | `docs/coding-plugins/features/document-contract/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/document-contract/technical/technical-design.md` |
| TDD 证据 | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` |

**目标:** 将文档关系源从 README 正文表格迁移到 frontmatter，并让 preflight 强制校验。

**架构:** `docs_index.py` 负责生成索引视图，`preflight.py` 负责阻止契约漂移，文档模板和技能入口负责让后续代理遵守 metadata-first 读取顺序。

**技术栈:** Python 标准库、Markdown frontmatter 简单解析、现有 unittest 和 preflight。

**规格来源:** `docs/coding-plugins/features/document-contract/specs/feature.md`

**技术设计来源:** `docs/coding-plugins/features/document-contract/technical/technical-design.md`

## 技术设计快照

**设计摘要:** 本计划执行 technical design 中的 metadata-first 文档契约。索引标签改从 README frontmatter 读取；README 和 Evidence metadata 由 preflight 校验；历史文档做一次迁移；技能入口和模板同步说明读取顺序。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 索引只读取 README `tags` | 降低正文表格和索引漂移 | 历史 README 要补 frontmatter |
| Evidence 增加 related metadata | 验证证据也要能反查规格、技术设计和计划 | 轻量 feature 只填写存在的关联文档 |
| README 禁止手写链路章节 | 链路由生成索引和 metadata 维护 | README 只保留摘要和轻量例外 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `scripts/docs_index.py` | frontmatter tags 解析和索引规则文案 | REQ-001 |
| `scripts/preflight.py` | README/Evidence metadata 契约检查 | REQ-002, REQ-003, REQ-004, REQ-005 |
| `docs/coding-plugins/features/*` | README/Evidence metadata 迁移 | REQ-002, REQ-003, REQ-004, REQ-005 |
| `docs/coding-plugins/document-contract.md` | 文档分层和读取顺序说明 | REQ-006 |
| `skills/*/SKILL.md` | 后续代理入口规则同步 | REQ-006 |

**数据流 / 控制流:** README frontmatter 进入 `docs_index.render_artifact_index`；Evidence frontmatter 进入 `check_evidence_metadata`；`preflight.py --write-index` 先生成索引，再执行静态检查和行为测试。

**接口和契约:** README frontmatter 提供 `title/status/feature/updated/tags`。Evidence frontmatter 提供 `title/status/feature/created/updated` 和存在文档的 `related_*`。README 正文不维护手写产物链路。

**迁移 / 兼容性:** 现有 README 保留人工摘要，删除索引型链路章节；现有 Evidence 只前置 metadata，不改证据正文。

**测试策略:** 先补单元测试确认旧行为失败，再实现解析和校验，最后运行 `python3 scripts/preflight.py --write-index` 和 `python3 scripts/preflight.py`。

**TDD 证据目标:** `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| 大量文档迁移遗漏 | 用 preflight 扫描所有 feature root |
| 后续代理继续写重复链路 | 在技能入口和文档契约中写明规则 |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_docs_index.py` | `test_docs_index_uses_readme_frontmatter_tags_not_body_table` | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_readme_metadata_contract_rejects_missing_frontmatter` | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_readme_metadata_contract_rejects_handwritten_link_sections` | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | `test_document_path_metadata_check_rejects_missing_evidence_metadata` | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |
| REQ-005 | `python3 scripts/preflight.py` | Evidence related metadata 校验 | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` / 最终验证 | 任务 2 |
| REQ-006 | `python3 scripts/preflight.py` | 文档契约和技能入口同步 | `docs/coding-plugins/features/document-contract/evidence/tdd-evidence.md` / 最终验证 | 任务 3 |

## 任务 1：工具层契约测试和实现

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-004, AC-001, AC-002, AC-003

**文件:**
- 修改: `scripts/test_docs_index.py`
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/docs_index.py`
- 修改: `scripts/preflight.py`

- [x] **步骤 1：写失败测试**

增加 README frontmatter tags、README 禁止手写链路、Evidence metadata 必填字段的单元测试。

- [x] **步骤 2：运行测试确认失败**

运行: `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
预期: FAIL，旧实现仍从 README 正文表格读取标签，且 preflight 缺少 README/Evidence metadata 校验函数。

- [x] **步骤 3：实现工具层契约**

在 `docs_index.py` 增加 frontmatter list 解析并改造 `feature_tags`。在 `preflight.py` 增加 `check_feature_readme_metadata_contract` 和 `check_evidence_metadata`，并接入 `run_static_checks`。

- [x] **步骤 4：运行测试确认通过**

运行: `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
预期: PASS。

## 任务 2：迁移现有 README 和 Evidence

**规格 ID:** REQ-002, REQ-003, REQ-004, REQ-005, AC-004

**文件:**
- 修改: `docs/coding-plugins/features/*/README.md`
- 修改: `docs/coding-plugins/features/*/evidence/tdd-evidence.md`
- 修改: `docs/coding-plugins/INDEX.md`

- [x] **步骤 1：补齐 README frontmatter**

从既有 `文档信息` 摘要提取 title、status、feature、tags，并写入 README frontmatter。

- [x] **步骤 2：删除 README 手写链路章节**

删除 `## 产物链路` 和 `## 文档链路`，保留摘要和轻量例外追踪表。

- [x] **步骤 3：补齐 Evidence frontmatter**

为每个 `evidence/tdd-evidence.md` 写入基础 metadata 和存在的 related 路径。

- [x] **步骤 4：刷新索引并验证**

运行: `python3 scripts/preflight.py --write-index`
预期: PASS。

## 任务 3：文档契约和技能入口同步

**规格 ID:** REQ-006

**文件:**
- 创建: `docs/coding-plugins/document-contract.md`
- 修改: `README.md`
- 修改: `docs/workflow-chain.md`
- 修改: `docs/installation.md`
- 修改: `skills/spec-driven-development/SKILL.md`
- 修改: `skills/writing-technical-design/SKILL.md`
- 修改: `skills/writing-plans/SKILL.md`
- 修改: `skills/test-driven-development/SKILL.md`
- 修改: `skills/*/templates/*.md`

- [x] **步骤 1：记录文档契约**

说明 metadata、正式正文、README 和 INDEX 的职责边界，以及 metadata-first 读取顺序。

- [x] **步骤 2：同步技能入口和模板**

在 SDD、Technical、Plan、TDD 入口强调先读 frontmatter，再读正文；模板补齐 Evidence metadata。

- [x] **步骤 3：最终验证**

运行: `python3 scripts/preflight.py`
预期: PASS。
