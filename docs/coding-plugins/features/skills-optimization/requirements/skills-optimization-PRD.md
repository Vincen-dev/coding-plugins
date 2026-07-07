---
title: Skills 专项优化需求文档
type: maintenance
status: approved
feature: skills-optimization
doc_id: skills-optimization
created: 2026-07-07
updated: 2026-07-07
tags:
  - skills-optimization
  - skills
  - guards
related_code:
  - skills/
  - src/lib/workflow/
  - src/lib/git/
  - src/lib/release/
  - tests/ts/
  - todo.md
related_docs:
  - docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md
  - docs/coding-plugins/features/skills-optimization/test-cases/skills-optimization-TVD.md
  - docs/coding-plugins/features/skills-optimization/plans/skills-optimization-TED.md
  - docs/coding-plugins/features/skills-optimization/evidences/skills-optimization-VED.md
---

# Skills 专项优化需求文档

## 阅读摘要

- **本文结论:** Coding Plugins 需要把 skill 本体说明与机器门禁规则分层，降低 `SKILL.md` 重复承载 guard 逻辑导致的冲突、漂移和维护成本。
- **当前状态:** 已批准，已进入任务执行文档阶段。
- **先读重点:** 先看目标、非目标、需求总览，再重点阅读 `Skill 与 guard 职责边界（REQ-001）` 和 `边界自动化检查（REQ-003）`。
- **下游同步:** PRD 批准后创建同一 `doc_id` 的 TSD、TVD 和 TED，并回填 frontmatter 的 `related_docs`。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skills-optimization |
| Doc ID | skills-optimization |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

交付一套可维护的 skills 职责边界：`SKILL.md` 聚焦 agent 操作指导，机器门禁集中在 CLI guard、测试或共享规则模块，并通过迁移清单和自动化检查防止规则重复与漂移。

## 非目标

- NON-001：本阶段不重写所有 workflow guard、commit guard 或 release guard 的业务逻辑；已有 guard 行为保持兼容，只调整 skill 文本和边界检查契约。
- NON-002：本阶段不改变 PRD/TSD/TVD/TED/VED 正式链路的 DP 语义、执行顺序或状态机。
- NON-003：本阶段不处理 npm package allowlist、发布包瘦身或真实发布流程；正式发布优化属于独立需求。
- NON-004：本阶段不把中文模板、中文参考文档或中文 fixtures 全面英文迁移；国际化边界以 `skill-internationalization` 已批准链路为准。

## 背景

- 当前行为：多个 `SKILL.md` 同时描述操作步骤、硬门禁、CLI 命令、DP 要求和提交/发布规则；部分规则也存在于 `src/lib/workflow/`、`src/lib/git/`、`src/lib/release/` 和测试中。重复表达让 skill 文本变长，也让规则修改时容易出现 skill 与 guard 不一致。
- 目标用户或调用方：维护 Coding Plugins 的开发者、执行 skill 的 agent、以及依赖 CLI guard 的正式链路用户。
- 约束：优化后必须保持现有工作流行为、CLI 输出、测试入口和中文用户兼容区不降级；需求批准前不得进入 TSD 或实现。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | Skill 与 guard 职责边界 | 必须 | maintenance | skill 文本审查和边界规则检查 |
| REQ-002 | 现有 skills 迁移清单 | 必须 | maintenance | 迁移清单审查和覆盖率检查 |
| REQ-003 | 边界自动化检查 | 必须 | maintenance | source-scan 或 contract test |
| REQ-004 | 工作流行为兼容 | 必须 | maintenance | routing、productization 和 preflight 回归 |

## Skill 与 guard 职责边界（REQ-001）

### 用户或系统价值

维护者能清楚判断一条规则应该写在 skill、CLI guard、测试还是共享规则模块中；agent 读取 skill 时只获得执行所需的高信号操作指导，不被重复的机器门禁细节淹没。

### 需求描述

系统必须定义并执行 skill 本体与 guard 规则的职责边界。`SKILL.md` 应保留技能目标、触发条件、前置条件、执行步骤、输出要求、验证入口和必要参考；可由程序稳定判断的规则应沉到 CLI guard、测试或共享规则模块，并由 skill 通过命令或 guard 名称引用。

### 行为规则

- `SKILL.md` 可以说明“必须运行哪个 guard 或验证命令”，但不得重复展开 guard 内部的全部判定规则。
- DP、workflow state、commit author、release completion、sensitive file、artifact mode 这类机器可检查规则必须以 CLI guard、测试或共享模块为权威来源。
- 如果一条规则同时出现在 skill 和 guard 中，必须能证明 skill 只保留操作入口或摘要，guard 保留判定细节。
- Skill 文本不得因为抽离 guard 规则而丢失用户可执行步骤；agent 仍能按 skill 找到下一条命令和失败处理方式。

