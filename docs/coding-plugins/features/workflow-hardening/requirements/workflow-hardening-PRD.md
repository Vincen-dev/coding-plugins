---
title: 插件工作链路硬化
type: maintenance
status: approved
feature: workflow-hardening
doc_id: workflow-hardening
created: 2026-06-29
updated: 2026-07-02
tags:
  - workflow
  - routing
  - remote-audit
  - claude-code
  - validators
related_code:
  - tests/behavior/test_routing.py
  - scripts/preflight.py
  - scripts/remote_audit.py
  - docs/claude-code-usage.md
  - skills/spec-driven-development/scripts/test_validate_spec.py
  - skills/test-driven-development/scripts/test_validate_tdd_evidence.py
related_specs:
  - docs/coding-plugins/features/behavior-tests/requirements/behavior-tests-PRD.md
  - docs/coding-plugins/features/preflight/requirements/preflight-PRD.md
  - docs/coding-plugins/features/release-management/requirements/release-management-PRD.md
related_technical:
  - docs/coding-plugins/features/workflow-hardening/technicals/workflow-hardening-TDD.md
  - docs/coding-plugins/features/workflow-hardening/technicals/workflow-hardening-TID.md
related_plans:
  - docs/coding-plugins/features/workflow-hardening/plans/workflow-hardening-IPD.md
related_evidence:
  - docs/coding-plugins/features/workflow-hardening/evidences/workflow-hardening-TED.md
---

# 插件工作链路硬化规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | workflow-hardening |
| 规格类型 | maintenance |
| 技术设计 | `docs/coding-plugins/features/workflow-hardening/technicals/workflow-hardening-TDD.md` |

## 目标

把当前可运行的插件链路进一步硬化：行为测试覆盖真实场景顺序，轻量 feature 的文档例外可被 preflight 识别，远程 release 和 push 权限有手动审计脚本，Claude Code 有稳定入口提示，SDD/TDD 校验器有真实样例回归测试。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不运行真实 Codex 或 Claude Code 会话。 |
| NON-002 | 不把 GitHub API 审计放进默认 preflight，避免 CI 依赖外部认证。 |
| NON-003 | 不把所有历史轻量 feature 强制膨胀为完整 technical/plan 文档。 |

## 当前基线

| 编号 | 既有行为或契约 | 证据 |
| --- | --- | --- |
| REQ-001 | `python3 scripts/preflight.py` 是本地和 CI 的默认发布前门禁。 | `python3 scripts/preflight.py`。 |
| REQ-002 | Codex 通过 SessionStart hook 注入 `coding-plugins:using-coding-plugins`；Claude Code 通过 `/coding-plugins:using-coding-plugins` 和 `/coding-plugins:git-commit` 这类具体命名空间技能使用。 | `bash tests/hooks/test-session-start.sh` 和 `claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`。 |

## 维护需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| NFR-001 | 必须 | 行为测试必须覆盖新需求、bug、直接提交、完成收尾、插件维护和并行任务的技能顺序，不只检查技能名存在。 | `python3 -m unittest tests.behavior.test_routing`。 |
| NFR-002 | 必须 | approved feature 如果没有 technical/plan，必须在 README 中声明轻量例外原因，preflight 必须校验该例外。 | `python3 -m unittest scripts/test_preflight.py`。 |
| NFR-003 | 必须 | 仓库必须提供手动远程审计脚本，验证目标 tag 的 release 状态和直接 push 协作者只包含维护者。 | `python3 -m unittest scripts/test_remote_audit.py`。 |
| NFR-004 | 必须 | Claude Code 文档必须提供可复制的会话启动入口提示，明确先调用 `/coding-plugins:using-coding-plugins`。 | `python3 -m unittest tests.behavior.test_routing`。 |
| NFR-005 | 必须 | SDD 和 TDD validator 单测必须包含真实 fixture 样例，覆盖通过样例和失败样例。 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py`。 |

## 回归和风险情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 行为测试只检查字符串存在，未覆盖场景顺序。 | 测试失败并指出缺少场景链路覆盖。 | `python3 -m unittest tests.behavior.test_routing`。 |
| ERR-002 | approved feature 缺少 technical/plan 且没有轻量例外说明。 | preflight 失败并指出 feature root。 | `python3 -m unittest scripts/test_preflight.py`。 |
| ERR-003 | GitHub 直接协作者中出现非 `Vincen-dev` 且具备 push/admin 权限。 | 远程审计脚本失败并列出违规账号。 | `python3 -m unittest scripts/test_remote_audit.py`。 |
| ERR-004 | Claude Code 使用说明缺少启动入口提示。 | 行为测试失败。 | `python3 -m unittest tests.behavior.test_routing`。 |
| ERR-005 | validator fixture 中的失败样例被误判通过。 | 对应 validator 单测失败。 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py`。 |

## 兼容性或迁移

| 编号 | 要求 | 验证方式 |
| --- | --- | --- |
| MIG-001 | 默认 `python3 scripts/preflight.py` 不访问网络；远程审计只通过显式运行 `scripts/remote_audit.py` 触发。 | `python3 scripts/preflight.py` 和 `python3 -m unittest scripts/test_remote_audit.py`。 |
| MIG-002 | 个人 marketplace 和 Claude plugin-dir 安装方式保持不变。 | `codex plugin add coding-plugins@personal` 和 `claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`。 |

## 可观测性

| 编号 | 事件、日志、指标或告警 | 触发时机 |
| --- | --- | --- |
| OBS-001 | `scripts/remote_audit.py` 输出 release、tag 和 push 权限审计摘要。 | 维护者发布前或发布后手动执行。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| NFR-001 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| NFR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| NFR-003 | 单元测试 | `python3 -m unittest scripts/test_remote_audit.py` | Task 3 | 已覆盖 |
| NFR-004 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 4 | 已覆盖 |
| NFR-005 | 单元测试 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | Task 5 | 已覆盖 |
| ERR-001 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_remote_audit.py` | Task 3 | 已覆盖 |
| ERR-004 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | Task 4 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | Task 5 | 已覆盖 |
| MIG-001 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| MIG-002 | 命令验证 | `codex plugin add coding-plugins@personal` 和 `claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` | Task 6 | 已覆盖 |
| OBS-001 | 人工审计 | `python3 scripts/remote_audit.py --owner Vincen-dev --repo coding-plugins --tag v0.6.28 --expected-pusher Vincen-dev` | Task 3 | 已覆盖 |
