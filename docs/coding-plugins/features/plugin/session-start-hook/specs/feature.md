---
spec_id: plugin-session-start-hook-feature
title: Codex 会话启动入口注入
type: feature
status: approved
area: plugin
capability: session-start-hook
created: 2026-06-26
updated: 2026-06-26
tags:
  - codex
  - hook
  - session-start
  - bootstrap
  - workflow
related_code:
  - .codex-plugin/plugin.json
  - hooks/hooks-codex.json
  - hooks/session-start-codex
  - hooks/run-hook.cmd
  - tests/hooks/test-session-start.sh
  - scripts/preflight.py
related_specs:
  - docs/coding-plugins/features/plugin/preflight/specs/feature.md
---

# Codex 会话启动入口注入规格

## 目标

让 Codex 在新会话、恢复会话和清空上下文后自动获得 `coding-plugins` 的入口规则提示，减少依赖模型自行发现 `using-coding-plugins` 的不稳定性。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不恢复已删除的旧入口技能或旧需求探索技能。 |
| NON-002 | 不在本次扩展 Cursor、Kimi、OpenCode、Pi 或 Gemini 平台。 |
| NON-003 | 不引入可执行服务、网络请求、遥测或外部依赖。 |

## 背景

- 当前行为：Codex 插件通过 skill 描述和 marketplace 元数据暴露入口，但没有 SessionStart hook 主动注入中文工作流规则。
- 目标用户或调用方：Codex App、Codex CLI、插件维护者。
- 约束：hook 输出必须是 Codex 可读取的 JSON；脚本必须只依赖 POSIX shell 和 Python 标准库；输出不得引用已删除旧入口。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | Codex manifest 必须声明 `hooks` 字段并指向 `./hooks/hooks-codex.json`。 | 单元测试 `test_codex_manifest_declares_hook_config`。 |
| REQ-002 | 必须 | `hooks/hooks-codex.json` 必须为 `SessionStart` 的 `startup\|resume\|clear` matcher 配置同步命令。 | `tests/hooks/test-session-start.sh`。 |
| REQ-003 | 必须 | hook 命令必须通过 `hooks/run-hook.cmd session-start-codex` 调用专用脚本。 | `tests/hooks/test-session-start.sh`。 |
| REQ-004 | 必须 | `hooks/session-start-codex` 必须输出 JSON，包含 `hookSpecificOutput.hookEventName=SessionStart` 和非空 `additionalContext`。 | `tests/hooks/test-session-start.sh`。 |
| REQ-005 | 必须 | 注入上下文必须明确要求优先使用 `coding-plugins:using-coding-plugins`，并概述 SDD -> plan -> TDD -> verification -> commit/finish 链路。 | `tests/hooks/test-session-start.sh`。 |
| REQ-006 | 必须 | preflight 必须运行 hook 测试，避免发布时遗漏启动链路。 | 单元测试 `test_build_commands_include_core_validation_steps` 和 `python3 scripts/preflight.py`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | hook wrapper 收到未知命令。 | 以非零状态退出，并输出 unknown hook command。 | `tests/hooks/test-session-start.sh`。 |
| ERR-002 | hook 脚本在最小环境中运行。 | 仍输出合法 JSON，不依赖 Codex 特定环境变量。 | `tests/hooks/test-session-start.sh`。 |
| ERR-003 | hook 输出上下文中出现旧入口名称。 | 测试失败。 | `tests/hooks/test-session-start.sh`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | Codex 读取插件 manifest | 插件已安装 | 查看 `.codex-plugin/plugin.json` | `hooks` 字段指向 `./hooks/hooks-codex.json`。 |
| AC-002 | Codex 触发 SessionStart | Codex 执行配置中的 hook 命令 | 运行 `hooks/run-hook.cmd session-start-codex` | 输出嵌套 JSON，并包含中文入口规则。 |
| AC-003 | 发布前检查 | 仓库处于可发布状态 | 运行 `python3 scripts/preflight.py` | hook 测试被执行并通过。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| REQ-003 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| REQ-004 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| REQ-005 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| REQ-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-001 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| ERR-002 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| ERR-003 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| AC-001 | 文件检查 | `.codex-plugin/plugin.json` | Task 1 | 已覆盖 |
| AC-002 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