### 输入与输出

- 输入：`skills/*/SKILL.md`、supporting prompt、CLI guard、测试和共享规则模块。
- 输出：每类规则有清楚归属，skill 文本更短、更聚焦，guard 规则有单一权威位置。

### 关联契约

- API / SDK / CLI：涉及 `workflow-guard`、`commit-guard`、`release guard`、`scope-check`、`task status` 等命令的权威边界说明。
- Schema / 数据：不涉及新增数据 schema。
- 状态机 / 生命周期：不得改变 DP-0 到 DP-7、workflow state 和 execution guard 的既有语义。
- 维护 / 迁移 / 回归：抽离规则时必须保持现有 skill 可发现性和 CLI guard 行为兼容。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | `SKILL.md` 重复列出 guard 已经能判定的完整规则集合。 | 边界检查失败，要求改成引用 guard 或保留摘要。 | source-scan / 人工审查 |
| ERR-002 | 抽离规则后 skill 不再告诉 agent 下一条必要命令。 | 评审失败，要求补回操作入口。 | skill 行为审查 |

### 验收标准

- AC-001：职责边界清楚。
  - 前置条件：完成第一批 skill 边界梳理。
  - 操作：检查被修改的 `SKILL.md` 和对应 guard。
  - 期望结果：skill 保留操作指导，guard 保留机器判定细节，两者没有未解释的重复规则。

### 验证方式

- 验证类型：source-scan、人工审查和回归测试。
- 覆盖对象：`skills/*/SKILL.md`、`src/lib/workflow/`、`src/lib/git/`、`src/lib/release/`。
- 后续沉淀：TVD 需定义哪些规则算重复、哪些引用和摘要允许存在。

## 现有 skills 迁移清单（REQ-002）

### 用户或系统价值

维护者能用清单分批迁移 skills，而不是一次性重写全部技能；每个 skill 的规则归属、风险和验证方式都有可追踪记录。

### 需求描述

系统必须产出覆盖现有 skills 的职责粒度清单。清单至少要区分 agent 操作指导、机器可检查 guard、用户确认点、文档模板、中文兼容内容和支持脚本，并标出每个 skill 是否需要迁移、迁移优先级和验证命令。

### 行为规则

- 清单必须覆盖 `skills/*/SKILL.md`，不能只抽样列出高风险 skill。
- 每个 skill 至少标记一种主职责：routing、requirements、technical design、test design、planning、execution、verification、commit、review、debugging、skill authoring 或 finishing。
- 清单必须标出规则重复风险：无重复、轻度重复、需要迁移、需要新增 guard。
- 清单必须记录不迁移原因，例如该内容属于用户可读模板、中文兼容参考或无法自动判定的操作判断。

### 输入与输出

- 输入：当前 `skills/` 目录、CLI guard 列表、现有测试和任务清单。
- 输出：一个可维护的迁移清单，供 TSD/TVD/TED 分批设计和执行。

### 关联契约

- API / SDK / CLI：清单需要引用已有 CLI guard 名称，不新增命令契约。
- Schema / 数据：清单可以使用 Markdown 表格；字段名在 TSD 阶段确定。
- 状态机 / 生命周期：不改变正式链路状态。
- 维护 / 迁移 / 回归：清单必须支持增量迁移，避免一次性大改全部 skills。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-003 | 清单遗漏已有 `skills/*/SKILL.md`。 | 覆盖率检查失败。 | source-scan |
| ERR-004 | 清单把中文模板误判为需要英文化或 guard 抽离。 | 评审失败，要求按 i18n 兼容区修正分类。 | 人工审查 |

### 验收标准

- AC-002：迁移清单覆盖全部 skills。
  - 前置条件：读取当前 `skills/` 目录。
  - 操作：对比清单条目和实际 skill 目录。
  - 期望结果：每个 `skills/{skill-name}/SKILL.md` 都有职责分类、风险等级和下一步动作。

### 验证方式

- 验证类型：source-scan 和文档审查。
- 覆盖对象：全部 `skills/*/SKILL.md`。
- 后续沉淀：TSD 需确定清单文件位置和字段，TVD 需定义覆盖率断言。

## 边界自动化检查（REQ-003）

### 用户或系统价值

后续新增或修改 skill 时，自动化能及时发现 guard 规则重新写回 `SKILL.md`、清单遗漏 skill 或边界说明漂移，避免依赖人工记忆。

### 需求描述

系统必须提供一个可在 preflight 中执行或被 preflight 发现的边界检查。检查应覆盖 skill/guard 重复风险、迁移清单覆盖率和允许例外，输出能定位到具体文件与规则类型。

