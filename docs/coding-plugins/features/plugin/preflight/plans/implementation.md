---
title: 插件发布前检查实现计划
status: completed
area: plugin
capability: preflight
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/preflight/specs/feature.md
related_technical:
  - docs/coding-plugins/features/plugin/preflight/technical/technical-design.md
related_evidence:
  - docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md
---

# 插件发布前检查实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已完成 |
| 领域 | plugin |
| 能力 | preflight |
| 规格 | `docs/coding-plugins/features/plugin/preflight/specs/feature.md` |
| 技术设计 | `docs/coding-plugins/features/plugin/preflight/technical/technical-design.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` |

**Goal:** 记录并固化 `python3 scripts/preflight.py` 作为插件发布前检查的完整执行链路。

**Architecture:** `scripts/preflight.py` 聚合静态仓库检查和验证命令调度；`.github/workflows/ci.yml` 在 push 和 pull request 中调用同一入口；`--write-index` 负责刷新 feature-first 总索引。

**Tech Stack:** Python 标准库、unittest、bash hook 测试、GitHub Actions。

**Spec Source:** `docs/coding-plugins/features/plugin/preflight/specs/feature.md`

**Technical Design Source:** `docs/coding-plugins/features/plugin/preflight/technical/technical-design.md`

## Technical Design Snapshot

**Design Summary:** preflight 先执行静态检查，再运行仓库单测、行为测试、hook 测试、严格规格校验和严格 TDD Evidence 校验。CI 复用同一命令，避免本地和远程门禁分叉。

**Key Decisions:**

| Decision | Rationale | Tradeoff |
| --- | --- | --- |
| 单入口聚合所有检查 | 使用简单且 CI 可复用 | 脚本职责较集中 |
| `--write-index` 与校验共用脚本 | 保证生成和校验逻辑同源 | 生成索引时也会运行完整检查 |
| 严格校验真实文档 | 防止规格和 Evidence 质量倒退 | 新文档必须补齐 metadata 和追踪关系 |

**Affected Components:**

| Component | Change | Related Spec IDs |
| --- | --- | --- |
| `scripts/preflight.py` | 实现静态检查和验证命令调度 | REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003, AC-001 |
| `scripts/test_preflight.py` | 覆盖 preflight 行为规则 | REQ-001, REQ-003, REQ-004, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003 |
| `.github/workflows/ci.yml` | 在 push 和 pull request 中运行 preflight | REQ-005, AC-002 |
| `tests/hooks/test-session-start.sh` | 验证 hook 链路 | REQ-006 |
| `docs/coding-plugins/INDEX.md` | 由 preflight 生成和校验 | REQ-007 |

**Data Flow / Control Flow:** 维护者或 CI 调用 preflight；脚本完成静态检查；根据真实 spec 和 evidence 文件构建验证命令；任一检查失败则非零退出；全部通过后输出 `Preflight passed.`。

**Interfaces and Contracts:** `python3 scripts/preflight.py` 是发布前检查入口；`python3 scripts/preflight.py --write-index` 用于刷新并校验总索引。

**Migration / Compatibility:** 保留原有命令，不改变 CI 入口；旧 docs roots 和旧入口残留继续被拒绝。

**Test Strategy:** 运行 `python3 -m unittest scripts/test_preflight.py`、hook 测试、规格严格校验、TDD Evidence 严格校验和完整 `python3 scripts/preflight.py`。

**TDD Evidence Target:** `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md`

**Risks and Mitigations:**

| Risk | Mitigation |
| --- | --- |
| 静态检查误报 | 单测覆盖允许历史记录和活跃文档扫描边界 |
| 新文件未进入索引 | artifact index 生成内容一致性测试 |
| CI 环境缺工具 | preflight 只依赖 Python 标准库和仓库内 bash 脚本 |

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | validation command list includes core checks | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| REQ-002 | `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/features/plugin/preflight/specs/feature.md` | strict spec validation passes | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | manifest version mismatch is rejected | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | removed active references are rejected | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| REQ-005 | `.github/workflows/ci.yml` | workflow runs `python3 scripts/preflight.py` | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 2 |
| REQ-006 | `bash tests/hooks/test-session-start.sh` | SessionStart hook tests pass | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 2 |
| REQ-007 | `python3 -m unittest scripts/test_preflight.py` | artifact index coverage and generated content checks | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 3 |
| ERR-001 | `python3 -m unittest scripts/test_preflight.py` | empty spec list still builds core commands | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| ERR-002 | `python3 -m unittest scripts/test_preflight.py` | `.git` residue is ignored while active docs fail | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| ERR-003 | `python3 -m unittest scripts/test_preflight.py` | required plugin file checks | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 1 |
| AC-001 | `python3 scripts/preflight.py` | command outputs `Preflight passed.` | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 3 |
| AC-002 | `.github/workflows/ci.yml` | CI workflow command is present | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` / Alternative verification | Task 2 |

## Task 1: Preflight 文档闭环回填

**Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003, AC-001, AC-002

**Files:**

- Create: `docs/coding-plugins/features/plugin/preflight/technical/technical-design.md`
- Create: `docs/coding-plugins/features/plugin/preflight/plans/implementation.md`
- Create: `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md`
- Modify: `docs/coding-plugins/features/plugin/preflight/specs/feature.md`
- Modify: `docs/coding-plugins/features/plugin/preflight/README.md`

- [x] **Step 1: Read approved spec and current preflight implementation**

Read `scripts/preflight.py`, `scripts/test_preflight.py`, `.github/workflows/ci.yml`, hook tests and feature index behavior.

- [x] **Step 2: Create technical design**

Document static checks, validation command flow, CLI contract, CI contract, compatibility and risks.

- [x] **Step 3: Create implementation plan**

Map every preflight Spec ID to existing files and verification commands.

- [x] **Step 4: Record Evidence**

Use TDD Exception Record because this task backfills documentation for existing behavior and does not change runtime logic.
