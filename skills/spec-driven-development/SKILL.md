---
name: spec-driven-development
description: 新需求、行为变更、接口契约、schema、状态机或验收标准尚未明确，且准备进入实现计划前使用。
---

# 规格驱动开发（SDD）

## 总览

先确定 feature 要沉淀哪些落地文档，再按顺序编排需求文档、技术方案、测试用例、实现计划和证据。

**核心原则：**`spec-driven-development` 是 SDD 文档链路编排入口，不直接承接所有正文写作；需求正文交给 `writing-requirements`，技术方案交给 `writing-technical-design`，测试用例交给 `writing-test-cases`，最后才进入 `writing-plans`。

## 硬性门禁

- 不得写代码、搭脚手架或调用实现技能。
- 不得跳过需求文档直接写 technical、test cases 或 plan。
- 每个 MUST/SHOULD 需求必须在 `writing-requirements` 产物中有稳定 Spec ID。
- 每个 MUST 需求必须能映射到测试用例、契约校验或人工验收证据。
- 外部契约必须在需求文档中包含示例：请求/响应、schema 样例、状态迁移或错误样例。
- 需求变更必须先改 requirement spec，再改 technical/test-cases/plan，最后再改实现。
- 用户确认需求文档前，不得进入 `writing-technical-design`。

## 适用范围

使用本技能：

- 新功能、行为变更、产品方向不清。
- API、SDK、协议、schema、状态机或跨团队接口。
- 用户故事、验收标准、错误语义或兼容性未明确。
- 现有需求只有自然语言描述，还不能直接写计划。
- 没有新功能需求，但维护、重构、依赖升级、迁移或回归修复会影响外部行为、兼容性、风险边界或验证口径。

不使用本技能：

- 已有批准过的需求文档：直接用 `writing-technical-design`。
- 已有批准过的需求文档和技术方案：直接用 `writing-test-cases`。
- 已有批准过的需求文档、技术方案和测试用例：直接用 `writing-plans`。
- 已有清晰 bug 复现：用 `systematic-debugging`，需要修复时转 `test-driven-development`。
- 用户明确只要解释、搜索或代码审查。

## 流程

1. **探索上下文**：读相关代码、文档、最近变更和现有约定。
2. **设计文档链路**：确认本 feature 需要沉淀哪些文档：README、requirements、technical、test-cases、plan、evidence。
3. **澄清缺口**：一次只问一个关键问题；优先问会影响契约、边界或验收的问题。
4. **检索既有文档**：先查 `docs/coding-plugins/INDEX.md`，再用 `rg` 查 feature、tag、Spec ID 和相关代码路径；能更新既有需求文档时不要新建。
5. **先读 metadata**：涉及 Coding Plugins 文档关系时先使用 `document-metadata`；读取目标 feature README 和相关 spec/technical/plan/evidence 的 frontmatter；关联关系以 `related_*`、README `tags` 和 `docs/coding-plugins/document-contract.md` 为准。
6. **编写需求文档**：调用 `writing-requirements`，按场景输出 `docs/coding-plugins/features/<feature-name>/requirements/<spec-kind>.md`。
7. **需求校验和确认**：运行 `validate_spec.py`，按 `references/spec-review-checklist.md` 自审，并等待用户确认。
8. **编写技术方案**：需求确认后调用 `writing-technical-design`，输出 `technicals/<feature-name>-Technical-Design.md`。
9. **编写测试用例**：technical 确认后调用 `writing-test-cases`，输出 `test-cases/<feature-name>-Test-Cases.md`。
10. **维护索引**：新增、移动、批准、废弃或拆分文档时，运行 `python3 scripts/preflight.py --write-index` 生成 `docs/coding-plugins/INDEX.md`。
11. **过渡计划**：需求、技术方案和测试用例都确认后，调用 `writing-plans`。

## 落地文档链路

| 文档 | 负责 skill | 默认路径 | 职责 |
| --- | --- | --- | --- |
| Feature README | `document-metadata` | `docs/coding-plugins/features/<feature-name>/README.md` | 人工总览、tags、轻量例外 |
| 需求文档 | `writing-requirements` | `docs/coding-plugins/features/<feature-name>/requirements/<spec-kind>.md` | 需求、契约、验收、Spec ID |
| 技术方案设计 | `writing-technical-design` | `docs/coding-plugins/features/<feature-name>/technicals/<feature-name>-Technical-Design.md` | 架构、关键决策、技术落点 |
| 测试用例文档 | `writing-test-cases` | `docs/coding-plugins/features/<feature-name>/test-cases/<feature-name>-Test-Cases.md` | Spec ID 到测试用例、断言、数据 |
| 实现计划 | `writing-plans` | `docs/coding-plugins/features/<feature-name>/plans/<feature-name>-Implementation-Plan.md` | 任务拆分、命令、执行顺序 |
| TDD 证据 | `test-driven-development` | `docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TDD-Evidence.md` | 实际 RED/GREEN/REFACTOR 证据 |
| 全局索引 | `document-metadata` / preflight | `docs/coding-plugins/INDEX.md` | 生成式检索视图 |

## 需求文档类型路由

