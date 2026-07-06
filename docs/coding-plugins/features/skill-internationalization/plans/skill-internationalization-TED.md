---
title: Skill 国际化优化 Task Execution Document
status: approved
feature: skill-internationalization
doc_id: skill-internationalization
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md
  - docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md
  - docs/coding-plugins/features/skill-internationalization/test-cases/skill-internationalization-TVD.md
  - docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md
source_hash: sha256:d1d40d6ea4211674176a448a56989dbfc5437ac737d8211c55560d4f15cefbd2
---

# Skill 国际化优化任务执行文档（TED）

## 阅读摘要

- **本文结论:** 本 TED 将国际化优化拆成 5 个顺序任务：先建立语言边界测试，再迁移 skill/prompt/metadata，随后统一平台入口文案、保护中文兼容区，最后补齐文档索引和 VED 证据。
- **当前状态:** 已批准，等待执行门禁通过后进入实现。
- **先读重点:** 先看执行锁定区、执行简报、任务总览，再按 `## 任务标题（TASK-001 / REQ-001）` 逐项执行。
- **执行入口:** 使用 `subagent-driven-development` 或 `executing-plans` 按任务执行；每个行为变更任务必须记录 VED 证据。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | skill-internationalization |
| Doc ID | skill-internationalization |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只保留执行任务需要的上下文、步骤和验证口径。

## 目标

按已批准 PRD/TSD/TVD 落地 Coding Plugins 国际化边界：中文用户继续优先，agent-facing skill 执行面改为英文默认，并用自动化测试持续防止语言边界漂移。

## 执行入口

- 推荐方式：`subagent-driven-development`，按任务派发并在任务间评审。
- 降级方式：`executing-plans`，在当前会话按检查点执行。
- 执行约束：不得跳过 RED/GREEN/REFACTOR；无法自动测试时必须在 VED 写 TDD 例外记录。
- 新鲜度检查：执行前运行 `${CP_CLI} workflow-state inspect --feature skill-internationalization --doc-id skill-internationalization --json`；如果状态是 `plan-draft`、`plan-unlocked` 或 `plan-stale`，先回到 `writing-plans` 批准 TED、补齐 `source_hash`，或刷新 TED。

## 执行锁定区

- **Intent Lock:** 只执行 skill 国际化优化，交付中文用户优先、agent-facing 英文执行面和语言边界门禁。
- **Scope Fence:** 包含 i18n surface 测试、skill/prompt/agent metadata 翻译、平台入口文案统一、中文兼容回归和文档索引；不包含发布包瘦身、npm allowlist 重构、真实发布、tag、commit 或 push。
- **Required Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005
- **Required Tests:** `node --test tests/ts/i18n-surface.test.mjs`; `node --test tests/ts/manifest-checks.test.mjs`; `node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs`; PRD/TSD validators; `npm run preflight`
- **Review Gates:** 每个任务后检查 diff 是否只触碰任务范围；完成翻译任务后进行规格符合性和代码质量评审；进入提交或发布前必须另走 DP-6/DP-7。
- **Rewind Triggers:** 上游 PRD/TSD/TVD 变更、source_hash 不匹配、新增外部行为、CLI/API/schema 改动、发布包范围扩张、中文用户入口被移除、测试设计误伤中文兼容区、验证失败且影响需求契约。

## 执行简报

- **执行来源:** 只按本 TED 的任务章节执行；最终执行靠已规划好的任务推进。
- **上下文预算:** 执行阶段优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TSD/TVD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 TED，不向旧 TED 追加任务。

## 上游约束摘要

- 需求约束：中文用户为主不变；agent-facing skill surface 英文默认；中文文档契约和中文 intent routing 必须保持兼容。
- 技术约束：先以 `tests/ts/i18n-surface.test.mjs` 固定 blocked surface 和 allowlist，再迁移文本；不做发布包瘦身。
- 测试约束：每个 MUST 规格都有 TVD 测试用例，实际 RED/GREEN/REFACTOR 或 TDD 例外写入同一 `doc_id` 的 VED。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | VED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 建立 i18n surface 语言边界测试 | REQ-001, REQ-002, REQ-004 | `node --test tests/ts/i18n-surface.test.mjs` | 同一 `doc_id` 的 VED |
| TASK-002 | 迁移 skill、prompt 和 agent metadata 为英文执行面 | REQ-002 | `node --test tests/ts/i18n-surface.test.mjs` | 同一 `doc_id` 的 VED |
| TASK-003 | 统一跨平台分发入口文案 | REQ-001, REQ-003 | `node --test tests/ts/manifest-checks.test.mjs` + i18n surface 测试 | 同一 `doc_id` 的 VED |
| TASK-004 | 保护中文工作流兼容区 | REQ-005 | document、routing、fixture 回归测试 | 同一 `doc_id` 的 VED |
| TASK-005 | 更新索引并完成总体验证 | REQ-001, REQ-002, REQ-003, REQ-004, REQ-005 | validators、docs-index、preflight | 同一 `doc_id` 的 VED |