### 行为规则

- 检查必须能发现新增 `skills/{skill-name}/SKILL.md` 未加入迁移清单的情况。
- 检查必须能发现高风险 guard 关键词在 skill 中以完整规则形式重复出现的情况。
- 检查必须支持 allowlist，允许 skill 保留 guard 命令入口、短摘要和用户确认提示。
- 检查失败输出必须包含文件路径、规则类别和建议处理方式。

### 输入与输出

- 输入：`skills/`、迁移清单、guard 关键词或规则 catalog。
- 输出：通过或失败的结构化结果，并能接入现有 test/preflight。

### 关联契约

- API / SDK / CLI：可以是 `node --test` source-scan，也可以是现有 CLI 的新增子命令；具体由 TSD 决定。
- Schema / 数据：如果新增清单 schema，字段必须可稳定验证。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：检查不得误伤中文模板、中文参考、fixtures 或 prompt 中的合法示例。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-005 | 新增 skill 未加入迁移清单。 | 自动化检查失败并指出缺失条目。 | source-scan |
| ERR-006 | 检查把合法 guard 命令引用当作重复规则。 | 测试设计失败，要求调整 allowlist。 | RED/GREEN 测试 |

### 验收标准

- AC-003：边界检查可自动发现漂移。
  - 前置条件：存在迁移清单和至少一个被检查的 skill。
  - 操作：运行边界检查。
  - 期望结果：当前仓库通过；构造遗漏清单或重复规则 fixture 时检查失败。

### 验证方式

- 验证类型：source-scan、contract test。
- 覆盖对象：迁移清单、skill 文本、guard 关键词或规则 catalog。
- 后续沉淀：TVD 需包含正向样例、遗漏清单样例和误伤保护样例。

## 工作流行为兼容（REQ-004）

### 用户或系统价值

用户获得更清晰的 skills，但现有 Coding Plugins 工作流行为不变；正式链路、提交、发布、调试、评审和完成验证不会因为文案抽离而失去门禁。

### 需求描述

Skills 专项优化必须保持现有行为兼容。修改后的 skills 仍要能通过 routing、productization、commit、i18n、package 和 preflight 相关测试；如果某个 guard 行为需要改变，必须单独在 TSD 中说明兼容性和迁移影响。

### 行为规则

- `using-coding-plugins` 仍必须能路由到正式链路、TDD、debugging、review、verification、commit 和 finishing skills。
- `git-commit`、`verification-before-completion`、`writing-plans` 等高风险 skill 的 guard 入口不得被删除。
- 文案压缩不能降低 DP-0 到 DP-7、workflow-guard、commit-guard、release guard、scope-check 的强制性。
- 所有改动完成后必须运行 focused tests 和 `npm run preflight -- --write-index`。

### 输入与输出

- 输入：迁移后的 skills、guard、测试和文档索引。
- 输出：测试通过，用户可继续按既有 workflow 使用插件。

### 关联契约

- API / SDK / CLI：现有 CLI 命令、参数和输出语义保持兼容。
- Schema / 数据：不改变正式文档 frontmatter schema。
- 状态机 / 生命周期：DP 和 workflow state 语义保持兼容。
- 维护 / 迁移 / 回归：如果发现既有 skill 文案与 guard 行为冲突，必须以 guard/test 为权威，并在 VED 记录修复证据。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-007 | skill 文案优化后 routing 测试失败。 | 阻止完成，先修复 discoverability 或路由说明。 | `tests/ts/scenario-routing-contract.test.mjs` |
| ERR-008 | guard 入口被删除导致 productization 测试失败。 | 阻止完成，恢复 guard 入口或更新设计并重跑测试。 | `tests/ts/productization-cli.test.mjs` |

### 验收标准

- AC-004：工作流行为兼容。
  - 前置条件：完成 skill 边界迁移和检查。
  - 操作：运行 focused tests 和 preflight。
  - 期望结果：测试通过；失败时 VED 记录根因和修复。

### 验证方式

- 验证类型：回归测试和 preflight。
- 覆盖对象：routing、productization、commit、i18n、skill ownership、preflight。
- 后续沉淀：TVD 需列出必须运行的 focused tests，TED 需把验证命令绑定到任务。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | source-scan / 人工审查 | 检查 skill 文本与 guard 规则的职责边界。 | 计划中 |
| REQ-002 | source-scan / 文档审查 | 对比迁移清单与 `skills/*/SKILL.md`。 | 计划中 |
| REQ-003 | contract test / source-scan | 运行边界检查测试，覆盖遗漏清单和误伤保护。 | 计划中 |
| REQ-004 | 回归测试 / preflight | 运行 routing、productization、i18n 和 preflight。 | 计划中 |
