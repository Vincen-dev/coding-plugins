# document-metadata.md

复制本模板时，只保留目标文档类型需要的字段。机器可读 key 保持英文；中文展示写在正文 `## 文档信息`。

## 通用 frontmatter

```yaml
---
title: <文档标题>
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <检索标签>
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md
related_code:
  - <代码路径>
external_references:
  - <跨仓库或绝对路径引用>
---
```

## Spec frontmatter

```yaml
---
spec_id: <feature-name-kind>
title: <规格标题>
type: feature | api-contract | schema | state-machine | acceptance | maintenance
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <检索标签>
related_code:
  - <代码路径>
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<spec-kind>.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md
---
```

## Technical design frontmatter

```yaml
---
title: <功能名称>技术设计
status: draft
lifecycle_status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: <验证命令或人工验证记录>
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md
---
```

## Technical implementation frontmatter

```yaml
---
title: <功能名称>技术实现
status: draft
lifecycle_status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: <验证命令或人工验证记录>
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md
---
```

## Plan frontmatter

```yaml
---
title: <功能名称>实现计划
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md
---
```

## Test cases frontmatter

```yaml
---
title: <功能名称>测试用例
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md
---
```

## Evidence frontmatter

```yaml
---
title: <功能名称> TDD 证据
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md
---
```

## Archived evidence frontmatter

```yaml
---
title: <历史证据标题>
status: archived
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
validation_mode: historical
archive_of: docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md
archived_at: YYYY-MM-DD
---
```

## 中文文档信息

```markdown
## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| 需求文档 | `docs/coding-plugins/features/<feature-name>/requirements/<feature-name>-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-TID.md` |
| 测试用例 | `docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-TCD.md` |
| 实现计划 | `docs/coding-plugins/features/<feature-name>/plans/<feature-name>-IPD.md` |
| TDD 证据 | `docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md` |
```

中文 `文档信息` 只服务人工阅读。路径关系和状态判断以 frontmatter 为准。
