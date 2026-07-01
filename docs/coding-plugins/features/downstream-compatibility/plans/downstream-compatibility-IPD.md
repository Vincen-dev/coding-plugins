---
title: 下游项目兼容性和证据生命周期实现计划
status: approved
feature: downstream-compatibility
created: 2026-07-01
updated: 2026-07-01
related_specs:
  - docs/coding-plugins/features/downstream-compatibility/requirements/downstream-compatibility-PRD.md
related_technical:
  - docs/coding-plugins/features/downstream-compatibility/technicals/downstream-compatibility-TDD.md
related_evidence:
  - docs/coding-plugins/features/downstream-compatibility/evidences/downstream-compatibility-TED.md
---

# 下游项目兼容性和证据生命周期实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | downstream-compatibility |
| 需求文档 | `docs/coding-plugins/features/downstream-compatibility/requirements/downstream-compatibility-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/downstream-compatibility/technicals/downstream-compatibility-TDD.md` |
| TDD 证据 | `docs/coding-plugins/features/downstream-compatibility/evidences/downstream-compatibility-TED.md` |

**目标:** 修复真实下游项目暴露出的非轻量模式问题：validator 兼容、迁移脚本、evidence 归档、状态收敛、测试质量字段和外部引用检查。

**架构:** 沿用现有 Python 标准库 validator/preflight 架构，不引入第三方依赖。默认 preflight 保持本地、确定性、无网络；跨仓库路径只在显式参数下检查。

**技术栈:** Python 标准库、unittest、Markdown frontmatter 简单解析。

**规格来源:** `docs/coding-plugins/features/downstream-compatibility/requirements/downstream-compatibility-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/downstream-compatibility/technicals/downstream-compatibility-TDD.md`

## 技术设计快照

**设计摘要:** 实现 validator 兼容层、active/archive evidence 分层、迁移脚本和可选外部引用检查。状态收敛只检查明确完成证据对应的 `计划中` 漂移，避免过度约束历史草稿。TDD evidence 模板和技能文档增加测试类型字段。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 保持标准库解析 | 插件当前无需 YAML 依赖 | frontmatter 语法仍保持简单 |
| archive 不进主索引 | 主索引表达当前契约 | 历史证据要从 archive 路径进入 |
| 外部引用显式检查 | 跨机器路径不稳定 | 默认 preflight 不发现外部路径损坏 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `validate_spec.py` | scoped Spec ID、Dart 泛型、状态别名 | NFR-001, NFR-002, NFR-003 |
| `validate_tdd_evidence.py` | scoped Spec ID、测试类型、source-scan warning | NFR-001, NFR-004, NFR-005 |
| `docs_index.py`, `preflight.py` | archive 分离、metadata、状态收敛、外部引用 | NFR-006, NFR-007, NFR-009, NFR-010 |
| `migrate_document_contract.py` | 文档契约迁移 | NFR-008 |
| `test-driven-development` 技能和模板 | 测试类型说明 | NFR-004, NFR-005 |

**数据流 / 控制流:** 单元测试先固定下游真实误报；validator 和 preflight 实现后转绿；`preflight.py --write-index` 生成最新索引；最终 `preflight.py` 执行全部门禁。

**接口和契约:** `python3 scripts/migrate_document_contract.py [--dry-run]`；`python3 scripts/preflight.py --check-external-references`；TDD evidence 可选 `测试类型` 字段。

**迁移 / 兼容性:** 旧 evidence 不强制补测试类型；旧状态别名由 validator 兼容并可通过迁移脚本归一；外部引用不进入默认 CI。

**测试策略:** 每个实现点都有对应 unittest；最终跑完整 preflight。

