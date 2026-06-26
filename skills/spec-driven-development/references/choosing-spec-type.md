# Choosing Spec Type

根据系统边界选择最小必要规格。一个任务可以组合多种规格，但不要为了形式生成无用章节。

| 触发信号 | 规格类型 | 模板 |
| --- | --- | --- |
| 用户流程、业务规则、可见行为 | Feature spec | `templates/feature-spec.md` |
| HTTP、RPC、CLI、SDK、公用函数契约 | API contract spec | `templates/api-contract-spec.md` |
| 配置、数据库记录、事件 payload、消息体 | Schema spec | `templates/schema-spec.md` |
| 审批、订单、任务、同步流程、生命周期 | State machine spec | `templates/state-machine-spec.md` |
| 用户验收不清、端到端行为不清 | Acceptance criteria | `templates/acceptance-criteria.md` |
| 无新增需求，但有重构、升级、迁移、回归风险 | Maintenance spec | `templates/maintenance-spec.md` |

选择规则：

- 有外部调用者时，优先写契约。
- 有持久化或跨进程数据时，优先写 schema。
- 有“状态 + 事件 + 转移”时，优先写状态机。
- 只有内部函数且需求明确时，可写轻量 feature spec。
- 没有新需求时，不写 feature spec；只有行为、兼容性、迁移、风险或验证口径会变化时才写 maintenance spec。
- 规格类型不确定时，先问一个会改变规格结构的问题。

## 无新需求时的规格选择

没有新功能输入时，优先判断是否真的需要规格：

| 场景 | 是否写规格 | 规格形态 |
| --- | --- | --- |
| 只解释代码、查资料、普通 review | 否 | 不创建规格 |
| 纯格式化、命名、无行为影响的小整理 | 通常否 | 在计划或最终回复中说明验证即可 |
| 重构但必须保持外部行为 | 是 | Maintenance spec，记录 baseline 和 invariants |
| bug 修复已有根因或复现路径 | 是 | Maintenance spec，记录 ERR/AC 和回归测试 |
| 依赖升级、数据迁移、接口版本变化 | 是 | Maintenance spec + MIG 规则；必要时叠加 API/schema spec |
| 日志、指标、审计是验收条件 | 是 | Maintenance spec + OBS 规则 |

没有新需求时，规格的重点不是“新增什么”，而是“什么不能变、什么必须被验证、哪些风险要被固定”。
