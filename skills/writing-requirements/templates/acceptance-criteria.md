---
title: <验收标准>
type: acceptance
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <tag>
related_code:
  - <path>
related_specs: []
---

# 验收标准

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 规格类型 | acceptance |

验收标准应写入对应需求点章节，章节标题使用 `## 标题（REQ-001）`。当验收标准跨多个需求点时，为每个需求点分别维护 AC，避免把不同需求压进同一行。

## <需求点标题>（REQ-001）

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| AC-001 | <场景名> | <前置条件> | <动作> | <可观察结果> | <测试或人工验收证据> |

规则：

- 每条验收标准只验证一个用户可观察结果。
- 期望结果必须可观察，不能写“系统正常处理”。
- 错误路径和边界条件必须有独立 AC。
- 如果 AC 无法自动化，写明人工验收步骤和证据。
