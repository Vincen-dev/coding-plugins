---
spec_id: <area-capability-state-machine>
title: <状态机名称>
type: state-machine
status: draft
area: <area>
capability: <capability>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <tag>
related_code:
  - <path>
related_specs: []
---

# <状态机名称>规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| 领域 | <area> |
| 能力 | <capability> |
| 规格类型 | state-machine |

## 目标

<说明该状态机描述的对象和生命周期。>

## 状态

| 编号 | 状态 | 含义 | 是否终态 |
| --- | --- | --- | --- |
| STATE-001 | `draft` | <含义> | 否 |

## 状态迁移

| 编号 | 来源状态 | 事件 | 守卫条件 | 目标状态 | 副作用 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- |
| STATE-010 | `draft` | `submit` | <条件> | `submitted` | <副作用> | <测试> |

## 非法迁移

| 编号 | 来源状态 | 事件 | 期望错误 | 验证方式 |
| --- | --- | --- | --- | --- |
| ERR-001 | <状态> | <事件> | <错误> | <测试> |

## 可观测性

| 编号 | 事件或指标 | 触发时机 |
| --- | --- | --- |
| OBS-001 | <事件> | <时机> |

## 追踪矩阵

<!-- 交接前插入 templates/traceability-matrix.md。 -->
