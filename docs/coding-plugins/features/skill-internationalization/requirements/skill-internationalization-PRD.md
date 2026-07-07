---
title: Skill 国际化优化需求文档
type: maintenance
status: approved
feature: skill-internationalization
doc_id: skill-internationalization
created: 2026-07-07
updated: 2026-07-07
tags:
  - skill-internationalization
  - i18n
  - skills
related_code:
  - skills/
  - hooks/session-start-codex
  - .codex-plugin/plugin.json
  - .claude-plugin/plugin.json
  - plugin.json
  - gemini-extension.json
  - GEMINI.md
  - README.md
  - INSTALL.md
  - tests/ts/
related_docs:
  - docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md
  - docs/coding-plugins/features/skill-internationalization/test-cases/skill-internationalization-TVD.md
  - docs/coding-plugins/features/skill-internationalization/plans/skill-internationalization-TED.md
  - docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md
---

# Skill 国际化优化需求文档

## 阅读摘要

- **本文结论:** Coding Plugins 需要以中文用户为主，同时把 agent-facing skill 执行面和跨平台分发面收敛为英文默认，降低非中文模型和平台的执行歧义。
- **当前状态:** 已批准，进入技术方案阶段。
- **先读重点:** 先看目标、非目标、需求总览和 `中文用户优先定位（REQ-001）`、`Agent-facing 英文执行面（REQ-002）`。
- **下游同步:** PRD 批准后创建同一 `doc_id` 的 TSD、TVD 和 TED，并回填 frontmatter 的 `related_docs`。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skill-internationalization |
| Doc ID | skill-internationalization |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

交付一套可执行的国际化需求边界：中文用户入口继续保持一等体验，agent-facing skill surface 使用英文默认，并由自动化检查阻止语言边界回退。

## 非目标

- NON-001：本阶段不把 `docs/coding-plugins/features`、PRD/TSD/TVD/TED/VED 模板、中文文档契约字段和中文验证器字段全面改成英文；这些内容服务中文用户和既有文档链路，后续如需迁移应单独立项。
- NON-002：本阶段不移除中文 intent routing 关键词，不降低中文用户以中文发起任务、提交确认和阅读工作流说明的能力。
- NON-003：本阶段不做发布包瘦身和 npm allowlist 重构；发布包洁净度属于独立正式发布优化需求。

## 背景

- 当前行为：`skills/*/SKILL.md`、skill prompt、`agents/openai.yaml`、Codex session-start hook 和部分平台 manifest 以中文为主；README/INSTALL 也以中文用户为主。非中文 agent 或平台消费这些执行材料时，可能只拿到中文规则。
- 目标用户或调用方：中文开发者是主要用户；Codex、Claude Code、Gemini CLI、本地 skills 客户端和跨平台 agent 是直接消费 skill surface 的调用方。
- 约束：国际化不能牺牲中文用户入口；不能破坏现有 PRD/TSD/TVD/TED/VED 文档契约、中文 validator、fixture 和中文 workflow routing；需求批准前不得进入实现。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | 中文用户优先定位 | 必须 | maintenance | README/INSTALL/manifest/hook 文本审查和 source-scan |
| REQ-002 | Agent-facing 英文执行面 | 必须 | maintenance | 自动化语言边界扫描和 skill 文件抽样审查 |
| REQ-003 | 跨平台分发文案一致性 | 必须 | maintenance | manifest、GEMINI、hook 和 package metadata 检查 |
| REQ-004 | 语言边界自动化门禁 | 必须 | maintenance | `node --test` 增加 i18n surface 测试并接入 preflight |
| REQ-005 | 中文工作流契约保持兼容 | 必须 | maintenance | validator、routing 和 fixture 相关测试保持通过 |

## 中文用户优先定位（REQ-001）

### 用户或系统价值

中文开发者继续把 Coding Plugins 当作中文工作流插件使用，不因为 skill 英文化而失去中文入口、中文示例、中文安装说明和中文交互预期。

### 需求描述

产品定位必须明确为中文用户优先。根 README、INSTALL、中文工作流说明、中文默认示例和中文用户提示必须继续服务中文用户；英文内容用于提升 agent 执行稳定性和跨平台分发，不把产品整体改成英文优先。

### 行为规则

- 当用户用中文提问、确认、提交或要求继续时，插件工作流仍应以中文回复和中文使用说明为默认体验。
- README/INSTALL 必须保留中文用户可直接理解的安装、使用、验证和发布说明；如新增英文 README，也必须提供清晰中文入口。
- 对外文案可以说明 agent-facing skill 使用英文默认，但不得暗示中文用户不再是主要用户。

### 输入与输出

- 输入：中文用户阅读 README/INSTALL、触发 SessionStart hook、使用中文 intent 请求任务。
- 输出：用户仍看到中文入口、中文示例和中文说明；agent 执行材料可以是英文，但必须指示按用户语言回复。

### 关联契约

