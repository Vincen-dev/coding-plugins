# Coding Plugins Feature 索引

本索引用于按 `Feature` 检索 feature-first 文档链路。运行 `npm run preflight -- --write-index` 可根据 feature root 重新生成本文件。

| Feature | Doc ID | 功能根目录 | 需求文档 | 技术方案 | 测试用例 | 任务执行 | 证据 | 标签 | 更新日期 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| review-findings-subagents | review-findings-subagents | `docs/coding-plugins/features/review-findings-subagents` | `docs/coding-plugins/features/review-findings-subagents/requirements/review-findings-subagents-PRD.md` | `docs/coding-plugins/features/review-findings-subagents/technicals/review-findings-subagents-TSD.md` | `docs/coding-plugins/features/review-findings-subagents/test-cases/review-findings-subagents-TVD.md` | `docs/coding-plugins/features/review-findings-subagents/plans/review-findings-subagents-TED.md` | `docs/coding-plugins/features/review-findings-subagents/evidences/review-findings-subagents-VED.md` | - | 2026-07-04 |
| skill-file-naming | skill-file-naming | `docs/coding-plugins/features/skill-file-naming` | `docs/coding-plugins/features/skill-file-naming/requirements/skill-file-naming-PRD.md` | `docs/coding-plugins/features/skill-file-naming/technicals/skill-file-naming-TSD.md` | `docs/coding-plugins/features/skill-file-naming/test-cases/skill-file-naming-TVD.md` | `docs/coding-plugins/features/skill-file-naming/plans/skill-file-naming-TED.md` | `docs/coding-plugins/features/skill-file-naming/evidences/skill-file-naming-VED.md` | - | 2026-07-04 |
| skill-internationalization | skill-internationalization | `docs/coding-plugins/features/skill-internationalization` | `docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md` | `docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md` | `docs/coding-plugins/features/skill-internationalization/test-cases/skill-internationalization-TVD.md` | `docs/coding-plugins/features/skill-internationalization/plans/skill-internationalization-TED.md` | `docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md` | skill-internationalization, i18n, skills | 2026-07-07 |
| technical-doc-quality | technical-doc-quality | `docs/coding-plugins/features/technical-doc-quality` | `docs/coding-plugins/features/technical-doc-quality/requirements/technical-doc-quality-PRD.md` | `docs/coding-plugins/features/technical-doc-quality/technicals/technical-doc-quality-TSD.md` | `docs/coding-plugins/features/technical-doc-quality/test-cases/technical-doc-quality-TVD.md` | `docs/coding-plugins/features/technical-doc-quality/plans/technical-doc-quality-TED.md` | `docs/coding-plugins/features/technical-doc-quality/evidences/technical-doc-quality-VED.md` | - | 2026-07-04 |

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
