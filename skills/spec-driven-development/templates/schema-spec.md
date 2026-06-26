---
spec_id: <area-capability-schema>
title: <Schema 名称>
type: schema
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

# <Schema 名称>规格

## 目标

<说明该 schema 约束什么数据或消息。>

## 范围

- 生产方：
- 消费方：
- 存储或传输：

## Schema 契约

| 编号 | 字段 | 类型 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- | --- | --- |
| SCHEMA-001 | `id` | string | 是 | non-empty | <说明> |

## 有效示例

```json
{
  "id": "example"
}
```

## 无效示例

| 编号 | 示例 | 期望错误 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | `{}` | <错误> | <schema 校验测试> |

## 兼容性

| 编号 | 要求 | 验证方式 |
| --- | --- | --- |
| MIG-001 | <新增/废弃字段策略> | <验证方式> |

## 追踪矩阵

<!-- 交接前插入 templates/traceability-matrix.md。 -->
