---
spec_id: <area-capability-api-contract>
title: <API 或 SDK 名称>契约
type: api-contract
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

# <API 或 SDK 名称>契约规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| 领域 | <area> |
| 能力 | <capability> |
| 规格类型 | api-contract |

## 目标

<说明该 API/SDK 契约解决什么问题。>

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | <明确不支持的能力> |

## 端点或方法

| 编号 | 方法 | 路径或签名 | 用途 |
| --- | --- | --- | --- |
| API-001 | GET | `/resource/{id}` | <用途> |

## 请求契约

```json
{
  "example": "request"
}
```

## 响应契约

```json
{
  "example": "response"
}
```

## 错误

| 编号 | 条件 | 状态或错误码 | 响应示例 | 验证方式 |
| --- | --- | --- | --- | --- |
| ERR-001 | <错误条件> | <状态码或错误码> | <示例> | <契约测试> |

## 兼容性

| 编号 | 要求 | 验证方式 |
| --- | --- | --- |
| MIG-001 | <兼容或迁移要求> | <验证方式> |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | <场景名> | <前置条件> | <请求> | <响应> |

## 追踪矩阵

<!-- 交接前插入 templates/traceability-matrix.md。 -->