## 建立 i18n surface 语言边界测试（TASK-001 / REQ-001, REQ-002, REQ-004）

### 任务目标

新增可失败的语言边界测试，定义 agent-facing blocked surface、中文用户 allowlist 和失败输出格式。

### 执行前提

- 已确认需求：REQ-001、REQ-002、REQ-004。
- 已确认设计：TD-001、TD-003。
- 已确认测试：TC-001、TC-002、TC-004。

### 修改范围

- 创建：`tests/ts/i18n-surface.test.mjs`，负责语言边界扫描。
- 修改：无，除非需要补充测试 fixture 或 allowlist 注释。
- 测试：`tests/ts/i18n-surface.test.mjs` 覆盖 source-scan。

### 执行步骤

- [ ] **步骤 1：写失败测试**
  - 规格 ID：REQ-001, REQ-002, REQ-004
  - 测试位置：`tests/ts/i18n-surface.test.mjs`
  - 预期失败：当前中文 skill surface 会触发 blocked surface 中文残留断言。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`node --test tests/ts/i18n-surface.test.mjs`
  - 预期：FAIL，失败信息指出至少一个未授权中文残留文件。
- [ ] **步骤 3：收敛测试实现**
  - 修改：`tests/ts/i18n-surface.test.mjs`
  - 边界：只定义扫描范围、allowlist 和断言，不翻译生产文本。
- [ ] **步骤 4：记录 RED 证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。
  - 字段：规格/缺陷/验收、测试类型、RED 测试、RED 命令、RED 失败。

### 验证方式

- 覆盖规格：REQ-001, REQ-002, REQ-004
- 测试类型：source-scan
- 命令：`node --test tests/ts/i18n-surface.test.mjs`
- 预期结果：RED 阶段失败原因来自中文执行面未迁移，不是导入、拼写或环境问题。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 1：建立 i18n surface 语言边界测试`
- 无法自动测试时：必须写 `### TDD 例外记录`，包含原因、用户批准、替代验证和风险。

## 迁移 skill、prompt 和 agent metadata 为英文执行面（TASK-002 / REQ-002）

### 任务目标

把 agent-facing skill surface 迁移为英文默认，同时保留 skill 名称、命令、Spec/TDD/SDD 术语和必要中文示例 allowlist。

### 执行前提

- 已确认需求：REQ-002。
- 已确认设计：TD-001。
- 已确认测试：TC-002。
- TASK-001 已产生 RED 测试。

### 修改范围

- 修改：`skills/*/SKILL.md`，翻译执行规则。
- 修改：`skills/**/*-prompt.md`，翻译实现、评审和计划 prompt。
- 修改：`skills/*/agents/openai.yaml`，翻译 display 和 short description。
- 测试：`tests/ts/i18n-surface.test.mjs`。

### 执行步骤

- [ ] **步骤 1：翻译最小通过面**
  - 规格 ID：REQ-002
  - 边界：只迁移 agent-facing 执行规则；不批量翻译 docs、fixtures、validator。
- [ ] **步骤 2：运行 GREEN 测试**
  - 命令：`node --test tests/ts/i18n-surface.test.mjs`
  - 预期：PASS 或只剩非 TASK-002 范围的失败。
- [ ] **步骤 3：抽样审查语义等价**
  - 检查：TDD、SDD、git commit、verification、subagent 相关关键门禁未被弱化。
- [ ] **步骤 4：记录 GREEN 证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-002
- 测试类型：source-scan
- 命令：`node --test tests/ts/i18n-surface.test.mjs`
- 预期结果：blocked surface 无未授权中文执行规则残留。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 2：迁移 skill、prompt 和 agent metadata 为英文执行面`
- 必须记录：GREEN 命令、翻译范围、抽样审查结论。

## 统一跨平台分发入口文案（TASK-003 / REQ-001, REQ-003）

### 任务目标

统一 Codex、Claude Code、Gemini、本地 skills 客户端和 package metadata 的语言定位，表达“中文用户优先 + agent-facing 英文执行面”。

### 执行前提

- 已确认需求：REQ-001、REQ-003。
- 已确认设计：TD-002。
- 已确认测试：TC-001、TC-003。

### 修改范围

- 修改：`.codex-plugin/plugin.json`
- 修改：`.claude-plugin/plugin.json`
- 修改：`plugin.json`
- 修改：`gemini-extension.json`
- 修改：`GEMINI.md`
- 修改：`package.json`
- 修改：`hooks/session-start-codex`
- 可能修改：`README.md`、`INSTALL.md`，仅用于保留或补强中文用户入口。

### 执行步骤

- [ ] **步骤 1：写或扩展分发文案断言**
  - 测试位置：`tests/ts/i18n-surface.test.mjs` 或现有 manifest tests。
  - 预期失败：当前入口存在中文-only 或互相不一致的文案。
- [ ] **步骤 2：运行 RED**
  - 命令：`node --test tests/ts/i18n-surface.test.mjs`
  - 预期：FAIL，失败指向入口文案一致性。
- [ ] **步骤 3：更新入口文案**
  - 边界：不改变 manifest schema、version、skills path、hook JSON 输出结构。
- [ ] **步骤 4：运行 GREEN**
  - 命令：`node --test tests/ts/manifest-checks.test.mjs && node --test tests/ts/i18n-surface.test.mjs`
  - 预期：PASS。

### 验证方式

- 覆盖规格：REQ-001, REQ-003
- 测试类型：config
- 命令：`node --test tests/ts/manifest-checks.test.mjs` 和 `node --test tests/ts/i18n-surface.test.mjs`
- 预期结果：manifest-check 不回退，入口文案不冲突。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 3：统一跨平台分发入口文案`
- 必须记录：RED 失败、GREEN 通过和人工文案审查摘要。

