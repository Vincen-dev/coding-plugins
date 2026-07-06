---
title: Skill 国际化优化测试用例
status: approved
feature: skill-internationalization
doc_id: skill-internationalization
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md
  - docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md
  - docs/coding-plugins/features/skill-internationalization/plans/skill-internationalization-TED.md
  - docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md
---

# Skill 国际化优化测试用例

## 阅读摘要

- **本文结论:** 测试设计覆盖 REQ-001 到 REQ-005 的全部 MUST 规格，核心自动化边界是 `tests/ts/i18n-surface.test.mjs`、manifest checks、文档/路由/fixture 回归和最终 preflight。
- **当前状态:** 已批准，进入任务执行文档阶段。
- **先读重点:** 先看测试策略摘要、测试用例总览，再按 `## 标题（TC-001 / REQ-001）` 阅读每个测试用例。
- **下游同步:** TVD 确认后创建同一 `doc_id` 的 TED，执行证据写入同一 `doc_id` 的 VED。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skill-internationalization |
| Doc ID | skill-internationalization |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节、边界和错误用例 |

## 测试策略摘要

本测试设计采用 source-scan + manifest-check + 回归测试的组合。语言边界由新增 `tests/ts/i18n-surface.test.mjs` 固定：它必须能识别 agent-facing surface 中未授权中文残留，同时允许 README、INSTALL、docs、fixtures、中文 validator 字段和中文 routing keyword 保留中文。跨平台分发文案由 manifest checks 和 i18n surface 测试共同覆盖。中文工作流兼容性由现有 document、routing、fixture 测试和最终 preflight 覆盖；如果完整 preflight 仍遇到既有 productization CLI 失败，VED 必须单独记录失败来源。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 中文用户入口保留扫描 | REQ-001 | source-scan | 自动化 + 人工审查 | VED |
| TC-002 | Agent-facing 英文执行面扫描 | REQ-002 | source-scan | 自动化 | VED |
| TC-003 | 跨平台分发文案一致性检查 | REQ-003 | config | 自动化 | VED |
| TC-004 | i18n surface 门禁接入 | REQ-004 | source-scan | 自动化 | VED |
| TC-005 | 中文工作流兼容回归 | REQ-005 | contract | 自动化 | VED |

## 中文用户入口保留扫描（TC-001 / REQ-001）

### 测试目标

验证国际化改动后中文用户仍能从根入口获得中文安装、使用、工作流和定位说明。

### 前置条件

- 国际化实现完成后，README、INSTALL、Codex hook、manifest 和中文本地化入口已更新。
- `tests/ts/i18n-surface.test.mjs` 已包含中文用户入口的正向断言。

### 测试步骤

1. 运行 `node --test tests/ts/i18n-surface.test.mjs`。
2. 检查测试是否读取 README、INSTALL、hook 或 manifest 中的中文用户入口标记。
3. 人工抽查根入口，确认中文用户能定位中文安装和工作流说明。

### 断言

- README 或 INSTALL 保留中文用户可读的安装、使用或导航入口。
- hook 或 manifest 不把插件描述为英文-only。
- agent-facing 英文化说明不会覆盖中文用户为主的产品定位。

### 测试数据

- 主要数据：README、INSTALL、`hooks/session-start-codex`、`.codex-plugin/plugin.json`。
- 覆盖条件：中文入口存在、中文用户定位存在、英文执行面说明与中文用户定位不冲突。
- 数据隔离：只读仓库文本，无需外部账号或网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务负责产生 RED/GREEN/REFACTOR 或 TDD 例外记录。

## Agent-facing 英文执行面扫描（TC-002 / REQ-002）

### 测试目标

验证默认分发给 agent 执行的 skill、prompt 和 metadata 使用英文执行规则，未授权中文残留会导致测试失败。

### 前置条件

- `tests/ts/i18n-surface.test.mjs` 定义 blocked surface：`skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml`。
- 测试定义明确 allowlist，允许中文仅作为标记过的示例或中文文档契约引用出现。

### 测试步骤

1. 在 RED 阶段运行 `node --test tests/ts/i18n-surface.test.mjs`，确认当前中文 skill surface 会失败。
2. 翻译目标 skill、prompt 和 agent metadata。
3. 在 GREEN 阶段重跑同一命令。

### 断言

- blocked surface 中未授权中文执行规则数量为零。
- 测试失败信息能指出违规文件路径。
- 允许中文样例必须通过 allowlist 显式声明。

### 测试数据

- 主要数据：`skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml`。
- 覆盖条件：中文执行门禁、中文流程步骤、中文错误处理规则、允许的 localization example。
- 数据隔离：只读仓库文本，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 RED 失败和 GREEN 通过。

## 跨平台分发文案一致性检查（TC-003 / REQ-003）

### 测试目标

