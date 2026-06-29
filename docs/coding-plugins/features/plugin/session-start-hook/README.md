# Codex 会话启动入口注入

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | session-start-hook |
| 标签 | codex, hook, session-start, bootstrap, workflow |

## 产物链路

| 产物 | 路径 |
| --- | --- |
| 规格 | `specs/feature.md` |
| 技术设计 | - |
| 实现计划 | - |
| TDD Evidence | `evidence/tdd-evidence.md` |

## 轻量例外

- **Reason:** 该 feature 只涉及 Codex hook 配置、脚本和 hook 测试，规格与 TDD Evidence 已覆盖全部文件和验证命令；单独 technical/plan 不会增加新的执行信息。
- **Verification:** python3 scripts/preflight.py