## 保护中文工作流兼容区（TASK-004 / REQ-005）

### 任务目标

确保国际化不会破坏中文 PRD/TSD/TVD/TED/VED 文档契约、中文 validator 字段、中文 fixtures 和中文 workflow intent。

### 执行前提

- 已确认需求：REQ-005。
- 已确认设计：TD-004。
- 已确认测试：TC-005。

### 修改范围

- 修改：`tests/ts/i18n-surface.test.mjs` allowlist，如测试误伤中文兼容区。
- 不修改：`src/lib/documents/` 中文契约字段、`src/lib/workflow/workflow-mode.ts` 中文 keyword、`tests/fixtures/` 中文内容，除非发现真实回归且需修复。
- 测试：document、routing、fixture 回归测试。

### 执行步骤

- [ ] **步骤 1：运行兼容回归**
  - 命令：`node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs`
  - 预期：PASS。
- [ ] **步骤 2：运行 PRD/TSD 专项校验**
  - 命令：`node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-spec docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md --format json`
  - 命令：`node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-technicals --root . --format json docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md`
- [ ] **步骤 3：修正误伤**
  - 边界：只修 allowlist 或测试断言；不得删除中文兼容内容来迁就测试。
- [ ] **步骤 4：记录回归证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-005
- 测试类型：contract
- 命令：`node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs`
- 预期结果：PASS，且中文文档契约、fixtures 和中文 intent 支持不回退。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 4：保护中文工作流兼容区`
- 必须记录：兼容回归命令、PRD/TSD 专项校验和是否调整 allowlist。

## 更新索引并完成总体验证（TASK-005 / REQ-001, REQ-002, REQ-003, REQ-004, REQ-005）

### 任务目标

更新文档索引、补齐 VED、运行总体验证，并明确记录完整 preflight 中既有 productization CLI 失败是否仍存在。

### 执行前提

- TASK-001 到 TASK-004 已完成。
- VED 已记录每个任务的 RED/GREEN/REFACTOR 或 TDD 例外。

### 修改范围

- 修改：`docs/coding-plugins/INDEX.md`
- 创建或修改：`docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md`
- 测试：validators、docs-index、preflight。

### 执行步骤

- [ ] **步骤 1：更新索引**
  - 命令：`npm run preflight -- --write-index`
  - 预期：INDEX 包含 PRD/TSD/TVD/TED/VED；如果完整命令后续失败，仍要确认索引是否已写入。
- [ ] **步骤 2：运行专项验证**
  - 命令：`node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-spec docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md --format json`
  - 命令：`node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-technicals --root . --format json --strict docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md`
  - 命令：`node --test tests/ts/docs-index.test.mjs`
- [ ] **步骤 3：运行完整 preflight**
  - 命令：`npm run preflight`
  - 预期：如果失败，归因到具体测试；不得把既有 productization CLI 失败记为本需求通过。
- [ ] **步骤 4：补齐 VED 和最终报告**
  - 写入：同一 `doc_id` 的 VED 证据文档。
  - 内容：每个任务的命令、结果、剩余风险和 preflight 状态。

### 验证方式

- 覆盖规格：REQ-001, REQ-002, REQ-003, REQ-004, REQ-005
- 测试类型：source-scan / config / contract
- 命令：validators、docs-index、i18n surface、manifest、compat regression 和 preflight
- 预期结果：所有新增 i18n 相关测试通过；完整 preflight 的任何失败必须有明确归因。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 5：更新索引并完成总体验证`
- 必须记录：最终验证命令、preflight 结果、既有失败或剩余风险。

## 完成检查

- [ ] 每个 MUST Spec ID 都映射到任务或明确豁免。
- [ ] 每个任务都有 RED/GREEN/REFACTOR 命令或 TDD 例外记录。
- [ ] 每个任务都指向 VED 证据文件和字段。
- [ ] 已运行相关 validator、测试或 preflight。
- [ ] DP-4 执行计划批准后，才进入 `using-git-worktrees` 和实现阶段。
