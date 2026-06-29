# 插件行为级测试

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | behavior-tests |
| 标签 | testing, routing, hooks, claude-code |

## 产物链路

| 产物 | 路径 |
| --- | --- |
| 规格 | `specs/feature.md` |
| 技术设计 | - |
| 实现计划 | - |
| TDD 证据| `evidence/tdd-evidence.md` |

## 轻量例外

- **原因:** 该 feature 范围只包含本地行为测试补充，已由规格和 TDD 证据明确测试文件、失败原因和最终验证；单独 technical/plan 会重复 evidence 中的任务。
- **验证方式:** python3 scripts/preflight.py

| 规格 ID | 证据 |
| --- | --- |
| REQ-001 | `docs/coding-plugins/features/plugin/behavior-tests/evidence/tdd-evidence.md` |
| REQ-002 | `docs/coding-plugins/features/plugin/behavior-tests/evidence/tdd-evidence.md` |
| REQ-003 | `docs/coding-plugins/features/plugin/behavior-tests/evidence/tdd-evidence.md` |
| REQ-004 | `docs/coding-plugins/features/plugin/behavior-tests/evidence/tdd-evidence.md` |
| REQ-005 | `docs/coding-plugins/features/plugin/behavior-tests/evidence/tdd-evidence.md` |