| 情况 | 必读文件 |
| --- | --- |
| 普通功能或用户流程 | `skills/writing-requirements/templates/feature-spec.md` |
| HTTP/RPC/API/SDK 契约 | `skills/writing-requirements/templates/api-contract-spec.md`, `references/api-contract-guidelines.md` |
| 数据结构、配置、事件 payload | `skills/writing-requirements/templates/schema-spec.md`, `references/schema-guidelines.md` |
| 状态、工作流、生命周期 | `skills/writing-requirements/templates/state-machine-spec.md`, `references/state-machine-guidelines.md` |
| 验收标准不清 | `skills/writing-requirements/templates/acceptance-criteria.md`, `references/acceptance-criteria-guidelines.md` |
| 无新增需求的维护、重构、升级、迁移、回归风险 | `skills/writing-requirements/templates/maintenance-spec.md` |

只读取当前任务需要的模板和参考，不要一次加载所有支持文件。

## 路径和检索

默认需求文档路径：

```text
docs/coding-plugins/features/<feature-name>/requirements/<spec-kind>.md
```

示例：

```text
docs/coding-plugins/features/auth-login/requirements/auth-login-PRD.md
docs/coding-plugins/features/billing-invoice/requirements/api-contract.md
docs/coding-plugins/features/search-indexing/requirements/schema.md
```

路径只表达 feature 归属和文档类型，不表达时间，也不再拆成 `<area>/<capability>`。时间、状态、标签、相关代码和相关需求文档写入文档 metadata，并同步到 `docs/coding-plugins/INDEX.md`。metadata key 保持英文，中文展示写入正文 `文档信息` 表。读取或更新文档时先使用 `document-metadata` 确认 frontmatter 和关系字段，再读正文；正文中的追踪矩阵是正式内容，生成式索引关系以 metadata 和 `INDEX.md` 为准。需求文档正文由 `writing-requirements` 负责。

`spec-kind` 使用：

| 规格类型 | 文件名 |
| --- | --- |
| Feature spec | `feature.md` |
| API contract spec | `api-contract.md` |
| Schema spec | `schema.md` |
| State machine spec | `state-machine.md` |
| Acceptance criteria | `acceptance.md` |
| Maintenance spec | `maintenance.md` |

创建新需求文档前必须先检索：

```bash
rg -n "<feature>|<tag>|<Spec ID>|<code path>" docs/coding-plugins/features
```

如果同一 `features/<feature-name>/requirements/<spec-kind>.md` 已存在，优先更新它；如果新需求横跨多个能力，拆成多个 feature 需求文档，并在 `related_specs` 和 `INDEX.md` 中互链。

## 无新增需求时

不要为了形式创建产品功能规格。没有新需求时，只有这些情况需要规格：

- **维护规格**：重构、依赖升级、性能/稳定性改造、安全修复会影响既有行为或验证口径。
- **基线规格**：执行大改前，需要先冻结当前外部契约、schema、状态语义或关键用户流程。
- **回归规格**：bug 已有根因或复现路径，需要把“错误条件 -> 期望行为 -> 回归测试”固定下来。
- **迁移规格**：数据、配置、接口版本或依赖升级需要兼容、回滚或灰度规则。
- **可观测规格**：日志、指标、告警、审计事件是验收或排障的一部分。

如果只是阅读代码、解释现状、运行验证、普通代码审查或无行为影响的小整理，不创建新规格，直接使用对应技能。

## 质量标准

规格必须回答：

- 用户或系统目标是什么？
- 明确不做什么？
- 输入、输出、状态、错误和边界是什么？
- 成功路径、失败路径、边界条件是什么？
- 哪些内容是 MUST，哪些只是 SHOULD/MAY？
- 如何验证每条 MUST 规格？

## 自动校验

写完规格后运行：

```bash
python3 skills/spec-driven-development/scripts/validate_spec.py <SPEC_FILE_PATH>
```

可一次校验多个规格，并为 CI 或编辑器集成输出 JSON：

```bash
python3 skills/spec-driven-development/scripts/validate_spec.py --format json <SPEC_FILE_PATH> [<OTHER_SPEC_FILE>...]
```

校验器支持中文或英文表头，并会阻止：

- TODO/TBD/占位符残留。
- 缺少 Spec ID。
- 重复定义同一个 Spec ID。
- MUST 行没有验证方式。
- Traceability Matrix 未覆盖 MUST 规格。
- 追踪行没有测试命令、契约校验或人工验收证据。
- Traceability Matrix 的 Status 非法。

校验器会警告 SHOULD 未进入 Traceability Matrix 的情况。`--strict` 会把 SHOULD 追踪缺口和“适当、友好、常见情况”等模糊词 warning 提升为错误。脚本通过不代表规格已经可批准，仍必须按 `references/spec-review-checklist.md` 自审。

## 交接给后续文档

交接时说明：

```text
需求文档已保存到 <SPEC_FILE_PATH>，并已通过自审。请确认是否进入 writing-technical-design。
```

确认后，先进入 `writing-technical-design`，再进入 `writing-test-cases`，最后由 `writing-plans` 把 Spec ID 映射到测试和任务。

## 常见错误

- 写成方案散文，没有 Spec ID。
- 只写 happy path，没有错误和边界。
- 用“适当”“友好”“尽快”“支持常见情况”等无法验证的词。
- 规格中出现实现细节，却没有定义外部契约。
- 没有非目标，导致实现阶段 scope creep。
- 用户未确认规格就开始写计划或代码。
