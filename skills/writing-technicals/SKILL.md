---
name: writing-technicals
description: 已有批准规格，需要在 TED 任务执行文档前创建或更新技术方案、架构方案、ADR 或 implementation design 时使用。
---

# 编写技术方案文档

## 总览

`writing-technicals` 把已批准规格转成一份稳定的技术方案文档。技术方案文档同时回答“为什么这样设计”和“如何落地到模块、接口、数据和测试交接”，但不写 TED 任务步骤，也不记录实际执行证据。

核心原则：默认只生成一份 `<doc-id>-TSD.md` 技术方案文档。需要独立实现拆解时，也优先在 TSD 的“实现方案”章节写清楚，而不是新建第二份文档。

技术方案不得补写、扩展或重定义需求。如果写技术方案时发现需求、验收标准、外部行为、错误边界或兼容要求不清楚，立即停止，回到 `spec-driven-development` 更新 spec、重新校验并取得确认，然后再继续。

技术方案文档首先是工程交接材料，不是表格填空。读者应能在 60 秒内从阅读摘要、方案摘要、规格映射、关键决策和实现方案判断：这次改什么、不改什么、为什么这么落地、风险在哪里、下一步测试怎么接。

## 何时使用

使用本技能：

- 已有批准规格，准备进入 TVD 测试用例和 TED 任务执行文档前。
- 用户要求技术方案、技术设计、架构方案、ADR 或 implementation design。
- 方案会影响多个文件、接口、schema、状态机、兼容性或测试策略。
- 需要给后续测试设计、计划、子代理或评审者一个稳定设计来源。

不使用本技能：

- 用户只要求解释、状态查询或代码审查。
- 极小变更已经有明确实现路径，可以在计划中写 1 到 3 条 inline design note。
- 还没有批准规格；先使用 `spec-driven-development`。

## 默认路径

技术方案文档默认保存到：

```text
docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
```

`<feature-name>` 表示 feature 模块目录，`<doc-id>` 必须和 PRD、TVD、TED、VED 文件名前缀一致。

同时维护：

```text
docs/coding-plugins/INDEX.md
```

## 内容边界

| 文档 | 负责 | 不负责 |
| --- | --- | --- |
| 规格 | 需求、契约、验收标准、错误边界、Spec ID | 具体实现方案 |
| 技术方案文档 TSD | 架构方案、关键决策、影响组件、实现方案、数据流、接口落地、兼容策略、测试策略和风险缓解 | 逐步执行清单、实际测试输出、需求重定义 |
| 测试用例 | Spec ID 到测试用例、断言、测试数据和测试层级 | 技术选型和实现任务 |
| TED 任务执行文档 | 任务拆分、文件修改步骤、RED/GREEN 命令、Spec ID 到测试和任务的追踪 | 重复完整技术方案 |
| 证据 | 实际 RED/GREEN/REFACTOR 和最终验证证据 | 设计讨论 |
| INDEX/metadata | 关联文档、标签、状态、生命周期和检索路径 | 需求、方案或任务正文 |

## 必须覆盖

- **阅读摘要**：用真实结论写清最终方案、当前状态、先读重点和下游同步；不得保留模板占位、泛泛说明或“见下文”。
- **方案摘要**：2 到 5 句话说明整体方案、边界、不做什么、主要风险或验证方式。
- **规格缺口审查**：确认是否存在未覆盖需求、验收标准不清或新增外部行为；有缺口必须先回到 spec。
- **生命周期 metadata**：先使用 `document-metadata` 确认文档关系；frontmatter 必须包含 `lifecycle_status`、`implemented_commits` 和 `validated_by`；生命周期值只允许 `draft`、`approved`、`implemented`、`stale`、`superseded`。
- **规格到方案映射**：每个 MUST Spec ID 对应规格摘要、具体技术落点、`TD-xxx` 关键决策 ID、影响文件或符号、验证命令和证据目标。
- **无需技术方案的规格**：只有当某个 MUST Spec ID 确实不需要技术方案时才填写豁免原因。
- **关键决策**：每条关键决策必须有 `TD-xxx` ID、原因和代价；映射表中的关键决策 ID 必须能在这里找到。
- **实现方案**：模块、接口、数据结构、状态迁移、配置、兼容或无代码边界如何落地。
- **影响组件**：模块、文件、服务或数据结构怎么变。
- **数据流 / 控制流**：核心数据流或控制流。
- **接口和契约**：内部接口、外部 API、schema、状态机如何落地。
- **迁移 / 兼容性**：迁移、兼容、回滚、灰度。
- **测试策略**：Spec ID 对应的测试层级、RED/GREEN 命令和 TDD 证据记录方式。
- **风险和缓解**：风险和缓解方案。

如果某项不适用，写 `不适用` 并说明原因。不要留空。

## 可读性质量门禁

以下内容一律不允许进入真实技术方案：

