---
title: 插件发布前检查
status: approved
feature: preflight
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/preflight/specs/feature.md
related_technical:
  - docs/coding-plugins/features/preflight/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/preflight/plans/implementation.md
---
# 插件发布前检查

## 任务 1： Preflight 文档闭环回填

### TDD 例外记录

- **原因:** 本任务只回填 `preflight` 已有能力的技术设计、实现计划和 Evidence 文档，不改变 `scripts/preflight.py`、CI workflow、hook 测试或运行时行为，因此没有新的失败测试可先写。
- **用户批准:** 用户要求“好的继续”，承接上一轮“继续补剩余文档闭环缺口”的上下文。
- **替代验证:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`。
- **风险:** 主要风险是文档回填和真实 preflight 行为漂移；通过严格规格校验、TDD 证据 校验、feature index 一致性校验和完整 preflight 降低风险。

## 任务 2： 拆出文档索引模块

### TDD 证据

- **规格/缺陷/验收:** REQ-007 / REQ-008
- **RED 测试:** `scripts/test_docs_index.py::DocsIndexTests.test_docs_index_module_exposes_index_contract`、`scripts/test_docs_index.py::DocsIndexTests.test_preflight_delegates_artifact_index_checks_to_docs_index`、`scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps`
- **RED 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
- **RED 失败:** `ModuleNotFoundError: No module named 'docs_index'`；同时 `test_build_commands_include_core_validation_steps` 失败，因为 preflight 验证命令还没有包含 `scripts/test_docs_index.py`。
- **GREEN 变更:** 新增 `scripts/docs_index.py`，把 feature root 收集、索引渲染、索引写入、README 标签读取和索引一致性校验迁出 `scripts/preflight.py`；`preflight.py` 通过导入和 wrapper 保持旧调用方兼容，并把 `scripts/test_docs_index.py` 加入发布前验证命令。
- **GREEN 命令:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` PASS，48 tests。
- **REFACTOR 命令:** `python3 scripts/preflight.py --write-index` PASS。
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS，包含 `scripts/test_preflight.py` 46 tests、`scripts/test_docs_index.py` 2 tests、bump/release/behavior/spec/evidence/hook 全部校验；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.25`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS。

## 任务 3： 拆出 manifest 检查模块

### TDD 证据

- **规格/缺陷/验收:** REQ-003 / REQ-009 / ERR-003
- **RED 测试:** `scripts/test_manifest_checks.py::ManifestChecksTests.test_manifest_checks_module_exposes_manifest_contract`、`test_manifest_checks_module_rejects_invalid_manifest_state`、`test_preflight_converts_manifest_check_errors`、`scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps`
- **RED 命令:** `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py`
- **RED 失败:** `ModuleNotFoundError: No module named 'manifest_checks'`；同时 `test_build_commands_include_core_validation_steps` 失败，因为 preflight validation commands 还没有包含 `scripts/test_manifest_checks.py`。
- **GREEN 变更:** 新增 `scripts/manifest_checks.py`，把必需插件文件、manifest 版本、当前版本读取、Codex hook 配置、asset 路径归一化和 manifest asset 存在性检查迁出 `scripts/preflight.py`；`preflight.py` 保留兼容 wrapper 并把 `ManifestCheckError` 转换为 `PreflightError`；新增 `scripts/test_manifest_checks.py` 并纳入 preflight validation commands。
- **GREEN 命令:** `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py` PASS，49 tests。
- **REFACTOR 命令:** `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py` PASS。
- **最终验证:** `python3 -m unittest scripts/test_manifest_checks.py scripts/test_preflight.py` PASS，49 tests；完整 release gate 使用 `python3 scripts/preflight.py --write-index` 和 `python3 scripts/preflight.py` 验证。
