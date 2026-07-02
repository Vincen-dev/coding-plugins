---
title: 插件发布前检查实现计划
status: completed
feature: preflight
doc_id: preflight
created: 2026-06-29
updated: 2026-07-02
related_specs:
  - docs/coding-plugins/features/preflight/requirements/preflight-PRD.md
related_technical:
  - docs/coding-plugins/features/preflight/technicals/preflight-TDD.md
  - docs/coding-plugins/features/preflight/technicals/preflight-TID.md
related_evidence:
  - docs/coding-plugins/features/preflight/evidences/preflight-TED.md
---

# 插件发布前检查实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已完成 |
| Feature | preflight |
| 需求文档 | `docs/coding-plugins/features/preflight/requirements/preflight-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/preflight/technicals/preflight-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/preflight/technicals/preflight-TID.md` |
| TDD 证据 | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` |

**目标:** 记录并固化 `python3 scripts/preflight.py` 作为插件发布前检查的完整执行链路。

**架构:** `scripts/preflight.py` 聚合静态仓库检查和验证命令调度；`.github/workflows/ci.yml` 在 push 和 pull request 中调用同一入口；`--write-index` 负责刷新 feature-first 总索引。

**技术栈:** Python 标准库、unittest、bash hook 测试、GitHub Actions。

**规格来源:** `docs/coding-plugins/features/preflight/requirements/preflight-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/preflight/technicals/preflight-TDD.md`

**技术实现来源:** `docs/coding-plugins/features/preflight/technicals/preflight-TID.md`

## 技术设计快照

**设计摘要:** preflight 先执行静态检查，再运行仓库单测、行为测试、hook 测试、严格规格校验和严格 TDD 证据 校验。CI 复用同一命令，避免本地和远程门禁分叉。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| 单入口聚合所有检查 | 使用简单且 CI 可复用 | 脚本职责较集中 |
| `--write-index` 与校验共用脚本 | 保证生成和校验逻辑同源 | 生成索引时也会运行完整检查 |
| 严格校验真实文档 | 防止规格和 证据 质量倒退 | 新文档必须补齐 metadata 和追踪关系 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `scripts/preflight.py` | 实现静态检查和验证命令调度 | REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003, AC-001 |
| `scripts/docs_index.py` | 承接 feature root 收集、索引渲染、写入和索引一致性校验 | REQ-007, REQ-008 |
| `scripts/test_preflight.py` | 覆盖 preflight 行为规则 | REQ-001, REQ-003, REQ-004, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003 |
| `scripts/test_docs_index.py` | 覆盖 docs index 模块边界和对 preflight 的兼容导出 | REQ-008 |
| `.github/workflows/ci.yml` | 在 push 和 pull request 中运行 preflight | REQ-005, AC-002 |
| `tests/hooks/test-session-start.sh` | 验证 hook 链路 | REQ-006 |
| `docs/coding-plugins/INDEX.md` | 由 preflight 生成和校验 | REQ-007 |

**数据流 / 控制流:** 维护者或 CI 调用 preflight；脚本完成静态检查；根据真实 spec 和 evidence 文件构建验证命令；任一检查失败则非零退出；全部通过后输出 `Preflight passed.`。

**接口和契约:** `python3 scripts/preflight.py` 是发布前检查入口；`python3 scripts/preflight.py --write-index` 用于刷新并校验总索引。

**迁移 / 兼容性:** 保留原有命令，不改变 CI 入口；旧 docs roots 和旧入口残留继续被拒绝。

**测试策略:** 运行 `python3 -m unittest scripts/test_preflight.py`、hook 测试、规格严格校验、TDD 证据 严格校验和完整 `python3 scripts/preflight.py`。

**TDD 证据目标:** `docs/coding-plugins/features/preflight/evidences/preflight-TED.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| 静态检查误报 | 单测覆盖允许历史记录和活跃文档扫描边界 |
| 新文件未进入索引 | artifact index 生成内容一致性测试 |
| CI 环境缺工具 | preflight 只依赖 Python 标准库和仓库内 bash 脚本 |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | validation command list includes core checks | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| REQ-002 | `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/features/preflight/requirements/preflight-PRD.md` | strict spec validation passes | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | manifest version mismatch is rejected | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| REQ-004 | `python3 -m unittest scripts/test_preflight.py` | removed active references are rejected | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| REQ-005 | `.github/workflows/ci.yml` | workflow runs `python3 scripts/preflight.py` | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 2 |
| REQ-006 | `bash tests/hooks/test-session-start.sh` | SessionStart hook tests pass | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 2 |
| REQ-007 | `python3 -m unittest scripts/test_preflight.py` | artifact index coverage and generated content checks | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 3 |
| REQ-008 | `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` | docs index module owns render/write/check contract and preflight delegates | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 任务 2 | 任务 2 |
| REQ-009 | `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py` | manifest checks module owns manifest contract and preflight converts errors | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 任务 3 | 任务 3 |
| ERR-001 | `python3 -m unittest scripts/test_preflight.py` | empty spec list still builds core commands | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| ERR-002 | `python3 -m unittest scripts/test_preflight.py` | `.git` residue is ignored while active docs fail | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| ERR-003 | `python3 -m unittest scripts/test_preflight.py` | required plugin file checks | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 1 |
| AC-001 | `python3 scripts/preflight.py` | command outputs `Preflight passed.` | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 3 |
| AC-002 | `.github/workflows/ci.yml` | CI workflow command is present | `docs/coding-plugins/features/preflight/evidences/preflight-TED.md` / 替代验证 | 任务 2 |

