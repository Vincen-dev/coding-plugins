---
title: Skill 国际化优化技术方案
status: approved
lifecycle_status: approved
feature: skill-internationalization
doc_id: skill-internationalization
created: 2026-07-07
updated: 2026-07-07
implemented_commits: []
validated_by: "planned: node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-technicals --root . --format json docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md"
related_docs:
  - docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md
  - docs/coding-plugins/features/skill-internationalization/test-cases/skill-internationalization-TVD.md
  - docs/coding-plugins/features/skill-internationalization/plans/skill-internationalization-TED.md
  - docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md
---

# Skill 国际化优化技术方案

## 阅读摘要

- **本文结论:** 采用语言边界先行的实现方案：新增 i18n surface 自动化测试定义 agent-facing 英文面和中文用户 allowlist，再按该边界迁移 skill、prompt、agent metadata、manifest、hook 和 context file。实现保留中文用户入口、中文文档契约和中文 workflow routing，不做发布包瘦身。
- **当前状态:** 已批准，进入测试用例设计阶段。
- **先读重点:** 先看方案摘要、规格缺口审查、规格到设计映射和关键决策。
- **下游同步:** TSD 确认后创建同一 `doc_id` 的 TVD 和 TED，并在 PRD/TSD metadata 中维护关联关系。

## 文档信息

- 状态：approved。
- 生命周期：approved。
- Feature：skill-internationalization。
- Doc ID：skill-internationalization。
- 文档类型：TSD / 技术方案文档。
- 已实现提交：[]。
- 验证方式：计划运行 `validate-technicals`、i18n surface 测试、manifest checks、docs index 测试和 preflight。

