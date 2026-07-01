---
title: Codex 会话启动入口注入
status: approved
feature: session-start-hook
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/session-start-hook/requirements/feature.md
---
# Codex 会话启动入口注入

## 任务 1： SessionStart hook 注入入口规则

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / REQ-006 / ERR-001 / ERR-002 / ERR-003
- **RED 测试:** `scripts/test_preflight.py::PreflightTests.test_codex_manifest_declares_hook_config`、`scripts/test_preflight.py::PreflightTests.test_codex_manifest_rejects_missing_hook_config`、`scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps` 和 `tests/hooks/test-session-start.sh`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py` 和 `bash tests/hooks/test-session-start.sh`
- **RED 失败:** preflight 单测失败于 `AttributeError: module 'preflight' has no attribute 'check_codex_hook_config_declared'`，且命令列表缺少 `tests/hooks/test-session-start.sh`；hook 测试失败于 manifest 未声明 hooks、`hooks/hooks-codex.json`、`hooks/session-start-codex` 和 `hooks/run-hook.cmd` 均不存在。
- **GREEN 变更:** 新增 Codex SessionStart hook 配置和脚本，将 `.codex-plugin/plugin.json` 接入 `./hooks/hooks-codex.json`；新增 hook 行为测试；preflight 增加 manifest hook 声明检查并运行 hook 测试；同步 README、安装说明、工作链路和规格索引。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py` 和 `bash tests/hooks/test-session-start.sh`
- **REFACTOR 命令:** `bash tests/hooks/test-session-start.sh`
- **最终验证:** `python3 scripts/preflight.py` PASS，包含 hook 测试、严格规格校验和严格 TDD 证据 校验；`codex plugin add coding-plugins@personal` PASS，安装到本机 `0.6.14` 缓存；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS。

## 任务 2： 修正 SessionStart 注入的 Evidence 路径

### TDD 证据

- **规格/缺陷/验收:** REQ-007 / ERR-004
- **RED 测试:** `tests/hooks/test-session-start.sh`
- **RED 命令:** `bash tests/hooks/test-session-start.sh`
- **RED 失败:** hook 测试失败于 `additionalContext missing docs/coding-plugins/features/{feature}/evidence/tdd-evidence.md`，说明 SessionStart 注入内容仍提示旧 TDD 证据 路径。
- **GREEN 变更:** 将 `hooks/session-start-codex` 中的 TDD 证据 注入路径改为 feature-first 路径，并在 hook 测试中禁止旧路径回归。
- **GREEN 命令:** `bash tests/hooks/test-session-start.sh` PASS
- **REFACTOR 命令:** `bash tests/hooks/test-session-start.sh` PASS
- **最终验证:** `python3 scripts/preflight.py --write-index` PASS，包含 hook 测试、严格规格校验和严格 TDD 证据 校验；`python3 scripts/preflight.py` PASS；`git diff --check` PASS；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。
