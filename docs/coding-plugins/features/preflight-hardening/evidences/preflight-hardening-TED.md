---
title: Preflight 覆盖面增强
status: approved
feature: preflight-hardening
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/preflight-hardening/requirements/preflight-hardening-PRD.md
---
# Preflight 覆盖面增强

## 任务 1： 增强插件结构和追踪校验

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_skill_agent_metadata_check_rejects_missing_agent_file`、`test_manifest_asset_check_rejects_missing_asset`、`test_document_path_metadata_check_rejects_mismatched_spec_metadata`、`test_evidence_spec_id_check_rejects_unknown_ids` 和 `test_docs_sync_check_rejects_missing_key_paths`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** 单测失败于 `AttributeError`，说明 preflight 尚未提供 skill metadata、manifest 资源路径、文档路径 metadata、Evidence Spec ID 和关键文档路径同步检查函数。
- **GREEN 变更:** 新增 `check_skill_agent_metadata()`、`check_manifest_asset_paths()`、`check_document_path_metadata()`、`check_tdd_evidence_spec_ids()` 和 `check_documentation_path_references()`，并接入 `run_static_checks()`。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS，包含 skill metadata、manifest 资源路径、文档路径 metadata、Evidence Spec ID 和关键文档路径同步检查。

## 任务 2： 拦截旧路径和旧品牌残留

### TDD 证据

- **规格/缺陷/验收:** REQ-006 / REQ-007 / ERR-004
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_legacy_tdd_evidence_path_references_are_rejected`、`scripts/test_preflight.py::PreflightTests.test_superpowers_references_are_rejected_in_active_guidance` 和 `scripts/test_preflight.py::PreflightTests.test_removed_residue_scan_allows_release_history`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py`
- **RED 失败:** 单测失败于 `PreflightError not raised`，说明 preflight 尚未拒绝活跃 hook 中的旧 TDD 证据 路径，也未拒绝活跃 skill 中的 Superpowers worktree 残留。
- **GREEN 变更:** 扩展 `check_removed_entry_references()`，只扫描活跃说明文件、hooks、skills、manifest 和 CI 配置，拒绝旧 `docs/coding-plugins/evidence/`、旧 docs roots、旧入口、`brainstorming` 和 Superpowers 残留；保留 release notes 与 feature specs/evidence 中的历史记录能力。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` PASS，44 个测试通过。
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py` PASS
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS，包含 44 个 preflight 单测、hook 测试、严格规格校验和严格 TDD 证据 校验；`python3 scripts/preflight.py` PASS；`git diff --check` PASS；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。
