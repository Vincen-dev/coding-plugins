# Choosing Spec Type

根据系统边界选择最小必要规格。一个任务可以组合多种规格，但不要为了形式生成无用章节。

| 触发信号 | 规格类型 | 模板 |
| --- | --- | --- |
| 用户流程、业务规则、可见行为 | Feature spec | `templates/feature-spec.md` |
| HTTP、RPC、CLI、SDK、公用函数契约 | API contract spec | `templates/api-contract-spec.md` |
| 配置、数据库记录、事件 payload、消息体 | Schema spec | `templates/schema-spec.md` |
| 审批、订单、任务、同步流程、生命周期 | State machine spec | `templates/state-machine-spec.md` |
| 用户验收不清、端到端行为不清 | Acceptance criteria | `templates/acceptance-criteria.md` |

选择规则：

- 有外部调用者时，优先写契约。
- 有持久化或跨进程数据时，优先写 schema。
- 有“状态 + 事件 + 转移”时，优先写状态机。
- 只有内部函数且需求明确时，可写轻量 feature spec。
- 规格类型不确定时，先问一个会改变规格结构的问题。