- 模板占位：`<...>`、`YYYY-MM-DD`、`<feature-name>`、`<doc-id>` 或同类未替换内容。
- 空泛映射：`见本设计章节`、`按 technical 落地`、`后续处理`、`相关模块` 这类无法定位到文件、符号、命令或证据的表述。
- 章节空转：只有标题，没有具体结论、边界、取舍或验证方式。
- 需求偷渡：未引用 Spec ID 或未标注“设计约束”的“必须/不得/禁止/MUST/SHOULD”。
- 实现方案缺位：设计写了决策，但没有说明模块、接口、数据、迁移、测试交接或 no_code 边界如何落地。

写作要求：

- TSD 模板正文默认使用短段落和清单；表格只用于高密度矩阵，例如 `规格到方案映射` 和 `关键决策`。
- 每个表格单元都必须能独立回答一个工程问题；不能用“同上”“见下文”代替。
- 每个技术落点优先写成 `<path>::<symbol>`；没有符号时写到具体文件、模块或配置项。
- `不适用` 必须解释为什么不适用，以及什么条件会让它变为适用。
- 风险必须能对应缓解或回滚动作；不要写“风险较低”作为缓解。
- 正文不得维护 PRD/TVD/TED/VED 的路径清单；关联关系只写在 frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md`。
- 不要为了 no_code、轻量配置或单点改动新建第二份技术文档。

## 流程

1. 读取批准规格和相关现有代码；先使用 `document-metadata` 读取目标 feature README 和相关文档 frontmatter，再读正文。
2. 做规格缺口审查：逐项确认未覆盖需求、验收标准不清、外部行为新增、错误边界和兼容要求。
3. 如果发现缺口，不要在 technical 中顺手补需求；回到 `spec-driven-development` 更新 spec、重新运行规格校验并等待用户确认。
4. 确认 feature，并检查是否已有 TSD。
5. 创建或更新 `technicals/<doc-id>-TSD.md`，正文标题默认使用中文，并补齐 `related_docs`；关联关系以 frontmatter 为机器源。
6. 在 TSD 内写清实现方案、测试交接和风险回滚；不要把实现拆解转移到第二份文档。
7. 在规格 metadata 或正文中引用 TSD 路径；metadata key 保持英文，正文使用 `## 文档信息` 展示中文摘要。不要在 README 正文增加手写 `产物链路` 或 `文档链路`，完整链路由 `docs/coding-plugins/INDEX.md` 生成。
8. 更新 `docs/coding-plugins/INDEX.md`。
9. 运行 `coding-plugins validate-technicals <technical-path>` 做 TSD 单文档校验；发布前和 preflight 使用 strict 质量门禁。
10. 运行 `npm run preflight` 或至少运行相关 preflight 单测。
11. 交接给 `writing-test-cases` 编写 TVD，再交接给 `writing-plans` 编写 TED；计划必须写技术方案来源和测试用例来源。

## 模板

优先使用：

```text
skills/writing-technicals/templates/technical-design-document.md
```

真实文档中必须替换所有占位符。技术方案可以引用 Mermaid，但不要用图替代文字约束。

## 自审

- 是否每个 MUST Spec ID 都在设计中有落地点。
- 是否每个 MUST Spec ID 都出现在 `## 规格到方案映射` 或 `## 无需技术方案的规格` 中。
- 映射表是否使用完整 7 列：`规格 ID`、`规格摘要`、`技术落点`、`关键决策 ID`、`影响文件/符号`、`验证命令`、`证据`。
- 映射表中的 `关键决策 ID` 是否都能在 `## 关键决策` 表中找到。
- `## 规格到方案映射` 是否避免“见本方案章节”“按本 technical 落地”等泛化映射。
- 是否完成 `## 规格缺口审查`，且没有未处理、待处理或需澄清的缺口。
- 是否没有在 technical 中新增需求、验收标准或外部行为；如有，是否已回写 spec。
- 是否没有隐藏需求：出现必须、不得、禁止、MUST、SHOULD 类约束时，要么引用 Spec ID，要么明确标注“设计约束”。
- 是否维护 `lifecycle_status`、`implemented_commits` 和 `validated_by`。
- related spec 的 `updated` 是否晚于 technical；若晚于，先更新 technical 或标记 stale。
- 是否把关键决策、代价和风险写清楚。
- 是否明确受影响文件、模块、接口、数据结构或 no_code 边界。
- 是否说明兼容、迁移或为什么不适用。
- 是否说明测试策略和 TDD 证据目标。
- 是否没有任务清单膨胀；任务拆分留给 `writing-plans`。
- 是否没有保留 `<...>`、`YYYY-MM-DD` 或任何模板占位。
- 是否所有 `不适用` 都说明原因，而不是逃避设计。
- 是否阅读摘要在不读全文时也能说明最终方案、边界和下游影响。
- 是否避免表格滥用；除规格映射、关键决策等矩阵外，优先使用段落和清单。
- 是否没有在正文重复维护下游文档路径；文档关系以 metadata 和 INDEX 为准。
- 是否同步 `docs/coding-plugins/INDEX.md`。
- 是否运行 technical validator；发布前使用 `--strict`，确保泛化映射和 stale technical 会失败。

## 交接

完成后说明：

```text
技术方案已保存到 docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md。
下一步使用 writing-test-cases 创建 TVD，再使用 writing-plans 创建 TED，并在计划中引用技术方案来源和测试用例来源。
```
