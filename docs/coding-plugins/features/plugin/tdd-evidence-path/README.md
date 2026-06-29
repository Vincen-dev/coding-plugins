# TDD Evidence 固定落地路径

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | tdd-evidence-path |
| 标签 | tdd, evidence, traceability, validation |

## 产物链路

| 产物 | 路径 |
| --- | --- |
| 规格 | `specs/feature.md` |
| 技术设计 | - |
| 实现计划 | - |
| TDD Evidence | `evidence/tdd-evidence.md` |

## 轻量例外

- **Reason:** 该 feature 固定的是 TDD Evidence 路径和校验入口，实施细节已经由规格、模板和 Evidence 记录覆盖；单独 technical/plan 会重复路径契约。
- **Verification:** python3 scripts/preflight.py

| Spec ID | Evidence |
| --- | --- |
| NON-003 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` |
| REQ-001 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` |
| REQ-002 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` |
| REQ-003 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` |
| REQ-004 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` |
| REQ-005 | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` |
