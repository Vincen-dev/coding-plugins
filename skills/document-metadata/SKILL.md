---
name: document-metadata
description: Use when reading, creating, updating, migrating, or auditing Coding Plugins feature documents, frontmatter metadata, related_docs links, README/INDEX document relations, or document-metadata.md templates.
---

# 文档 Metadata

## 总览

文档 metadata 是 Coding Plugins 文档系统的机器可读入口。读取或维护 `docs/coding-plugins/features/<feature-name>/` 下的 README、PRD、TSD、TVD、TED、VED 时，先读 frontmatter，再读正文。同一 feature 模块下可以有多条文档链路，链路由 `doc_id` 区分。

**核心原则：**文档之间的关系以 metadata 为准，正文负责需求、设计、TED 任务执行和证据，不负责维护索引型链路。

**规则中心：**每个文档的 frontmatter 是该文档的 metadata 实例；字段、命名、路径、`related_docs` 推导和同步依赖的可执行规则集中在 `src/lib/document-metadata.ts`。`src/lib/docs-index.ts`、`src/cli/preflight.ts` 和 validator 必须复用该模块，不要在各自脚本中重新维护一套文档类型或关系规则。

开始时声明：“我正在使用 document-metadata 技能来读取和维护文档 metadata 关系。”

## 何时使用

使用本技能：

- 读取 feature 文档并需要理解上下游关系。
- 创建或更新 README、PRD、TSD 技术方案文档、TVD 测试用例、TED 任务执行文档或 VED 证据。
- 维护 `related_docs`、`related_code`、`external_references`。
- 迁移、审计或修复 frontmatter metadata。
- 需要使用 `templates/document-metadata.md` 作为文档 metadata 模板。
- 发现正文摘要、README、INDEX 或 frontmatter 之间存在冲突。

不单独使用本技能：

- 只解释普通代码，不读取 Coding Plugins 文档。
- 只运行测试或提交代码，且不涉及文档关系。
- 编写具体 PRD、TSD、TVD、TED 或 VED 时，本技能只负责 metadata；正文仍由对应技能负责。

## 读取顺序

1. 先读目标 feature 的 `README.md` frontmatter，确认 `title`、`status`、`feature`、`updated`、`tags`。
2. 再读目标文档 frontmatter，确认 `feature` 是否与路径 `docs/coding-plugins/features/<feature-name>/` 一致，并确认 `doc_id` 是否与文件名前缀一致。
3. 按 `related_docs` 读取同一 `doc_id` 链路的相关文档。
4. 如果存在跨仓库或本机绝对路径，只从 `external_references` 读取，不写入 `related_docs`。
5. 最后阅读正文中的正式需求、技术方案、执行步骤或验证证据。

如果 frontmatter 和正文 `## 文档信息` 冲突，以 frontmatter 为准，并修正文档信息摘要。

## Metadata 关系源

| 字段 | 用途 | 约束 |
| --- | --- | --- |
| `title` | 文档标题 | 面向索引和人工检索，保持稳定清晰 |
| `status` | 文档状态 | 常用值：`draft`、`approved`、`superseded`、`archived` |
| `feature` | feature 归属 | 必须匹配 `docs/coding-plugins/features/<feature-name>/` |
| `doc_id` | 文档链路 ID | 默认等于 `<feature-name>`；多 PRD feature 中必须对应文件名 `<doc-id>-XXX.md` 的前缀 |
| `created` / `updated` | 生命周期日期 | 使用 `YYYY-MM-DD`，不要写进文件名；`updated` 同时表示文档已按上游变更完成同步评审 |
| `tags` | README 检索标签 | README 必填，`INDEX.md` 从 README frontmatter 读取 |
| `lifecycle_status` | technical 生命周期 | TSD 使用：`draft`、`approved`、`implemented`、`stale`、`superseded`；只有 `implemented` 表示需要 VED 最终验证闭环 |
| `implemented_commits` | 已落地提交 | TSD 使用；未落地时保留空列表 |
| `validated_by` | 验证记录 | TSD 使用，写命令或人工验证记录 |
| `related_docs` | 当前仓库文档路径 | 统一写 PRD、TSD、TVD、TED、VED 等 `docs/coding-plugins/...` 相对路径；工具按文件后缀自动推导类型 |
| `related_code` | 相关代码路径 | 写仓库内相对路径 |
| `external_references` | 跨仓库或绝对路径引用 | feature 文档中的本地引用由 preflight 默认检查；`--check-external-references` 保留为显式兼容命令 |

## 文档类型要求