**TDD 证据目标:** `docs/coding-plugins/features/downstream-compatibility/evidences/downstream-compatibility-TED.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| 新状态收敛检查误伤现有文档 | 只检查明确完成 evidence 的 planned 状态 |
| 迁移脚本写坏文档 | 提供 dry-run，并只做机械 metadata 修复 |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| NFR-001 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | scoped Spec ID 接受 | `evidences/<feature-name>-TED.md` / 任务 1 | 任务 1 |
| NFR-002 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py` | Dart 泛型不误报 | `evidences/<feature-name>-TED.md` / 任务 1 | 任务 1 |
| NFR-003 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py` | 状态别名接受 | `evidences/<feature-name>-TED.md` / 任务 1 | 任务 1 |
| NFR-004 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | 未知测试类型失败 | `evidences/<feature-name>-TED.md` / 任务 1 | 任务 1 |
| NFR-005 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | source-scan 行为 strict 失败 | `evidences/<feature-name>-TED.md` / 任务 1 | 任务 1 |
| NFR-006 | `python3 -m unittest scripts/test_preflight.py` | archive 不进 active evidence | `evidences/<feature-name>-TED.md` / 任务 2 | 任务 2 |
| NFR-007 | `python3 -m unittest scripts/test_preflight.py` | archive metadata 校验 | `evidences/<feature-name>-TED.md` / 任务 2 | 任务 2 |
| NFR-008 | `python3 -m unittest scripts/test_document_contract_migration.py` | 迁移脚本 dry-run 和写入 | `evidences/<feature-name>-TED.md` / 任务 3 | 任务 3 |
| NFR-009 | `python3 -m unittest scripts/test_preflight.py` | completed evidence 不允许 planned 状态 | `evidences/<feature-name>-TED.md` / 任务 4 | 任务 4 |
| NFR-010 | `python3 -m unittest scripts/test_preflight.py` | 外部引用显式检查 | `evidences/<feature-name>-TED.md` / 任务 5 | 任务 5 |

## 任务 1：validator 兼容和测试类型

**规格 ID:** NFR-001, NFR-002, NFR-003, NFR-004, NFR-005

**文件:**
- 修改: `skills/spec-driven-development/scripts/test_validate_spec.py`
- 修改: `skills/spec-driven-development/scripts/validate_spec.py`
- 修改: `skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- 修改: `skills/test-driven-development/scripts/validate_tdd_evidence.py`
- 修改: `skills/test-driven-development/templates/tdd-evidence.md`
- 修改: `skills/test-driven-development/SKILL.md`

- [x] **步骤 1：写 RED 测试**
- [x] **步骤 2：运行测试确认失败**
- [x] **步骤 3：实现 validator 兼容**
- [x] **步骤 4：运行 GREEN 测试**
- [x] **步骤 5：记录 TDD 证据**

## 任务 2：active/archive evidence 分离

**规格 ID:** NFR-006, NFR-007

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/docs_index.py`
- 修改: `scripts/preflight.py`
- 修改: `docs/coding-plugins/document-contract.md`

- [x] **步骤 1：写 RED 测试**
- [x] **步骤 2：运行测试确认失败**
- [x] **步骤 3：实现 archive collector 和 metadata 检查**
- [x] **步骤 4：运行 GREEN 测试**
- [x] **步骤 5：记录 TDD 证据**

## 任务 3：文档契约迁移脚本

**规格 ID:** NFR-008, MIG-001, MIG-002

**文件:**
- 创建: `scripts/migrate_document_contract.py`
- 创建: `scripts/test_document_contract_migration.py`
- 修改: `scripts/preflight.py`
- 修改: `docs/coding-plugins/document-contract.md`

- [x] **步骤 1：写 RED 测试**
- [x] **步骤 2：运行测试确认失败**
- [x] **步骤 3：实现迁移脚本**
- [x] **步骤 4：运行 GREEN 测试**
- [x] **步骤 5：记录 TDD 证据**

## 任务 4：状态收敛检查

**规格 ID:** NFR-009

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`

- [x] **步骤 1：写 RED 测试**
- [x] **步骤 2：运行测试确认失败**
- [x] **步骤 3：实现 lifecycle consistency 检查**
- [x] **步骤 4：运行 GREEN 测试**
- [x] **步骤 5：记录 TDD 证据**

## 任务 5：跨仓库引用显式检查

**规格 ID:** NFR-010, ERR-004

**文件:**
- 修改: `scripts/test_preflight.py`
- 修改: `scripts/preflight.py`
- 修改: `docs/coding-plugins/document-contract.md`

- [x] **步骤 1：写 RED 测试**
- [x] **步骤 2：运行测试确认失败**
- [x] **步骤 3：实现 `--check-external-references` 和检查函数**
- [x] **步骤 4：运行 GREEN 测试**
- [x] **步骤 5：记录 TDD 证据**
