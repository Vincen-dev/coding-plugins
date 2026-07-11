# document-metadata.md

复制本模板时，只保留目标文档类型需要的字段。机器可读 key 保持英文；中文展示写在正文 `## 文档信息`。`feature` 表示 `docs/coding-plugins/features/<feature-name>/` 模块目录，`doc_id` 表示该 feature 下的一条具体文档链路。`updated` 表示本文档内容或 metadata 已完成更新，也表示已按上游文档变更完成同步评审。

可执行规则集中在 `src/lib/documents/document-metadata.ts`。新增或调整文档类型、后缀、目录、必填字段、`related_docs` 关系或同步链时，先更新该脚本，再同步本模板。顶层 `src/lib/document-metadata.ts` 仅作为兼容入口。

## 通用 frontmatter

```yaml
---
title: <文档标题>
status: draft
feature: <feature-name>
doc_id: <doc-id>
workflow_schema: governed-v2
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <检索标签>
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
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
related_docs:
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
---
```

## Technical solution frontmatter

```yaml
---
title: <功能名称>技术方案
status: draft
lifecycle_status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
implemented_commits: []
validated_by: <验证命令或人工验证记录>
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
---
```

## TED frontmatter

```yaml
---
title: <功能名称> Task Execution Document
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
source_hash: sha256:<由 src/cli/workflow-state.ts hash --feature <feature-name> --doc-id <doc-id> 生成>
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
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
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
---
```

## Evidence frontmatter

```yaml
---
title: <功能名称> VED 证据文档
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
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
archive_of: docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
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
| 文档类型 | <PRD / TSD / TVD / TED / VED> |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | <本文正文最重要的章节，例如需求点、设计决策、实现点、测试用例、执行任务或验证证据> |
| 同步状态 | 已按上游文档变更完成同步评审 |
```

中文 `文档信息` 只服务人工阅读，不维护 PRD/TSD/TVD/TED/VED 路径清单。路径关系和状态判断以 frontmatter 与 `docs/coding-plugins/INDEX.md` 为准。

## 同步更新规则

```text
PRD -> TSD -> TVD -> TED -> VED
```

上游文档的 `updated` 晚于下游文档时，下游文档必须同步更新或完成无影响评审，并把自身 `updated` 调整为不早于上游文档。preflight 会按该规则拒绝过期链路。
