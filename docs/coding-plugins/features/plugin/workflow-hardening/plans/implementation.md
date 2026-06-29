---
title: 插件工作链路硬化实现计划
status: completed
area: plugin
capability: workflow-hardening
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/workflow-hardening/specs/maintenance.md
related_technical:
  - docs/coding-plugins/features/plugin/workflow-hardening/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md
---

# 插件工作链路硬化实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已完成 |
| 领域 | plugin |
| 能力 | workflow-hardening |
| 规格 | `docs/coding-plugins/features/plugin/workflow-hardening/specs/maintenance.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/workflow-hardening/technical/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md` |

**Goal:** 按优先级补强插件主链路的行为测试、文档契约、远程发布审计、Claude 入口和 validator 样例。

**Architecture:** 保持 `scripts/preflight.py` 为本地门禁入口；新增远程审计脚本但不接入默认 preflight；新增轻量 feature 例外契约；用行为测试和 fixture 测试固定链路质量。

**Tech Stack:** Python 标准库、unittest、Markdown 文档、GitHub CLI 手动审计。

**Spec Source:** `docs/coding-plugins/features/plugin/workflow-hardening/specs/maintenance.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/workflow-hardening/technical/technical-design.md`

## Technical Design Snapshot

**Design Summary:** 行为测试增加场景顺序断言；preflight 增加 feature 文档闭环或轻量例外检查；远程审计脚本用 `gh` 和 `git` 查询 tag、release、collaborator，但默认门禁只运行其单测；Claude 文档提供启动提示；validator 测试读取真实 fixture。

**Key Decisions:**

| Decision | Rationale | Tradeoff |
| --- | --- | --- |
| 场景顺序测试优先 | 快速提升行为链路回归能力 | 不等同真实代理执行 |
| 轻量 feature 例外 | 控制文档规模 | 需要维护例外说明 |
| remote audit 手动运行 | 避免默认 CI 网络依赖 | 发布者需要记住执行 |

**Affected Components:**

| Component | Change | Related Spec IDs |
| --- | --- | --- |
| `tests/behavior/test_routing.py` | 增加场景链路和 Claude 启动提示测试 | NFR-001, NFR-004 |
| `scripts/preflight.py` | 增加轻量例外检查和 remote audit 单测命令 | NFR-002, NFR-003 |
| `scripts/remote_audit.py` | 新增远程审计 CLI 和纯函数 | NFR-003 |
| `skills/*/fixtures/` | 新增 validator 样例 | NFR-005 |

**Data Flow / Control Flow:** 本地默认运行 preflight；发布前维护者显式运行 remote audit；所有文档产物通过 feature-first 索引检索。

**Interfaces and Contracts:** `scripts/remote_audit.py --owner Vincen-dev --repo coding-plugins --tag v0.6.28 --expected-pusher Vincen-dev`；轻量 feature README 必须包含 `## 轻量例外`、`Reason` 和 `Verification`。

**Migration / Compatibility:** 默认 preflight 不访问网络；已存在轻量 feature 通过 README 例外保持兼容。

**Test Strategy:** 每项从 RED 测试开始，运行相关 unittest 确认失败；实现后运行相关测试和完整 preflight。

**TDD Evidence Target:** `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md`

**Risks and Mitigations:**

| Risk | Mitigation |
| --- | --- |
| remote audit 依赖本地 gh 登录 | 不纳入默认 preflight，并在文档中标明手动执行 |
| 轻量例外绕过完整设计 | 只允许 README 明确 Reason 和 Verification 的 feature |

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| NFR-001 | `python3 -m unittest tests.behavior.test_routing` | `test_workflow_scenarios_document_ordered_skill_chains` | `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md` / Task 1 | Task 1 |
| NFR-002 | `python3 -m unittest scripts/test_preflight.py` | `test_feature_document_chain_requires_plan_or_lightweight_exception` | `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md` / Task 2 | Task 2 |
| NFR-003 | `python3 -m unittest scripts/test_remote_audit.py` | remote audit collaborator and release assertions | `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md` / Task 3 | Task 3 |
| NFR-004 | `python3 -m unittest tests.behavior.test_routing` | `test_claude_usage_documents_session_start_prompt` | `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md` / Task 4 | Task 4 |
| NFR-005 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | fixture pass/fail tests | `docs/coding-plugins/features/plugin/workflow-hardening/evidence/tdd-evidence.md` / Task 5 | Task 5 |

