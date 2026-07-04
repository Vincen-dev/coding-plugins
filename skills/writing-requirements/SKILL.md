---
name: writing-requirements
description: Use when writing or updating Coding Plugins PRD requirement documents, including feature, API contract, schema, state-machine, acceptance, or maintenance requirements under docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md.
---

# 编写需求文档

## 总览

本技能负责把需求、契约、schema、状态机、验收标准或维护约束写成可追踪、可验证的 PRD 需求文档。`spec-driven-development` 负责判断完整文档链路；本技能负责真正编写 `requirements/<doc-id>-PRD.md`。

**核心原则：**需求文档只定义“要什么”和“如何验收”，不写技术方案、测试用例步骤或执行任务拆分。

**结构原则：**PRD 正文按需求点阅读。先写轻量 `## 需求总览` 表用于检索和 validator 提取稳定 Spec ID，再为每个需求点创建独立章节，标题格式固定为 `## 标题（REQ-001）`。不要使用 `## REQ-001：标题`，避免正文阅读被编号主导。

**可读性原则：**PRD 首先是需求交接材料，不是表格填空。表格只用于 `需求总览`、错误边界和追踪矩阵这类高密度索引；目标、非目标、背景、输入输出、验收标准和验证方式优先使用短段落或清单。

开始时声明：“我正在使用 writing-requirements 技能来编写需求文档。”

## 何时使用

使用本技能：

- 新需求、行为变更、用户流程或产品规则需要成文。
- API、SDK、CLI、协议或公共函数契约需要固定。
- 数据结构、配置、事件 payload 或状态机需要固定。
- 验收标准不清，需要先转成可测试条目。
- 无新增功能，但维护、迁移、升级、兼容、回归风险会影响外部行为或验证口径。

不使用本技能：

- 已经有已批准 PRD，且只需要 TSD 技术方案文档：使用 `writing-technicals`。
- 已经有 TSD 技术方案文档和 TVD，需要拆任务：使用 `writing-plans`。
- 只需要测试用例文档：使用 `writing-test-cases`。
- 只记录实际 RED/GREEN/REFACTOR：使用 `test-driven-development` 的 evidence。

## 场景到文档

| 场景 | 文档 | 模板 |
| --- | --- | --- |
| 所有新 PRD | `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md` | `templates/product-requirements-document.md` |
| 普通功能、用户流程、可见行为 | 同一个 PRD | 参考 `templates/feature-spec.md` 补齐需求点章节 |
| HTTP/RPC/API/SDK/CLI 契约 | 同一个 PRD | 参考 `templates/api-contract-spec.md` 补齐 API / SDK / CLI 契约章节 |
| 数据结构、配置、事件 payload | 同一个 PRD | 参考 `templates/schema-spec.md` 补齐 Schema / 数据契约章节 |
| 状态、工作流、生命周期 | 同一个 PRD | 参考 `templates/state-machine-spec.md` 补齐状态机 / 生命周期章节 |
| 验收标准不清 | 同一个 PRD | 参考 `templates/acceptance-criteria.md` 补齐验收标准章节 |
| 维护、重构、升级、迁移、回归风险 | 同一个 PRD | 参考 `templates/maintenance-spec.md` 补齐维护 / 迁移 / 回归约束章节 |

`product-requirements-document.md` 是默认骨架；不同场景模板只作为章节参考，不决定最终文件名。`feature` 表示模块目录，`doc_id` 表示该 feature 下的一条需求链路。默认 `doc_id = <feature-name>`；当一个 feature 模块下存在多个独立需求、流程、契约或维护主题时，为每条链路创建独立 `<doc-id>-PRD.md`，例如 `routing-login-PRD.md` 和 `routing-register-PRD.md`。横跨多个独立 feature 时，拆成多个 feature root，并用 `related_docs` 互链。

## 编写流程

1. 使用 `document-metadata` 读取 feature README 和相关文档 frontmatter。
2. 检索现有需求文档：`docs/coding-plugins/INDEX.md`、feature、tag、Spec ID、相关代码路径。
3. 选择一个或多个需求章节类型；不要为了形式创建不需要的章节。
4. 确定 `doc_id`：默认等于 `<feature-name>`；如果同一 feature 下已有其他 PRD，选择能表达本需求链路的稳定短名。
5. 用 `templates/product-requirements-document.md` 写入 `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`；场景模板只用于补齐对应章节。
6. 补齐 frontmatter：`title`、`type`、`status`、`feature`、`doc_id`、`created`、`updated`、`tags`、`related_code`、`related_docs`。
7. 写正文 `## 文档信息`，保持中文展示；机器 key 不翻译。
8. 拆分需求点：每个独立用户流程、契约、schema、状态机、维护约束或验收主题都必须进入 `## 需求总览`，并分配稳定 ID：`REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON`。
9. 为每个需求点创建独立章节，标题格式为 `## 标题（REQ-001）`，章节内按“用户或系统价值、需求描述、行为规则、输入与输出、关联契约、错误和边界、验收标准、验证方式”组织；不适用的小节可以写“不涉及”并说明原因。
10. 在 `## 追踪矩阵` 中只写验证方式种子和验证证据占位，不写执行任务或具体测试步骤；测试步骤属于 `writing-test-cases`，实施任务属于 `writing-plans`。
11. 运行规格校验：

```bash
coding-plugins validate-spec <SPEC_FILE_PATH>
```

12. 新增、移动、批准或废弃需求文档后运行：

```bash
npm run preflight -- --write-index
```

## 内容边界

| 应写入需求文档 | 不写入需求文档 |
| --- | --- |
| 目标、非目标、背景、用户或系统目标 | 技术选型和架构决策 |
| 功能需求、契约字段、schema、状态迁移 | 代码文件修改清单 |
| 错误和边界条件 | RED/GREEN/REFACTOR 实际证据 |
| 验收标准和验证方式类型 | 逐条测试用例步骤 |
| Traceability Matrix 种子 | 实现任务拆分、TED 任务编号 |

## 写作质量

- `## 阅读摘要` 必须用真实结论写清交付能力、状态、先读重点和下游同步，不得保留泛泛占位。
- 每个需求点章节先解释价值和行为，再列约束；不要让读者先读字段矩阵才能理解目标。
- 验收标准写成“场景、前置条件、操作、期望结果”的短块；表格只在同类条目很多且需要横向比较时使用。
- 不要在正文维护 PRD/TSD/TVD/TED/VED 路径清单；关联关系只写在 frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md`。

## 自审

- 每个 MUST 需求是否有稳定 Spec ID。
- 每个需求点是否有独立 `## 标题（REQ-001）` 章节。
- 每个 MUST 需求是否有验证方式。
- 是否没有把技术方案写进需求文档。
- 是否没有把测试用例步骤写进需求文档。
- 是否已链接相关需求、技术方案、计划、证据或代码路径。
- 是否运行 `validate-spec.ts` 并修复失败项。
