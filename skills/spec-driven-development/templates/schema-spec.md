---
spec_id: <feature-name-schema>
title: <数据结构名称>
type: schema
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <tag>
related_code:
  - <path>
related_specs: []
---

# <数据结构名称>规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| 规格类型 | schema |

## 目标

<说明该 schema 约束什么数据或消息。>

## 范围

- 生产方：
- 消费方：
- 存储或传输：

## 数据结构契约

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
