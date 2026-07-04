---
title: <数据结构名称>
type: schema
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <tag>
related_code:
  - <path>
related_docs: []
---

# <数据结构名称>规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 规格类型 | schema |

使用规则：本模板只作为需求点章节参考。Schema / 数据契约应写入对应 `## 标题（SCHEMA-001）` 或 `## 标题（REQ-001）` 章节的 `### 关联契约`、`### 输入与输出`、`### 错误和边界` 中，不要在 PRD 顶层堆叠独立 schema 大表。

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
