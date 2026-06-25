# <API or SDK Name> Contract Specification

## Goal

<说明该 API/SDK 契约解决什么问题。>

## Non-goals

| ID | Non-goal |
| --- | --- |
| NON-001 | <明确不支持的能力> |

## Endpoints or Methods

| ID | Method | Path / Signature | Purpose |
| --- | --- | --- | --- |
| API-001 | GET | `/resource/{id}` | <用途> |

## Request Contract

```json
{
  "example": "request"
}
```

## Response Contract

```json
{
  "example": "response"
}
```

## Errors

| ID | Condition | Status / Code | Response example | Verification |
| --- | --- | --- | --- | --- |
| ERR-001 | <错误条件> | <状态码或错误码> | <示例> | <contract test> |

## Compatibility

| ID | Requirement | Verification |
| --- | --- | --- |
| MIG-001 | <兼容或迁移要求> | <验证方式> |

## Acceptance Criteria

| ID | Scenario | Given | When | Then |
| --- | --- | --- | --- | --- |
| AC-001 | <场景名> | <前置条件> | <请求> | <响应> |

## Traceability

<!-- Insert templates/traceability-matrix.md here before handoff. -->
