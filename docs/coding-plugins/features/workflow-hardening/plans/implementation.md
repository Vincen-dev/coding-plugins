---
title: 插件工作链路硬化实现计划
status: completed
feature: workflow-hardening
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/workflow-hardening/specs/maintenance.md
related_technical:
  - docs/coding-plugins/features/workflow-hardening/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md
---

# 插件工作链路硬化实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已完成 |
| Feature | workflow-hardening |
| 规格 | `docs/coding-plugins/features/workflow-hardening/specs/maintenance.md` |
| 技术设计 | `docs/coding-plugins/features/workflow-hardening/technical/technical-design.md` |
| TDD 证据 | `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md` |

**目标:** 按优先级补强插件主链路的行为测试、文档契约、远程发布审计、Claude 入口和 validator 样例。

**架构:** 保持 `scripts/preflight.py` 为本地门禁入口；新增远程审计脚本但不接入默认 preflight；新增轻量 feature 例外契约；用行为测试和 fixture 测试固定链路质量。

**技术栈:** Python 标准库、unittest、Markdown 文档、GitHub CLI 手动审计。

**规格来源:** `docs/coding-plugins/features/workflow-hardening/specs/maintenance.md`

**技术设计来源:** `docs/coding-plugins/features/workflow-hardening/technical/technical-design.md`

## 技术设计快照

**设计摘要:** 行为测试增加场景顺序断言；preflight 增加 feature 文档闭环或轻量例外检查；远程审计脚本用 `gh` 和 `git` 查询 tag、release、collaborator，但默认门禁只运行其单测；Claude 文档提供启动提示；validator 测试读取真实 fixture。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 场景顺序测试优先 | 快速提升行为链路回归能力 | 不等同真实代理执行 |
| 轻量 feature 例外 | 控制文档规模 | 需要维护例外说明 |
| remote audit 手动运行 | 避免默认 CI 网络依赖 | 发布者需要记住执行 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `tests/behavior/test_routing.py` | 增加场景链路和 Claude 启动提示测试 | NFR-001, NFR-004 |
| `scripts/preflight.py` | 增加轻量例外检查和 remote audit 单测命令 | NFR-002, NFR-003 |
| `scripts/remote_audit.py` | 新增远程审计 CLI 和纯函数 | NFR-003 |
| `skills/*/fixtures/` | 新增 validator 样例 | NFR-005 |

**数据流 / 控制流:** 本地默认运行 preflight；发布前维护者显式运行 remote audit；所有文档产物通过 feature-first 索引检索。

**接口和契约:** `scripts/remote_audit.py --owner Vincen-dev --repo coding-plugins --tag v0.6.28 --expected-pusher Vincen-dev`；轻量 feature README 必须包含 `## 轻量例外`、`原因` 和 `验证方式`。

**迁移 / 兼容性:** 默认 preflight 不访问网络；已存在轻量 feature 通过 README 例外保持兼容。

**测试策略:** 每项从 RED 测试开始，运行相关 unittest 确认失败；实现后运行相关测试和完整 preflight。

**TDD 证据目标:** `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| remote audit 依赖本地 gh 登录 | 不纳入默认 preflight，并在文档中标明手动执行 |
| 轻量例外绕过完整设计 | 只允许 README 明确 原因和验证方式 的 feature |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| NFR-001 | `python3 -m unittest tests.behavior.test_routing` | `test_workflow_scenarios_document_ordered_skill_chains` | `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md` / 任务 1 | 任务 1 |
| NFR-002 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_document_chain_requires_plan_or_lightweight_exception` | `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md` / 任务 2 | 任务 2 |
| NFR-003 | `python3 -m unittest scripts/test_remote_audit.py` | remote audit collaborator and release assertions | `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md` / 任务 3 | 任务 3 |
| NFR-004 | `python3 -m unittest tests.behavior.test_routing` | `test_claude_usage_documents_session_start_prompt` | `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md` / 任务 4 | 任务 4 |
| NFR-005 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | fixture pass/fail tests | `docs/coding-plugins/features/workflow-hardening/evidence/tdd-evidence.md` / 任务 5 | 任务 5 |

## 任务 1： 行为场景顺序测试

**规格 ID:** NFR-001, ERR-001

**文件:**

- 修改: `tests/behavior/test_routing.py`
- 修改: `docs/workflow-chain.md`

- [x] **步骤 1：Write failing tests from Spec IDs**
- [x] **步骤 2：Run tests to verify RED**
- [x] **步骤 3：Write minimal implementation after RED**
- [x] **步骤 4：Run tests to verify GREEN**
- [x] **步骤 5：Record TDD 证据**

## 任务 2： 轻量 feature 文档例外契约

**规格 ID:** NFR-002, ERR-002

**文件:**

- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`
- 修改: lightweight feature README files

- [x] **步骤 1：Write failing tests from Spec IDs**
- [x] **步骤 2：Run tests to verify RED**
- [x] **步骤 3：Write minimal implementation after RED**
- [x] **步骤 4：Run tests to verify GREEN**
- [x] **步骤 5：Record TDD 证据**

## 任务 3： 远程发布审计脚本

**规格 ID:** NFR-003, ERR-003, OBS-001

**文件:**

- 创建: `scripts/remote_audit.py`
- 创建: `scripts/test_remote_audit.py`
- 修改: `scripts/preflight.py`

- [x] **步骤 1：Write failing tests from Spec IDs**
- [x] **步骤 2：Run tests to verify RED**
- [x] **步骤 3：Write minimal implementation after RED**
- [x] **步骤 4：Run tests to verify GREEN**
- [x] **步骤 5：Record TDD 证据**

## 任务 4： Claude Code 启动入口提示

**规格 ID:** NFR-004, ERR-004

**文件:**

- 修改: `docs/claude-code-usage.md`
- 修改: `skills/using-coding-plugins/references/claude-tools.md`
- 修改: `tests/behavior/test_routing.py`

- [x] **步骤 1：Write failing tests from Spec IDs**
- [x] **步骤 2：Run tests to verify RED**
- [x] **步骤 3：Write minimal implementation after RED**
- [x] **步骤 4：Run tests to verify GREEN**
- [x] **步骤 5：Record TDD 证据**

## 任务 5： Validator fixture 样例

**规格 ID:** NFR-005, ERR-005

**文件:**

- 创建: `skills/spec-driven-development/scripts/fixtures/valid-feature-spec.md`
- 创建: `skills/spec-driven-development/scripts/fixtures/invalid-placeholder-spec.md`
- 创建: `skills/test-driven-development/scripts/fixtures/valid-tdd-evidence.md`
- 创建: `skills/test-driven-development/scripts/fixtures/invalid-after-the-fact-evidence.md`
- 修改: validator test files

- [x] **步骤 1：Write failing tests from Spec IDs**
- [x] **步骤 2：Run tests to verify RED**
- [x] **步骤 3：Write minimal implementation after RED**
- [x] **步骤 4：Run tests to verify GREEN**
- [x] **步骤 5：Record TDD 证据**

## 任务 6： 完整验证和安装

**规格 ID:** MIG-001, MIG-002

**文件:**

- 修改: `RELEASE-NOTES.md`
- 修改: manifests through `scripts/bump_version.py`

- [x] **步骤 1：Run full preflight**
- [x] **步骤 2：Validate Claude plugin**
- [x] **步骤 3：Install personal Codex plugin**
- [x] **步骤 4：Commit and push**