- API / SDK / CLI：不涉及。
- Schema / 数据：manifest、hook 和 skill metadata 的语言字段与描述文本需要保持定位一致。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：英文化不得删除中文入口、中文示例和中文 intent 支持。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 英文化改动移除了 README/INSTALL 中的中文用户入口。 | 验证失败，要求恢复中文入口或迁移到明确的中文本地化文档。 | source-scan / 人工审查 |

### 验收标准

- AC-001：中文用户入口保留。
  - 前置条件：完成国际化改动。
  - 操作：检查 README、INSTALL、Codex hook 或中文本地化入口。
  - 期望结果：中文用户能从根入口找到中文安装、使用和工作流说明。

### 验证方式

- 验证类型：source-scan 和人工审查。
- 覆盖对象：README、INSTALL、hook、manifest 和中文入口说明。
- 后续沉淀：具体测试用例写入 TVD，执行任务写入 TED，实际证据写入 VED。

## Agent-facing 英文执行面（REQ-002）

### 用户或系统价值

非中文 agent 和跨平台 skills 客户端能稳定理解插件规则，减少因为执行材料是中文而产生的误读、跳步或门禁遗漏。

### 需求描述

面向模型执行的 skill surface 必须以英文为默认语言。该 surface 包括 `skills/*/SKILL.md`、skill supporting prompt、`skills/*/agents/openai.yaml` 中的 display/description，以及直接给 agent 注入执行约束的平台入口。

### 行为规则

- `SKILL.md` 的 frontmatter description、When to Use、Hard Gates、Process、Output Shape、Common Mistakes 和 Completion Criteria 等执行规则必须使用英文。
- Prompt 模板必须使用英文表达评审、实现、上下文边界和输出格式要求。
- `agents/openai.yaml` 的 display 和 short description 必须使用英文或清楚的英文主文案。
- 中文可以作为用户输入示例、中文文档标题示例或专门标记的 localization 示例出现，但不得承载未翻译的执行门禁。

### 输入与输出

- 输入：agent 读取 skill、prompt 或 agent metadata。
- 输出：agent 看到英文执行规则，并能按用户语言输出。

### 关联契约

- API / SDK / CLI：不涉及。
- Schema / 数据：`SKILL.md` frontmatter 和 `agents/openai.yaml` 是分发契约的一部分。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：保持现有 skill 触发条件和门禁语义不变，只迁移语言表达。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-002 | 英文 skill 中残留中文执行门禁、流程步骤或错误处理规则。 | 语言边界测试失败，并指出文件路径。 | 自动化语言扫描 |

### 验收标准

- AC-002：默认 skill 执行面为英文。
  - 前置条件：完成 skill 和 prompt 翻译。
  - 操作：扫描 agent-facing 文件。
  - 期望结果：未授权中文残留为零，允许的中文样例均在 allowlist 中。

### 验证方式

- 验证类型：source-scan、抽样人工审查。
- 覆盖对象：`skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml`。
- 后续沉淀：TVD 需列出扫描范围和 allowlist 规则。

## 跨平台分发文案一致性（REQ-003）

### 用户或系统价值

不同平台看到的插件定位一致：这是以中文用户为主要服务对象、但 agent-facing 执行材料采用英文的编码工作流插件。

### 需求描述

Codex、Claude Code、Gemini CLI、本地 skills 客户端和 package metadata 的对外文案必须使用一致的语言策略：分发文案默认英文，中文用户入口清晰保留。

### 行为规则

