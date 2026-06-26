---
spec_id: <area-capability-schema>
title: <Schema Name>
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

# <Schema Name> Specification

## Goal

<说明该 schema 约束什么数据或消息。>

## Scope

- Producer:
- Consumer:
- Storage or transport:

## Schema Contract

| ID | Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- | --- |
| SCHEMA-001 | `id` | string | yes | non-empty | <说明> |

## Valid Example

```json
{
  "id": "example"
}
```

## Invalid Examples

| ID | Example | Expected error | Verification |
| --- | --- | --- | --- |
| ERR-001 | `{}` | <错误> | <schema validation test> |

## Compatibility

| ID | Requirement | Verification |
| --- | --- | --- |
| MIG-001 | <新增/废弃字段策略> | <验证方式> |

## Traceability

<!-- Insert templates/traceability-matrix.md here before handoff. -->