## Task 1: 行为场景顺序测试

**Spec IDs:** NFR-001, ERR-001

**Files:**

- Modify: `tests/behavior/test_routing.py`
- Modify: `docs/workflow-chain.md`

- [x] **Step 1: Write failing tests from Spec IDs**
- [x] **Step 2: Run tests to verify RED**
- [x] **Step 3: Write minimal implementation after RED**
- [x] **Step 4: Run tests to verify GREEN**
- [x] **Step 5: Record TDD Evidence**

## Task 2: 轻量 feature 文档例外契约

**Spec IDs:** NFR-002, ERR-002

**Files:**

- Modify: `scripts/preflight.py`
- Modify: `scripts/test_preflight.py`
- Modify: lightweight feature README files

- [x] **Step 1: Write failing tests from Spec IDs**
- [x] **Step 2: Run tests to verify RED**
- [x] **Step 3: Write minimal implementation after RED**
- [x] **Step 4: Run tests to verify GREEN**
- [x] **Step 5: Record TDD Evidence**

## Task 3: 远程发布审计脚本

**Spec IDs:** NFR-003, ERR-003, OBS-001

**Files:**

- Create: `scripts/remote_audit.py`
- Create: `scripts/test_remote_audit.py`
- Modify: `scripts/preflight.py`

- [x] **Step 1: Write failing tests from Spec IDs**
- [x] **Step 2: Run tests to verify RED**
- [x] **Step 3: Write minimal implementation after RED**
- [x] **Step 4: Run tests to verify GREEN**
- [x] **Step 5: Record TDD Evidence**

## Task 4: Claude Code 启动入口提示

**Spec IDs:** NFR-004, ERR-004

**Files:**

- Modify: `docs/claude-code-usage.md`
- Modify: `skills/using-coding-plugins/references/claude-tools.md`
- Modify: `tests/behavior/test_routing.py`

- [x] **Step 1: Write failing tests from Spec IDs**
- [x] **Step 2: Run tests to verify RED**
- [x] **Step 3: Write minimal implementation after RED**
- [x] **Step 4: Run tests to verify GREEN**
- [x] **Step 5: Record TDD Evidence**

## Task 5: Validator fixture 样例

**Spec IDs:** NFR-005, ERR-005

**Files:**

- Create: `skills/spec-driven-development/scripts/fixtures/valid-feature-spec.md`
- Create: `skills/spec-driven-development/scripts/fixtures/invalid-placeholder-spec.md`
- Create: `skills/test-driven-development/scripts/fixtures/valid-tdd-evidence.md`
- Create: `skills/test-driven-development/scripts/fixtures/invalid-after-the-fact-evidence.md`
- Modify: validator test files

- [x] **Step 1: Write failing tests from Spec IDs**
- [x] **Step 2: Run tests to verify RED**
- [x] **Step 3: Write minimal implementation after RED**
- [x] **Step 4: Run tests to verify GREEN**
- [x] **Step 5: Record TDD Evidence**

## Task 6: 完整验证和安装

**Spec IDs:** MIG-001, MIG-002

**Files:**

- Modify: `RELEASE-NOTES.md`
- Modify: manifests through `scripts/bump_version.py`

- [x] **Step 1: Run full preflight**
- [x] **Step 2: Validate Claude plugin**
- [x] **Step 3: Install personal Codex plugin**
- [x] **Step 4: Commit and push**
