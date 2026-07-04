# Coding Plugins 文档契约

本文定义 `docs/coding-plugins/features/<feature-name>/` 下需求文档、技术方案、测试用例、TED 任务执行文档、README、VED 证据文档和生成索引的职责边界。同一 feature 下允许多条文档链路，默认使用 `<doc-id>-PRD/TSD/TVD/TED/VED.md` 区分。

操作型规则由 `skills/document-metadata/SKILL.md` 维护；通用 frontmatter 模板使用 `skills/document-metadata/templates/document-metadata.md`。

## 分层规则

| 层级 | 来源文件 | 负责内容 | 不负责内容 |
| --- | --- | --- | --- |
| Metadata | 每个文档开头的 frontmatter | 状态、Feature、Doc ID、标签、生命周期、关联文档、日期 | 正式需求、设计细节、执行步骤 |
| 正式正文 | spec、technical、test-cases、TED、evidence 的正文 | 需求契约、技术方案、测试用例、任务拆分、验证证据 | 生成式索引和重复的产物链路表 |
| README | feature root `README.md` | 人工摘要、轻量例外追踪、检索关键词 | 手写 `产物链路` 或 `文档链路` |
| INDEX | `docs/coding-plugins/INDEX.md` | 生成式检索视图 | 手工维护的正式内容 |

## Evidence 生命周期

active evidence 固定使用：

```text
docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
```

历史证据归档到：

```text
docs/coding-plugins/features/<feature-name>/evidences/archive/<date>-<summary>.md
```

归档 evidence 必须在 frontmatter 中声明 `status: archived`、`validation_mode: historical`、`archive_of` 和 `archived_at`。`INDEX.md` 只展示 active evidence，preflight 对 active evidence 做严格 TDD 校验，对 archive 只校验历史 metadata。

## 跨仓库引用

`related_docs` 只保存当前仓库内 `docs/coding-plugins/...` 路径。跨仓库或绝对路径引用写入 `external_references`：

```yaml
external_references:
  - /Users/vincen/workspace/evobeing_creek_wrapper/docs/sdk-wrapper/Evobeing-Creek-Wrapper对接说明.md
```

默认 `npm run preflight` 会检查仓库内 feature 文档声明的本地外部路径；URL 引用不会做联网检查。需要同步生成索引时运行：

```bash
npm run preflight -- --write-index
```

## 契约迁移

旧文档迁移到当前契约时运行：

```bash
npm run document-contract-migration:ts -- --dry-run
npm run document-contract-migration:ts --
```

迁移脚本会把旧 metadata 关系合并为 `related_docs`，把旧规格关系中的裸 Spec ID 移到 `related_spec_ids`，并为 evidence 补齐基础 metadata。脚本不生成复杂技术方案文档或 TED 任务执行文档。

## Metadata 优先

后续代理读取 feature 文档时，先读 README 和目标文档的 frontmatter，再读正文：

1. 先使用 `document-metadata` 技能确认读取顺序。
2. 先确认 `feature`、`doc_id`、`status`、`updated`。
3. 再读取同一 `doc_id` 链路的 `related_docs`。
4. 最后进入正文中的需求、设计、TED 任务执行或证据。

当 frontmatter 和正文摘要冲突时，以 frontmatter 为准，并修正文档。

## 正文边界

正文可以引用执行所需来源，例如 Spec ID、Test Case ID、Task ID、`doc_id`、命令记录和真实测试输出。这些属于正式内容。

正文不维护索引型链路表，也不在任务表、测试用例或证据摘要中重复写完整 `docs/coding-plugins/features/...` 路径。文档间关系写入 frontmatter `related_docs`；检索入口由 `docs/coding-plugins/INDEX.md` 生成。README 中禁止出现 `## 产物链路` 或 `## 文档链路`。需要检索完整链路时，运行：

```bash
npm run preflight -- --write-index
```

## 校验入口

发布、提交或分发前运行：

```bash
npm run preflight -- --write-index
npm run preflight
```

preflight 会校验 README metadata、Evidence metadata、路径一致性、关联路径存在性和生成索引一致性。
