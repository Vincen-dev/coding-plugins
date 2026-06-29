---
spec_id: plugin-tdd-evidence-path-feature
title: TDD 证据 固定落地路径
type: feature
status: approved
area: plugin
capability: tdd-evidence-path
created: 2026-06-26
updated: 2026-06-26
tags:
  - tdd
  - evidence
  - traceability
  - validation
related_code:
  - skills/test-driven-development/SKILL.md
  - skills/test-driven-development/templates/tdd-evidence.md
  - skills/test-driven-development/scripts/validate_tdd_evidence.py
  - scripts/preflight.py
related_specs:
  - docs/coding-plugins/features/plugin/preflight/specs/feature.md
---

# TDD 证据 固定落地路径规格

## 目标

为 TDD 证据 和 TDD 例外记录 规定稳定的仓库内落地路径，使规格、计划、测试证据可以按同一个 area/capability 检索和校验。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不改变 RED-GREEN-REFACTOR 的执行规则。 |
| NON-002 | 不替代测试文件、测试报告或 CI 日志本身。 |
| NON-003 | 不强制覆盖已有项目自己的测试报告约定；已有约定优先，但必须在最终报告中写明实际路径。 |

## 背景

- 当前行为：TDD 证据 要求出现在最终报告中，但没有固定文件路径。
- 目标用户或调用方：插件使用者、实现子代理、计划执行者、preflight 校验。
- 约束：路径必须和现有规格、计划路径规则一致，并可由 Python 标准库脚本校验。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | TDD 证据 默认保存到 `docs/coding-plugins/features/{area}/{capability}/evidence/tdd-evidence.md`。 | 文档评审 `skills/test-driven-development/SKILL.md`。 |
| REQ-002 | 必须 | area/capability 必须和规格、计划路径保持一致。 | 文档评审 `skills/writing-plans/SKILL.md` 和 `docs/workflow-chain.md`。 |
| REQ-003 | 必须 | writing-plans 必须在计划中声明 TDD 证据 Target，并把 Spec ID 映射到 evidence 文件。 | 文档评审 `skills/writing-plans/SKILL.md`。 |
| REQ-004 | 必须 | 仓库提供 TDD 证据 模板，覆盖 Evidence 和 Exception Record 两种情况。 | 文件检查 `skills/test-driven-development/templates/tdd-evidence.md`。 |
| REQ-005 | 必须 | preflight 必须自动严格校验 `docs/coding-plugins/features/**/evidence/**/*.md` 下的证据文件。 | 单测 `test_collect_tdd_evidence_files_uses_feature_first_path` 和 preflight 命令。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 项目没有 feature evidence 目录。 | preflight 跳过 evidence 文件校验，不报错。 | 单测或命令行为评审。 |
| ERR-002 | evidence 文件缺少必需字段。 | `validate_tdd_evidence.py --strict` 失败。 | 既有 TDD validator 单测。 |
| ERR-003 | 文档、manifest 或配置修改无法先写失败测试。 | 在固定 evidence 文件中记录 `TDD 例外记录`。 | 本次 evidence 文件。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 用户查找 TDD 最终落地文件 | 已有 area 和 capability | 查看 `docs/coding-plugins/features/{area}/{capability}/evidence/tdd-evidence.md` | 能找到 TDD 证据 或 Exception Record。 |
| AC-002 | 计划生成后执行 | 已有规格路径和计划路径 | 阅读 implementation plan | 计划声明对应 TDD 证据 Target。 |
| AC-003 | 发布前检查 | evidence 文件存在 | 运行 `python3 scripts/preflight.py` | preflight 自动校验证据文件并通过。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 文档评审 | `skills/test-driven-development/SKILL.md` | Task 1 | 已覆盖 |
| REQ-002 | 文档评审 | `skills/writing-plans/SKILL.md`, `docs/workflow-chain.md` | Task 1 | 已覆盖 |
| REQ-003 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 1 | 已覆盖 |
| REQ-004 | 文件检查 | `skills/test-driven-development/templates/tdd-evidence.md` | Task 1 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest skills/test-driven-development/scripts/test_validate_tdd_evidence.py` | Task 2 | 已覆盖 |
| ERR-003 | 文件检查 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` | Task 3 | 已覆盖 |
| AC-001 | 文件检查 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` | Task 3 | 已覆盖 |
| AC-002 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 1 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