关联关系只维护在 frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md`。正文只说明技术方案、设计决策、影响范围和测试交接。

## 方案摘要

本方案先把国际化定义成可测试的语言边界，而不是直接批量翻译仓库。实现顺序为：新增语言边界测试和 allowlist，迁移 agent-facing skill surface，统一跨平台入口文案，最后用现有 validator/routing/fixture 回归保护中文工作流。中文 README、INSTALL、PRD/TSD/TVD/TED/VED 模板、中文验证字段和中文 routing keyword 保留在允许区域。发布包瘦身不进入本技术方案，避免把语言迁移和分发清理混在同一风险域。

## 规格缺口审查

- 未覆盖需求：无。REQ-001 到 REQ-005 都有技术落点和验证目标。
- 验收标准不清：无。每条需求都能映射到 source-scan、manifest-check、validator/routing 回归或人工审查。
- 新增外部行为：无。对外变化是分发文案和 agent-facing 文档语言，不新增 CLI 参数、schema 或运行时 API。
- 错误边界 / 兼容要求：无缺口。PRD 已明确保留中文用户入口、中文文档契约和中文 intent routing。
- 处理状态：通过，未发现需要回写 PRD 的缺口。

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 中文用户入口和产品定位继续优先服务中文开发者。 | `README.md`, `INSTALL.md`, `hooks/session-start-codex`, `.codex-plugin/plugin.json` 的中文入口保留和定位文案审查。 | TD-001 | `README.md`; `INSTALL.md`; `hooks/session-start-codex`; `.codex-plugin/plugin.json` | `node --test tests/ts/i18n-surface.test.mjs` | VED 记录 source-scan 和人工审查结果。 |
| REQ-002 | Agent-facing skill surface 使用英文默认。 | `skills/*/SKILL.md`, `skills/**/*-prompt.md`, `skills/*/agents/openai.yaml` 的语言扫描和翻译迁移。 | TD-001 | `skills/`; `tests/ts/i18n-surface.test.mjs` | `node --test tests/ts/i18n-surface.test.mjs` | VED 记录 RED/GREEN i18n surface 测试。 |
| REQ-003 | 跨平台 manifest、hook 和 context file 的定位一致。 | `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `plugin.json`, `gemini-extension.json`, `GEMINI.md`, `package.json`, `hooks/session-start-codex` 的文案统一。 | TD-002 | `.codex-plugin/plugin.json`; `.claude-plugin/plugin.json`; `plugin.json`; `gemini-extension.json`; `GEMINI.md`; `package.json`; `hooks/session-start-codex` | `node --test tests/ts/manifest-checks.test.mjs` | VED 记录 manifest-check 和文案扫描结果。 |
| REQ-004 | 语言边界由自动化门禁持续保护。 | `tests/ts/i18n-surface.test.mjs` 定义 blocked surface 和 allowlist，并由 preflight 自动发现。 | TD-003 | `tests/ts/i18n-surface.test.mjs`; `src/cli/release/preflight.ts` | `node --test tests/ts/i18n-surface.test.mjs` | VED 记录测试先失败再通过的证据。 |
| REQ-005 | 中文文档契约、validator、fixtures 和中文 intent routing 保持兼容。 | 保留 `src/lib/documents/*` 中文字段、`src/lib/workflow/workflow-mode.ts` 中文关键词和 `tests/fixtures` 中文内容在 allowlist 内。 | TD-004 | `src/lib/documents/`; `src/lib/workflow/workflow-mode.ts`; `tests/fixtures/`; `docs/coding-plugins/features/` | `node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs` | VED 记录回归测试和任何既有 preflight 失败。 |

## 无需技术方案的规格

- 无：REQ-001 到 REQ-005 都涉及文件边界、测试策略或兼容回归，需要技术落点。

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 用 allowlist 驱动的 i18n surface 测试定义英文执行面和中文用户保留面。 | 先固定边界可以防止批量翻译误删中文入口，也能在后续新增 skill 时持续保护语言策略。 | 需要维护 allowlist；测试可能先暴露大量现有中文残留。 |
| TD-002 | 平台入口文案采用英文主文案加中文用户优先定位，不做中文-only 或英文-only 的单一叙述。 | manifest 和 hook 被不同平台读取，统一定位可以减少用户和 agent 对插件语言策略的误解。 | 文案会比单语言描述更精确，但需要跨文件同步。 |
| TD-003 | i18n surface 测试放在 `tests/ts/`，依赖 preflight 的测试发现机制接入门禁。 | 仓库已用 `tests/ts` 和 preflight 做发布前质量门禁，新增测试能复用现有执行路径。 | 如果 preflight 仍有既有 productization 失败，VED 需要单独记录本测试结果和 preflight 既有失败。 |
| TD-004 | 中文文档契约和中文 routing keyword 在本阶段作为兼容区保留，不纳入英文执行面扫描失败范围。 | 中文用户为主是产品定位，文档链路和中文 intent 是现有核心能力。 | 仓库会继续存在中文内容；国际化目标不是全仓无中文。 |

## 实现方案

- 实现模式：code + documentation。先新增 `tests/ts/i18n-surface.test.mjs`，再修改 skill、prompt、metadata、manifest、hook 和 context 文本。
- 关联决策：TD-001、TD-002、TD-003、TD-004。
- 实现点：
  - 在 `tests/ts/i18n-surface.test.mjs` 中定义 agent-facing blocked surface：`skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml`、平台 manifest、`hooks/session-start-codex`、`GEMINI.md` 和必要 package metadata。
  - 在同一测试中定义 allowed Chinese surface：`README.md`、`INSTALL.md`、`docs/`、`tests/fixtures/`、中文 validator/schema 字段、中文 workflow routing keyword 和明确标记的 localization examples。
  - 翻译 `SKILL.md`、supporting prompts 和 `agents/openai.yaml` 的执行规则，保留 skill 名称、路径、命令和 Spec/TDD/SDD 术语。
  - 统一 manifest、hook 和 context 文案，明确 agent reads English instructions while user interaction remains language-aware, with Chinese users as the primary audience。
  - 保持中文文档契约代码、fixtures 和 workflow-mode 中文关键词不迁移。
- 不写入本文的内容：实际翻译 diff、RED/GREEN 输出、TED 任务拆分和最终验证日志。

## 影响组件

- `tests/ts/i18n-surface.test.mjs`：新增语言边界测试，覆盖 REQ-001、REQ-002、REQ-003 和 REQ-004。
- `skills/`：迁移 agent-facing skill 和 prompt 语言，覆盖 REQ-002。
- `skills/*/agents/openai.yaml`：迁移展示名称和短说明，覆盖 REQ-002。
- `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`plugin.json`、`gemini-extension.json`、`GEMINI.md`、`package.json`：统一跨平台分发文案，覆盖 REQ-003。
- `hooks/session-start-codex`：调整 SessionStart 注入文本，覆盖 REQ-001 和 REQ-003。
- `README.md`、`INSTALL.md`：保留中文用户入口，必要时增加英文主文案和中文入口导航，覆盖 REQ-001。
- `src/lib/documents/`、`src/lib/workflow/workflow-mode.ts`、`tests/fixtures/`、`docs/coding-plugins/features/`：作为兼容区被回归测试保护，覆盖 REQ-005。