| 文档 | 必备 metadata | 关系要求 |
| --- | --- | --- |
| README | `title`、`status`、`feature`、`updated`、`tags` | 作为人工总览和检索入口，不维护手写 `产物链路` 或 `文档链路`；轻量例外必须按 `Doc ID | 规格 ID | 证据` 限定到具体链路 |
| PRD | `title`、`type`、`status`、`feature`、`doc_id`、`created`、`updated`、`tags` | 对应下游文档存在时，用 `related_docs` 链接同一 `doc_id` 的 TSD、TVD、TED 和 VED，并可链接 `related_code` |
| TSD 技术方案文档 | `title`、`status`、`lifecycle_status`、`feature`、`doc_id`、`created`、`updated`、`implemented_commits`、`validated_by` | approved PRD 正式链路必备；用 `related_docs` 链接同一 `doc_id` 的 PRD、TVD、TED 和 VED |
| TVD 测试用例 | `title`、`status`、`feature`、`doc_id`、`created`、`updated` | 用 `related_docs` 链接同一 `doc_id` 下存在的 PRD、TSD、TED 和 VED |
| TED 任务执行文档 | `title`、`status`、`feature`、`doc_id`、`created`、`updated` | 用 `related_docs` 链接同一 `doc_id` 的 PRD、TSD、TVD 和 VED |
| VED 证据 | `title`、`status`、`feature`、`doc_id`、`created`、`updated` | 用 `related_docs` 链接同一 `doc_id` 的 PRD、TSD、TVD 和 TED |
| Archived evidence | active evidence 字段外加 `validation_mode`、`archive_of`、`archived_at` | `status: archived` 且 `validation_mode: historical` |

## 创建或更新流程

1. 用 `templates/document-metadata.md` 选择适合的 frontmatter 字段；如需调整字段、命名或关系规则，先更新 `src/lib/document-metadata.ts`，再同步模板和说明。
2. 保持机器 key 为英文；中文展示写入正文 `## 文档信息`，只写状态、Feature、Doc ID、文档类型、关系源和阅读重点，不写完整路径链路表。
3. 所有 `related_docs` 值使用当前仓库内 `docs/coding-plugins/...` 路径，默认只链接同一 `doc_id` 链路；跨链路依赖也写入 `related_docs`，并靠路径后缀保持类型语义。
4. README 只写人工摘要、标签和轻量例外追踪；不要维护索引型链路表。
5. 修改 PRD、TSD、TVD、TED 或 VED 后，按下方“同步更新机制”检查并更新相关下游文档。
6. 新增、移动、批准、废弃或拆分文档后运行：

```bash
npm run preflight -- --write-index
npm run preflight
```

7. 需要检查跨仓库路径时额外运行：

```bash
npm run preflight
```

## 同步更新机制

`src/lib/document-metadata.ts` 负责提供同步关系图，`src/cli/preflight.ts` 负责执行门禁。同步方向不是双向平均更新，而是从上游约束传递到下游产物：

```text
PRD -> TSD -> TVD -> TED -> VED
```

实际依赖规则：

| 文档变更 | 必须同步评审的下游文档 |
| --- | --- |
| PRD | TSD、TVD、TED、VED |
| TSD | TVD、TED、VED |
| TVD | TED、VED |
| TED | VED |
| VED | 不反向要求上游更新，但会影响索引更新时间 |

同步动作：

1. 先通过 `related_docs` 找到同 feature、同 `doc_id` 的相关文档。
2. 判断上游变更是否影响下游正文；影响时更新下游正文和 `updated`。
3. 如果确认不影响下游正文，也必须更新下游 `updated`，表示已完成同步评审。
4. 运行 `npm run preflight -- --write-index`。preflight 会拒绝 `updated` 早于上游文档的下游文档。

## 常见错误

| 错误 | 修正 |
| --- | --- |
| 先读正文再猜关系 | 先读 README 和目标文档 frontmatter，再按 `related_docs` 追链 |
| 把绝对路径写进 `related_docs` | 移到 `external_references` |
| README 维护手写文档链路表 | 删除手写链路，运行 `--write-index` 生成全局索引 |
| `feature` 与路径不一致 | 以路径 `features/<feature-name>` 为准修正 metadata |
| `doc_id` 与文件名前缀不一致 | 以文件名 `<doc-id>-XXX.md` 为准修正 metadata |
| 中文 `文档信息` 和 frontmatter 不一致 | 以 frontmatter 为准更新中文摘要 |
| 新增文档后忘记 INDEX | 运行 `npm run preflight -- --write-index` |
| 改了 PRD 但没有同步 TSD/TVD/TED/VED | 按同步更新机制评审下游文档，更新正文或至少更新 `updated` |

## 相关契约

- 仓库级职责边界：`docs/coding-plugins/document-contract.md`
- 总索引：`docs/coding-plugins/INDEX.md`
- 通用模板：`skills/document-metadata/templates/document-metadata.md`
- 可执行 metadata 规则：`src/lib/document-metadata.ts`
- 发布门禁：`src/cli/preflight.ts`