## 任务 1： Preflight 文档闭环回填

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003, AC-001, AC-002

**文件:**

- 创建: `docs/coding-plugins/features/preflight/technicals/preflight-TDD.md`
- 创建: `docs/coding-plugins/features/preflight/plans/preflight-IPD.md`
- 创建: `docs/coding-plugins/features/preflight/evidences/preflight-TED.md`
- 修改: `docs/coding-plugins/features/preflight/requirements/preflight-PRD.md`
- 修改: `docs/coding-plugins/features/preflight/README.md`

- [x] **步骤 1：Read approved spec and current preflight implementation**

Read `scripts/preflight.py`, `scripts/test_preflight.py`, `.github/workflows/ci.yml`, hook tests and feature index behavior.

- [x] **步骤 2：Create technical design**

Document static checks, validation command flow, CLI contract, CI contract, compatibility and risks.

- [x] **步骤 3：Create implementation plan**

Map every preflight Spec ID to existing files and verification commands.

- [x] **步骤 4：Record 证据**

Use TDD 例外记录 because this task backfills documentation for existing behavior and does not change runtime logic.

## 任务 2： 拆出文档索引模块

**规格 ID:** REQ-007, REQ-008

**文件:**

- 创建: `scripts/docs_index.py`
- 创建: `scripts/test_docs_index.py`
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`
- 修改: `docs/coding-plugins/features/preflight/evidences/preflight-TED.md`

- [x] **步骤 1：Write failing module-boundary tests**

Create `scripts/test_docs_index.py` with tests that import `docs_index`, call `docs_index.render_artifact_index(root)`, and assert `preflight.render_artifact_index` delegates to the same implementation. Update `scripts/test_preflight.py` so `build_validation_commands()` includes `scripts/test_docs_index.py`.

运行: `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
预期: FAIL because `scripts/docs_index.py` does not exist yet or `preflight.py` still owns the index implementation directly.

- [x] **步骤 2：Move index implementation**

Move feature root collection, markdown table parsing, README tag parsing, index path formatting, index rendering, index writing and generated content checks into `scripts/docs_index.py`. Keep preflight-compatible wrappers or imports so existing callers can still use `preflight.render_artifact_index()` and `preflight.check_artifact_index_covers_documents()`.

- [x] **步骤 3：Run GREEN verification**

运行: `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
预期: PASS.

- [x] **步骤 4：Run full release gate**

Run `python3 scripts/preflight.py --write-index` and `python3 scripts/preflight.py`.
预期: both PASS and `docs/coding-plugins/INDEX.md` remains generated by the new module.

- [x] **步骤 5：Record TDD 证据**

Append 任务 2 RED/GREEN/REFACTOR evidence to `docs/coding-plugins/features/preflight/evidences/preflight-TED.md`.

## 任务 3： 拆出 manifest 检查模块

**规格 ID:** REQ-003, REQ-009, ERR-003

**文件:**

- 创建: `scripts/manifest_checks.py`
- 创建: `scripts/test_manifest_checks.py`
- 修改: `scripts/preflight.py`
- 修改: `scripts/test_preflight.py`
- 修改: `docs/coding-plugins/features/preflight/evidences/preflight-TED.md`

- [x] **步骤 1：Write failing module-boundary tests**

Create `scripts/test_manifest_checks.py` with tests that import `manifest_checks`, validate matching/mismatched manifest versions, required files, Codex hook config and asset paths. Update `scripts/test_preflight.py` so `build_validation_commands()` includes `scripts/test_manifest_checks.py` and so preflight converts `ManifestCheckError` into `PreflightError`.

运行: `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py`
预期: FAIL because `scripts/manifest_checks.py` does not exist yet or preflight still owns manifest checks directly.

- [x] **步骤 2：Move manifest implementation**

Move manifest JSON loading, required plugin file checks, manifest version checks, current manifest version lookup, Codex hook config check, manifest asset path normalization and asset existence checks into `scripts/manifest_checks.py`. Keep preflight-compatible wrappers so existing callers can still use `preflight.check_manifest_versions()` and related functions.

- [x] **步骤 3：Run GREEN verification**

运行: `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py`
预期: PASS.

- [x] **步骤 4：Run full release gate**

Run `python3 scripts/preflight.py --write-index` and `python3 scripts/preflight.py`.
预期: both PASS and manifest checks are covered by `scripts/test_manifest_checks.py`.

- [x] **步骤 5：Record TDD 证据**

Append 任务 3 RED/GREEN/REFACTOR evidence to `docs/coding-plugins/features/preflight/evidences/preflight-TED.md`.
