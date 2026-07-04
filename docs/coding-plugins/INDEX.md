# Coding Plugins Feature 索引

本索引用于按 `Feature` 检索 feature-first 文档链路。运行 `npm run preflight -- --write-index` 可根据 feature root 重新生成本文件。

| Feature | Doc ID | 功能根目录 | 需求文档 | 技术设计 | 技术实现 | 测试用例 | 任务执行 | 证据 | 标签 | 更新日期 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| review-findings-subagents | review-findings-subagents | `docs/coding-plugins/features/review-findings-subagents` | - | - | - | - | - | `docs/coding-plugins/features/review-findings-subagents/evidences/review-findings-subagents-TED.md` | - | - |
| technical-doc-quality | technical-doc-quality | `docs/coding-plugins/features/technical-doc-quality` | - | - | - | - | - | `docs/coding-plugins/features/technical-doc-quality/evidences/technical-doc-quality-TED.md` | - | - |

规则:

- `Feature` 必须和 `功能根目录` 路径一致。
- `Doc ID` 来自文件名去掉 `-PRD`、`-TDD`、`-TID`、`-TCD`、`-IPD` 或 `-TED` 后的前缀，用于区分同一 feature 下多条文档链路。
- `功能根目录` 指向 `docs/coding-plugins/features/<feature-name>`。
- `需求文档` 指向 `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`；没有需求文档时使用 `-`。
- `技术设计` 指向 `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TDD.md`；没有技术设计时使用 `-`。
- `技术实现` 指向 `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TID.md`；没有技术实现文档时使用 `-`。
- `测试用例` 指向 `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TCD.md`；没有测试用例时使用 `-`。
- `任务执行` 指向 `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-IPD.md`；没有 IPD 任务执行文档时使用 `-`。
- `证据` 指向 `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md`；没有证据时使用 `-`。
- `标签` 来自 feature README frontmatter 的 `tags` 列表；日期来自需求文档、技术设计、测试用例或 IPD 任务执行文档 frontmatter 的最大 `updated` 值。