## 数据流 / 控制流

本需求没有运行时业务数据流。控制流发生在仓库验证链路：

```text
edit skill / prompt / manifest / hook
  -> i18n surface test scans blocked and allowed surfaces
  -> existing manifest / document / routing tests run
  -> preflight aggregates repository validation
  -> VED records test evidence and residual failures
```

## 接口和契约

- 设计约束 TD-001：`tests/ts/i18n-surface.test.mjs` 的 blocked surface 和 allowlist 是语言边界契约，后续新增 skill 或 prompt 时同样适用。
- 设计约束 TD-002：manifest JSON 字段名、version、skills path 和 hook JSON 输出结构不变，只调整文案内容。
- 设计约束 TD-004：中文 PRD/TSD/TVD/TED/VED 字段、TDD 证据字段和中文 workflow-mode keyword 不进入英文-only 迁移范围。
- 不涉及外部 API、SDK、数据库 schema 或用户数据迁移。

## 迁移 / 兼容性

迁移策略是增量语言迁移，不改变 CLI 命令、文档路径、manifest 路径或 package bin。回滚方式是恢复对应文本文件和 i18n surface 测试 allowlist；如果翻译导致 agent 行为不稳定，可先回滚单个 skill 或 prompt，再保留测试框架继续收敛边界。兼容性重点是中文用户入口、中文文档 validator 和中文 intent routing 保持可用。

## 测试策略

- REQ-001：source-scan 检查中文用户入口和定位文案；RED 命令为 `node --test tests/ts/i18n-surface.test.mjs`，GREEN 命令相同，证据写入 VED。
- REQ-002：source-scan 检查 skill、prompt 和 agent metadata 的中文执行规则残留；RED 命令为 `node --test tests/ts/i18n-surface.test.mjs`，GREEN 命令相同，证据写入 VED。
- REQ-003：manifest-check 和 source-scan 检查平台文案一致性；命令为 `node --test tests/ts/manifest-checks.test.mjs` 和 `node --test tests/ts/i18n-surface.test.mjs`。
- REQ-004：i18n surface 测试作为新增门禁；命令为 `node --test tests/ts/i18n-surface.test.mjs`，再运行 `npm run preflight` 观察集成状态。
- REQ-005：回归测试覆盖中文文档契约和中文 routing；命令为 `node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs`，最终再运行 `npm run preflight`。

## 风险和缓解

- 翻译范围过大导致中文用户入口被削弱：TD-001 的 allowlist 和 REQ-001 的中文入口检查先行，发现删除中文入口时阻断合并。
- 测试误伤中文文档契约或 fixtures：TD-004 将中文文档、fixtures、validator 和 routing keyword 放入兼容区，并用回归测试保护。
- 跨平台文案不一致：TD-002 将 manifest、hook、GEMINI 和 package metadata 纳入同一测试范围。
- 完整 preflight 受既有 productization CLI 失败影响：VED 需要同时记录新增 i18n 测试结果和 preflight 既有失败明细，不能把非本需求失败当作通过。