验证 Codex、Claude Code、Gemini、本地 skills 客户端和 package metadata 对插件定位的描述一致。

### 前置条件

- manifest、hook、GEMINI 和 package metadata 已更新。
- i18n surface 测试包含跨平台入口扫描。

### 测试步骤

1. 运行 `node --test tests/ts/manifest-checks.test.mjs`。
2. 运行 `node --test tests/ts/i18n-surface.test.mjs`。
3. 检查平台入口描述是否同时表达中文用户优先和 agent-facing 英文执行面。

### 断言

- manifest-check 继续通过，version、skills path、asset path 和平台入口不回退。
- `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`plugin.json`、`gemini-extension.json`、`GEMINI.md`、`package.json` 和 hook 文案不互相矛盾。
- 不存在中文-only 或英文-only 的单一定位。

### 测试数据

- 主要数据：平台 manifest、`GEMINI.md`、`package.json`、`hooks/session-start-codex`。
- 覆盖条件：manifest schema、分发描述、SessionStart 注入文本、package metadata。
- 数据隔离：只读仓库文本，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 manifest-check 和 i18n surface 结果。

## i18n surface 门禁接入（TC-004 / REQ-004）

### 测试目标

验证语言边界测试进入仓库质量门禁，后续新增 skill 或 prompt 时能持续阻止语言策略漂移。

### 前置条件

- 新增 `tests/ts/i18n-surface.test.mjs`。
- `src/cli/release/preflight.ts` 的测试发现机制能发现 `tests/ts/*.test.mjs`。

### 测试步骤

1. 运行 `node --test tests/ts/i18n-surface.test.mjs`。
2. 运行 `npm run preflight`。
3. 如果 preflight 失败，区分 i18n surface 失败和既有 productization CLI 失败。

### 断言

- i18n surface 测试能独立运行并通过。
- preflight 输出中会执行新增测试，或已有测试发现机制能证明会执行 `tests/ts/*.test.mjs`。
- VED 不把既有非 i18n 失败误报为本需求通过。

### 测试数据

- 主要数据：`tests/ts/i18n-surface.test.mjs`、`src/cli/release/preflight.ts`、preflight 输出。
- 覆盖条件：测试发现、独立运行、preflight 集成、失败归因。
- 数据隔离：本地测试命令，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 preflight 集成和失败归因。

## 中文工作流兼容回归（TC-005 / REQ-005）

### 测试目标

验证中文文档契约、中文 validator 字段、中文 fixtures 和中文 workflow intent 在国际化后保持兼容。

### 前置条件

- 国际化实现不迁移 `src/lib/documents/` 中文字段、不删除 `workflow-mode` 中文关键词、不批量翻译 fixtures。
- i18n surface allowlist 已包含这些中文兼容区。

### 测试步骤

1. 运行 `node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs`。
2. 运行 `node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-spec docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md --format json`。
3. 运行 `node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-technicals --root . --format json docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md`。

### 断言

- 中文文档 metadata、formal fixture 可读性和 scenario routing contract 测试通过。
- PRD 和 TSD 专项校验继续通过。
- i18n allowlist 没有要求删除中文文档契约或中文 intent。

### 测试数据

- 主要数据：`src/lib/documents/`、`src/lib/workflow/workflow-mode.ts`、`tests/fixtures/`、`docs/coding-plugins/features/`。
- 覆盖条件：中文字段、中文表头、中文 fixture 文本、中文 intent keyword。
- 数据隔离：本地测试命令，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录回归测试和专项校验结果。

## 边界和错误用例

| Spec ID | 测试用例 ID | 条件 | 期望结果 | 测试类型 |
| --- | --- | --- | --- | --- |
| ERR-001 | TC-001 | 英文化改动移除了 README/INSTALL 中的中文用户入口。 | i18n surface 测试或人工审查失败，要求恢复中文入口。 | source-scan |
| ERR-002 | TC-002 | 英文 skill 中残留中文执行门禁。 | i18n surface 测试失败并输出违规路径。 | source-scan |
| ERR-003 | TC-003 | 平台 manifest 出现中文-only 或英文-only 的冲突定位。 | manifest / i18n 文案检查失败。 | config |
| ERR-004 | TC-004 | i18n surface 测试误伤 docs、fixtures 或中文 routing keyword。 | 测试设计失败，必须调整 allowlist。 | source-scan |
| ERR-005 | TC-005 | 国际化改动导致中文 PRD 或 TDD 证据校验失败。 | validator 或回归测试失败，必须恢复兼容。 | contract |

## 不需要测试用例的规格

- 无：REQ-001 到 REQ-005 均有对应测试用例。

## 执行提示

- 实现阶段使用 `test-driven-development`。
- 实际 RED/GREEN/REFACTOR 输出写入 VED，不写入本文档。
- 如果 TED 改变测试顺序，必须回看本文档，确认 Spec ID 覆盖没有丢失。
