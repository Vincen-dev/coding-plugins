# <State Machine Name> Specification

## Goal

<说明该状态机描述的对象和生命周期。>

## States

| ID | State | Meaning | Terminal |
| --- | --- | --- | --- |
| STATE-001 | `draft` | <含义> | no |

## Transitions

| ID | From | Event | Guard | To | Side effects | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| STATE-010 | `draft` | `submit` | <条件> | `submitted` | <副作用> | <test> |

## Invalid Transitions

| ID | From | Event | Expected error | Verification |
| --- | --- | --- | --- | --- |
| ERR-001 | <状态> | <事件> | <错误> | <test> |

## Observability

| ID | Event or metric | When emitted |
| --- | --- | --- |
| OBS-001 | <事件> | <时机> |

## Traceability

<!-- Insert templates/traceability-matrix.md here before handoff. -->
