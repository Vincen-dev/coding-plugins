# document-metadata.md

复制本模板时，只保留目标文档类型需要的字段。机器可读 key 保持英文；中文展示写在正文 `## 文档信息`。`feature` 表示 `docs/coding-plugins/features/<feature-name>/` 模块目录，`doc_id` 表示该 feature 下的一条具体文档链路。`updated` 表示本文档内容或 metadata 已完成更新，也表示已按上游文档变更完成同步评审。

可执行规则集中在 `scripts/document_metadata.py`。新增或调整文档类型、后缀、目录、必填字段、`related_*` 关系或同步链时，先更新该脚本，再同步本模板。

## 通用 frontmatter

```yaml
---
title: <文档标题>
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <检索标签>
related_specs: []
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
related_code:
  - <代码路径>
external_references:
  - <跨仓库或绝对路径引用>
---
```

## Spec frontmatter

```yaml
---
title: <规格标题>
type: feature | api-contract | schema | state-machine | acceptance | maintenance
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <检索标签>
related_code:
  - <代码路径>
related_specs: []
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---
```

## Technical design frontmatter

```yaml
---
title: <功能名称>技术设计
status: draft
lifecycle_status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: <验证命令或人工验证记录>
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---
```

## Technical implementation frontmatter

```yaml
---
title: <功能名称>技术实现
status: draft
lifecycle_status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: <验证命令或人工验证记录>
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---
```

## Plan frontmatter

```yaml
---
title: <功能名称>实现计划
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---
```

## Test cases frontmatter

```yaml
---
title: <功能名称>测试用例
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence:
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
---
```

## Evidence frontmatter

```yaml
---
title: <功能名称> TDD 证据
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md
related_test_cases:
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md
related_evidence: []
---
```

## Archived evidence frontmatter

```yaml
---
title: <历史证据标题>
status: archived
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
validation_mode: historical
archive_of: docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md
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
| Doc ID | <doc-id> |
| 需求文档 | `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md` |
| 技术实现 | `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md` |
| 测试用例 | `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md` |
| 实现计划 | `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md` |
| TDD 证据 | `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md` |
```

中文 `文档信息` 只服务人工阅读。路径关系和状态判断以 frontmatter 为准。

## 同步更新规则

```text
PRD -> TDD -> TID -> TCD -> IPD -> TED
```

上游文档的 `updated` 晚于下游文档时，下游文档必须同步更新或完成无影响评审，并把自身 `updated` 调整为不早于上游文档。preflight 会按该规则拒绝过期链路。