- `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`plugin.json`、`gemini-extension.json` 和 `package.json` 的描述必须避免互相矛盾。
- `hooks/session-start-codex` 必须告诉 agent 使用英文 skill 执行规则，同时按用户语言回复，并保留中文用户为主的定位。
- `GEMINI.md` 必须与主 skill surface 的语言策略一致，不继续引用过时的执行文档缩写或中文-only 表述。

### 输入与输出

- 输入：平台读取 manifest、hook 或 context file。
- 输出：平台显示一致的插件定位；agent 得到一致的执行入口。

### 关联契约

- API / SDK / CLI：不涉及。
- Schema / 数据：平台 manifest JSON 字段和 hook 输出文本必须保持可解析。
- 状态机 / 生命周期：SessionStart 注入属于启动生命周期。
- 维护 / 迁移 / 回归：不得破坏现有 manifest version、skills path、hook JSON 输出和 package metadata。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-003 | 某个平台 manifest 声称插件是中文-only，而另一个平台声称英文-only。 | 验证失败，要求统一为中文用户优先、agent-facing 英文执行面。 | manifest 文本检查 |

### 验收标准

- AC-003：跨平台文案一致。
  - 前置条件：完成 manifest、hook 和 context file 更新。
  - 操作：检查所有平台入口描述。
  - 期望结果：描述不冲突，且不破坏 manifest-check。

### 验证方式

- 验证类型：manifest-check、source-scan。
- 覆盖对象：平台 manifest、hook、GEMINI 和 package metadata。
- 后续沉淀：TVD 需明确每个平台入口的断言。

## 语言边界自动化门禁（REQ-004）

### 用户或系统价值

国际化不是一次性翻译，而是可持续维护的发布门禁。后续新增 skill 或 prompt 时，自动化能阻止语言策略漂移。

### 需求描述

仓库必须增加自动化检查，区分禁止中文残留的 agent-facing surface 和允许中文存在的中文用户文档、fixture、validator、routing keyword。

### 行为规则

- 检查必须覆盖 agent-facing surface：`skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml`、平台 manifest、hook 和 context file。
- 检查必须提供 allowlist，允许中文出现在 README/INSTALL、`docs/`、`tests/fixtures/`、中文 schema/validator 字段、中文 routing keyword 和明确标记的中文示例中。
- 检查必须进入 preflight 或被 preflight 间接发现，不能只靠手工审查。

### 输入与输出

- 输入：仓库文件树和 allowlist。
- 输出：测试结果列出违规路径；通过时证明 agent-facing surface 的语言边界没有漂移。

### 关联契约

- API / SDK / CLI：不涉及。
- Schema / 数据：allowlist 是测试契约，应在测试文件中可读。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：后续新增 skill、prompt 或平台入口必须受同一测试保护。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-004 | 测试把 README、中文 docs 或中文 routing keyword 当作违规。 | 测试设计失败，必须调整 allowlist；中文用户入口不能被误删。 | RED/GREEN 测试审查 |

### 验收标准

- AC-004：语言边界有自动化门禁。
  - 前置条件：完成测试实现。
  - 操作：运行相关 `node --test` 和 `npm run preflight`。
  - 期望结果：测试能在中文执行规则残留时失败，并在允许范围内放行中文用户内容。

### 验证方式

- 验证类型：source-scan 自动化测试。
- 覆盖对象：agent-facing surface 和 allowlist。
- 后续沉淀：TVD 写明 RED 样例和 GREEN 覆盖。

## 中文工作流契约保持兼容（REQ-005）

### 用户或系统价值

国际化落地后，既有中文 SDD/TDD 文档链路、validator、fixture 和中文用户 intent 仍能工作，避免为了翻译破坏核心工作流。

### 需求描述

实现必须保持中文文档契约和中文输入支持。PRD/TSD/TVD/TED/VED 标题、TDD 证据字段、中文 traceability 表头、中文 workflow-mode 关键词和现有 fixtures 在本阶段不迁移为英文-only。

### 行为规则

- `validate-spec`、`validate-technicals`、`validate-tdd-evidence` 必须继续接受现有中文文档字段。
- `workflow-mode` 必须继续识别中文 intent，例如“开始实现”“分析”“发布”“提交”。
- 现有 `docs/coding-plugins/features` 和 `tests/fixtures` 不因 agent-facing 英文化被批量翻译。
- 若英文 skill 引用中文文档字段，应说明这是 repository document contract，而不是未翻译执行规则。

### 输入与输出

- 输入：中文 PRD/TSD/TVD/TED/VED、中文用户 intent、现有 fixtures。
- 输出：校验和 routing 结果保持兼容。

### 关联契约

- API / SDK / CLI：CLI 的 workflow mode、validate 和 preflight 输出保持可用。
- Schema / 数据：中文文档字段是当前文档契约的一部分。
- 状态机 / 生命周期：SDD 文档状态和 DP 门禁不因语言迁移改变。
- 维护 / 迁移 / 回归：现有测试和 preflight 是回归验证基础。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-005 | 国际化改动导致中文 PRD 或 TDD 证据校验失败。 | 回归失败，必须恢复中文文档契约兼容。 | validator / preflight |

### 验收标准

- AC-005：中文工作流契约保持可用。
  - 前置条件：完成国际化改动。
  - 操作：运行现有 document、routing、preflight 相关测试。
  - 期望结果：中文文档链路和中文 intent 支持不回退。

### 验证方式

- 验证类型：回归测试、preflight。
- 覆盖对象：validator、routing、fixtures 和现有 feature docs。
- 后续沉淀：VED 记录最终验证命令和任何已知既有失败。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | source-scan / 人工审查 | 检查 README、INSTALL、hook、manifest 中的中文用户入口和定位说明。 | 计划中 |
| REQ-002 | source-scan / 人工审查 | 新增 i18n surface 测试，扫描 skill、prompt 和 agent metadata。 | 计划中 |
| REQ-003 | manifest-check / source-scan | 检查 `.codex-plugin`、`.claude-plugin`、`plugin.json`、`gemini-extension.json`、`GEMINI.md`、hook 和 package metadata。 | 计划中 |
| REQ-004 | 自动化测试 / preflight | 新增语言边界测试，并确认 preflight 覆盖或执行该测试。 | 计划中 |
| REQ-005 | 回归测试 / preflight | 运行 document、routing、validator 和 fixture 相关测试，确认中文文档契约保持兼容。 | 计划中 |
