# Coding Plugins Feature 索引

本索引用于按 `Feature` 检索 feature-first 文档链路。运行 `npm run preflight -- --write-index` 可根据 feature root 重新生成本文件。

| Feature | Doc ID | 功能根目录 | 需求文档 | 技术方案 | 测试用例 | 任务执行 | 证据 | 标签 | 更新日期 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

规则:

- `Feature` 必须和 `功能根目录` 路径一致。
- `Doc ID` 来自文件名去掉 `-PRD`、`-TSD`、`-TVD`、`-TED` 或 `-VED` 后的前缀，用于区分同一 feature 下多条文档链路。
- `功能根目录` 指向 `docs/coding-plugins/features/<feature-name>`。
- `需求文档` 指向 `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`；没有需求文档时使用 `-`。
- `技术方案` 指向 `docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md`；没有技术方案时使用 `-`。
- `测试用例` 指向 `docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md`；没有测试用例时使用 `-`。
- `任务执行` 指向 `docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md`；没有 TED 任务执行文档时使用 `-`。
- `证据` 指向 `docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md`；没有证据时使用 `-`。
- `标签` 来自 feature README frontmatter 的 `tags` 列表；日期来自需求文档、技术方案、测试用例或 TED 任务执行文档 frontmatter 的最大 `updated` 值。
