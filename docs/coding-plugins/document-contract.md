# Coding Plugins 文档契约

本文定义 `docs/coding-plugins/features/<area>/<capability>/` 下规格、技术设计、实现计划、README、Evidence 和生成索引的职责边界。

## 分层规则

| 层级 | 来源文件 | 负责内容 | 不负责内容 |
| --- | --- | --- | --- |
| Metadata | 每个文档开头的 frontmatter | 状态、领域、能力、标签、生命周期、关联文档、日期 | 正式需求、设计细节、执行步骤 |
| 正式正文 | spec、technical、plan、evidence 的正文 | 需求契约、技术方案、任务拆分、验证证据 | 生成式索引和重复的产物链路表 |
| README | feature root `README.md` | 人工摘要、轻量例外追踪、检索关键词 | 手写 `产物链路` 或 `文档链路` |
| INDEX | `docs/coding-plugins/INDEX.md` | 生成式检索视图 | 手工维护的正式内容 |

## Metadata 优先

后续代理读取 feature 文档时，先读 README 和目标文档的 frontmatter，再读正文：

1. 先确认 `area`、`capability`、`status`、`updated`。
2. 再读取 `related_specs`、`related_technical`、`related_plans`、`related_evidence`。
3. 最后进入正文中的需求、设计、计划或证据。

当 frontmatter 和正文摘要冲突时，以 frontmatter 为准，并修正文档。

## 正文边界

正文可以引用执行所需来源，例如 Plan 的 `技术设计来源`、Technical 的规格映射证据路径、Evidence 的命令记录。这些属于正式内容。

正文不维护索引型链路表。README 中禁止出现 `## 产物链路` 或 `## 文档链路`。需要检索完整链路时，运行：

```bash
python3 scripts/preflight.py --write-index
```

## 校验入口

发布、提交或分发前运行：

```bash
python3 scripts/preflight.py --write-index
python3 scripts/preflight.py
```

preflight 会校验 README metadata、Evidence metadata、路径一致性、关联路径存在性和生成索引一致性。
