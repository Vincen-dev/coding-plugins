# Technical Design Validator

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | technical-design-validator |
| 标签 | technical-design, validator, preflight, stale, traceability |

## 摘要

本 capability 将 technical design 质量检查沉淀为独立 validator。目标是把结构校验、Spec ID 覆盖、related 链路、泛化映射 warning 和 stale 检测集中到一个可单独运行、可由 preflight 复用的入口。
