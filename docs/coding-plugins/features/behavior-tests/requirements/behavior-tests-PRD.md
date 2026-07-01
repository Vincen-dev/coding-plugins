---
spec_id: plugin-behavior-tests-feature
title: 插件行为级测试
type: feature
status: approved
feature: behavior-tests
created: 2026-06-26
updated: 2026-06-26
tags:
  - testing
  - routing
  - hooks
  - claude-code
related_code:
  - tests/behavior/test_routing.py
  - tests/hooks/test-session-start.sh
  - scripts/preflight.py
related_specs:
  - docs/coding-plugins/features/session-start-hook/requirements/session-start-hook-PRD.md
related_evidence:
  - docs/coding-plugins/features/behavior-tests/evidences/behavior-tests-TED.md
---

# 插件行为级测试规格

## 目标

补齐面向代理行为的自动化测试，确保入口路由、显式技能请求、Claude Code 命名空间和 hook 输出保持稳定。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不运行真实 Codex 或 Claude Code 会话。 |
| NON-002 | 不测试外部 marketplace 发布服务。 |
| NON-003 | 不修改 skill 的具体路由规则。 |

## 背景

- 当前行为：已有 `tests/hooks/test-session-start.sh`，但 preflight 还缺少入口路由和 Claude 命名空间的行为级覆盖。
- 目标用户或调用方：插件维护者、发布前检查、GitHub Actions。
- 约束：测试必须只依赖 Python 标准库和本地仓库文件。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 行为测试必须验证 `using-coding-plugins` 的直接意图路由包含评审、验证、提交、收尾、技能维护、worktree 和并行任务。 | `python3 -m unittest tests.behavior.test_routing` |
| REQ-002 | 必须 | 行为测试必须验证开发任务路由包含 SDD、计划、worktree、TDD 和系统化调试。 | `python3 -m unittest tests.behavior.test_routing` |
| REQ-003 | 必须 | 行为测试必须验证所有技能目录都能通过 `/coding-plugins:git-commit` 这类具体技能名形式被 Claude Code 请求。 | `python3 -m unittest tests.behavior.test_routing` |
| REQ-004 | 必须 | 行为测试必须验证 Codex SessionStart hook 输出合法 JSON，并注入入口上下文。 | `bash tests/hooks/test-session-start.sh` |
| REQ-005 | 必须 | preflight 必须运行行为测试。 | `python3 -m unittest scripts/test_preflight.py` |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 入口技能缺少任一关键技能名。 | 行为测试失败并指出缺失技能。 | 单元测试。 |
| ERR-002 | Claude 参考文档未记录命名空间调用方式。 | 行为测试失败并指出缺失 `/coding-plugins:git-commit` 这类具体技能名。 | 单元测试。 |
| ERR-003 | hook 输出不是 JSON 或缺少 `additionalContext`。 | hook 测试失败。 | `tests/hooks/test-session-start.sh`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 发布前行为校验 | 仓库包含行为测试 | 运行 `python3 scripts/preflight.py` | 行为测试、hook 测试和现有规格/TDD 校验全部通过。 |
| AC-002 | Claude 命名空间校验 | 仓库包含所有技能目录 | 运行 `python3 -m unittest tests.behavior.test_routing` | 每个 skill 均有 `/coding-plugins:git-commit` 这类具体技能名可发现性覆盖。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| REQ-002 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| REQ-003 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| REQ-004 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-001 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| ERR-002 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| ERR-003 | hook 测试 | `bash tests/hooks/test-session-start.sh` | Task 1 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/preflight.py` | Task 2 | 已覆盖 |
| AC-002 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
