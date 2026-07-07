---
title: Skills 专项优化 Task Execution Document
status: approved
feature: skills-optimization
doc_id: skills-optimization
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/skills-optimization/requirements/skills-optimization-PRD.md
  - docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md
  - docs/coding-plugins/features/skills-optimization/test-cases/skills-optimization-TVD.md
  - docs/coding-plugins/features/skills-optimization/evidences/skills-optimization-VED.md
source_hash: sha256:1ba7da2bf1483644effa7d77c13747faefcc2c1ce3cdf296ff4cee09fbec2754
---

# Skills 专项优化任务执行文档（TED）

## 阅读摘要

- **本文结论:** 本 TED 将 Skills 专项优化拆成 5 个顺序任务：先建立边界测试，再创建 inventory，随后按 inventory 收敛第一批 skill 文案，最后运行兼容回归并补齐 VED/索引。
- **当前状态:** 已批准，等待执行门禁通过后进入实现。
- **先读重点:** 先看执行锁定区、执行简报、任务总览，再按 `## 任务标题（TASK-001 / REQ-001）` 逐项执行。
- **执行入口:** DP-4 批准后使用 `subagent-driven-development` 或 `executing-plans` 按任务执行；每个行为变更任务必须记录 VED 证据。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skills-optimization |
| Doc ID | skills-optimization |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只保留执行任务需要的上下文、步骤和验证口径。

## 目标

按已批准 PRD/TSD/TVD 落地 Skills 专项优化：明确 skill 本体与 guard 规则的职责边界，新增全量迁移清单和自动化边界检查，并在不改变 CLI guard runtime、DP 状态机和中文兼容区的前提下完成第一批低风险 skill 文案收敛。

## 执行入口

- 推荐方式：`subagent-driven-development`，按任务派发并在任务间评审。
- 降级方式：`executing-plans`，在当前会话按检查点执行。
- 执行约束：不得跳过 RED/GREEN/REFACTOR；无法自动测试时必须在 VED 写 TDD 例外记录。
- 新鲜度检查：执行前运行 `node ./bin/coding-plugins.js workflow-state inspect --feature skills-optimization --doc-id skills-optimization --json`；如果状态是 `plan-draft`、`plan-unlocked` 或 `plan-stale`，先回到 `writing-plans` 批准 TED、补齐 `source_hash`，或刷新 TED。

## 执行锁定区

- **Intent Lock:** 只执行 Skills 专项优化，交付 skill/guard 边界清单、边界 source-scan、第一批 skill 文案收敛和兼容回归。
- **Scope Fence:** 包含 `skill-boundary-inventory.md`、`tests/ts/skill-guard-boundary.test.mjs`、低风险 `skills/*/SKILL.md` 文案调整、文档索引和 VED 证据；不包含正式发布优化、npm package allowlist、真实发布、tag、commit、push 或 guard runtime 语义变更。
- **Required Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-004
- **Required Tests:** `node --test tests/ts/skill-guard-boundary.test.mjs`; `node --test tests/ts/scenario-routing-contract.test.mjs tests/ts/productization-cli.test.mjs tests/ts/i18n-surface.test.mjs tests/ts/skill-script-ownership.test.mjs`; PRD/TSD validators; `npm run preflight -- --write-index`
- **Review Gates:** 每个任务后检查 diff 是否只触碰任务范围；修改 skill 文案后人工抽查下一条命令、失败处理和验证入口；进入提交或发布前必须另走 DP-6/DP-7。
- **Rewind Triggers:** 上游 PRD/TSD/TVD 变更、source_hash 不匹配、新增 CLI/API/schema 行为、guard runtime 语义改变、中文兼容区被删除、source-scan 误伤合法 guard 引用、focused tests 失败且不能归因为既有 productization doctor 问题。

## 执行简报

- **执行来源:** 只按本 TED 的任务章节执行；技术细节以 TSD 为准，测试边界以 TVD 为准。
- **上下文预算:** 执行阶段优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TSD/TVD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 TED，不向旧 TED 追加任务。

## 上游约束摘要

- 需求约束：`SKILL.md` 可以保留 guard 命令入口和短摘要，不得复制 guard 内部完整判定规则；抽离规则不能删除 agent 下一条必要命令。
- 技术约束：采用 inventory first；边界检查用 `tests/ts/skill-guard-boundary.test.mjs`，不新增公开 CLI 子命令，不修改 `src/lib/workflow/`、`src/lib/git/`、`src/lib/release/` runtime 语义。
- 测试约束：每个 MUST 规格都有 TVD 测试用例，实际 RED/GREEN/REFACTOR 或 TDD 例外写入同一 `doc_id` 的 VED。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | VED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 建立 skill/guard 边界 source-scan | REQ-001, REQ-003 | `node --test tests/ts/skill-guard-boundary.test.mjs` | 同一 `doc_id` 的 VED |
| TASK-002 | 创建全量 skill 边界 inventory | REQ-001, REQ-002 | `node --test tests/ts/skill-guard-boundary.test.mjs` | 同一 `doc_id` 的 VED |
| TASK-003 | 收敛第一批高风险 skill 文案 | REQ-001, REQ-004 | boundary test + 人工抽查 | 同一 `doc_id` 的 VED |
| TASK-004 | 运行兼容回归并修正误伤 | REQ-003, REQ-004 | focused regression tests | 同一 `doc_id` 的 VED |
| TASK-005 | 更新索引、TODO 和完成总体验证 | REQ-001, REQ-002, REQ-003, REQ-004 | validators、docs-index、preflight | 同一 `doc_id` 的 VED |

## 建立 skill/guard 边界 source-scan（TASK-001 / REQ-001）

### 任务目标

新增边界 source-scan 测试，定义高风险 guard 细节重复、合法 guard 命令入口和误伤保护样例。

### 执行前提

- 已确认需求：REQ-001、REQ-003。
- 已确认设计：TD-002、TD-003。
- 已确认测试：TC-001、TC-003、TC-004。

### 修改范围

- 创建：`tests/ts/skill-guard-boundary.test.mjs`，负责 skill/guard 边界扫描。
- 暂不修改：`skills/*/SKILL.md`，除非为了构造测试样例需要读取真实文本。
- 测试：`tests/ts/skill-guard-boundary.test.mjs` 覆盖 source-scan。

### 执行步骤

- [ ] **步骤 1：写失败测试**
  - 规格 ID：REQ-001, REQ-003
  - 测试位置：`tests/ts/skill-guard-boundary.test.mjs`
  - 预期失败：当前缺少 inventory，或者高风险 guard 细节/负向样例缺少检测。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
  - 预期：FAIL，失败原因来自缺失边界契约或缺失 inventory。
- [ ] **步骤 3：实现检测框架**
  - 修改：`tests/ts/skill-guard-boundary.test.mjs`
  - 边界：只实现扫描、allowlist、负向样例和失败信息，不修改 runtime guard。
- [ ] **步骤 4：记录 RED 证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。
  - 字段：规格/缺陷/验收、测试类型、RED 测试、RED 命令、RED 失败。

### 验证方式

- 覆盖规格：REQ-001, REQ-003
- 测试类型：source-scan / contract
- 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
- 预期结果：RED 阶段失败原因来自边界资产缺失，不是导入、拼写或环境问题。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 1：建立 skill/guard 边界 source-scan`
- 无法自动测试时：必须写 `### TDD 例外记录`，包含原因、用户批准、替代验证和风险。

## 创建全量 skill 边界 inventory（TASK-002 / REQ-002）

### 任务目标

创建覆盖全部 `skills/*/SKILL.md` 的边界清单，记录每个 skill 的主职责、agent guidance、guard authority、重复风险、迁移动作和验证方式。

### 执行前提

- 已确认需求：REQ-001、REQ-002。
- 已确认设计：TD-001。
- 已确认测试：TC-002。
- TASK-001 已建立 inventory 覆盖率测试。

### 修改范围

- 创建：`docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`
- 修改：`tests/ts/skill-guard-boundary.test.mjs`，补齐 inventory 表格解析和字段断言。
- 不修改：guard runtime、manifest、package metadata。

### 执行步骤

- [ ] **步骤 1：列出当前 skills**
  - 命令：`find skills -maxdepth 2 -name SKILL.md -print | sort`
  - 预期：获得全部当前 skill 列表。
- [ ] **步骤 2：创建 inventory**
  - 字段：`skill`、`primary_role`、`agent_guidance`、`guard_authority`、`duplication_risk`、`migration_action`、`verification`
  - 边界：中文模板、中文参考和 fixtures 只分类，不因本需求强制英文化。
- [ ] **步骤 3：运行 GREEN 测试**
  - 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
  - 预期：inventory 覆盖率相关断言通过；其他未完成文案收敛断言可按任务边界记录。
- [ ] **步骤 4：记录 inventory 证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-001, REQ-002
- 测试类型：source-scan
- 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
- 预期结果：每个 `skills/{name}/SKILL.md` 都有且只有一个 inventory 条目，字段完整。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 2：创建全量 skill 边界 inventory`
- 必须记录：skills 列表命令、inventory 覆盖率结果和不迁移分类理由。

## 收敛第一批高风险 skill 文案（TASK-003 / REQ-004）

### 任务目标

按 inventory 处理重复风险高且验证明确的 skill 文案，删除 guard 内部完整判定细节，保留 guard 命令入口、下一条命令、失败处理和验证入口。

### 执行前提

- 已确认需求：REQ-001、REQ-004。
- 已确认设计：TD-003、TD-004。
- 已确认测试：TC-001、TC-004。
- TASK-001 和 TASK-002 已建立边界测试和 inventory。

### 修改范围

- 修改：`skills/*/SKILL.md` 中 inventory 标记为第一批迁移的条目。
- 修改：`docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`，同步实际迁移动作。
- 测试：`tests/ts/skill-guard-boundary.test.mjs`。

### 执行步骤

- [ ] **步骤 1：选择第一批迁移项**
  - 来源：inventory 中 `duplication_risk` 为需要迁移或高风险的条目。
  - 边界：优先处理重复最明显、验证最明确的 skill；不一次性重写全部 skills。
- [ ] **步骤 2：收敛 skill 文案**
  - 修改：删除完整 guard 判定矩阵或细节复制。
  - 保留：guard 命令入口、短摘要、下一条命令、失败处理、用户确认点。
- [ ] **步骤 3：运行边界测试**
  - 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
  - 预期：PASS。
- [ ] **步骤 4：人工抽查高风险 skill**
  - 检查：`using-coding-plugins`、`using-git-commit`、`verification-before-completion`、`writing-plans`、`finishing-a-development-branch` 等仍保留必要行动入口。
- [ ] **步骤 5：记录 GREEN 证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-001, REQ-004
- 测试类型：source-scan / review
- 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
- 预期结果：边界测试通过，人工抽查确认 agent 行动指引未被削弱。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 3：收敛第一批高风险 skill 文案`
- 必须记录：迁移 skill 列表、边界测试结果和人工抽查结论。

## 运行兼容回归并修正误伤（TASK-004 / REQ-003）

### 任务目标

验证边界测试不会误伤合法 guard 引用，并证明 routing、productization、i18n、skill ownership 行为保持兼容。

### 执行前提

- 已确认需求：REQ-003、REQ-004。
- 已确认设计：TD-002、TD-003、TD-004。
- 已确认测试：TC-004、TC-005。
- TASK-003 已完成第一批文案收敛。

### 修改范围

- 修改：`tests/ts/skill-guard-boundary.test.mjs` allowlist 或检测模式，仅在误伤合法引用时调整。
- 不修改：`src/lib/workflow/`、`src/lib/git/`、`src/lib/release/` runtime 语义，除非发现真实回归且回到上游文档处理。
- 测试：focused regression tests。

### 执行步骤

- [ ] **步骤 1：运行 focused regression**
  - 命令：`node --test tests/ts/scenario-routing-contract.test.mjs tests/ts/productization-cli.test.mjs tests/ts/i18n-surface.test.mjs tests/ts/skill-script-ownership.test.mjs`
  - 预期：PASS；如果 productization doctor 失败，必须记录具体失败并判断是否为既有问题。
- [ ] **步骤 2：运行边界测试**
  - 命令：`node --test tests/ts/skill-guard-boundary.test.mjs`
  - 预期：PASS。
- [ ] **步骤 3：修正误伤**
  - 边界：只调整 allowlist 或检测模式；不得删除必要 guard 入口来迁就测试。
- [ ] **步骤 4：记录兼容证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-003, REQ-004
- 测试类型：source-scan / regression
- 命令：focused regression 和 boundary test
- 预期结果：合法 guard 引用不被误伤，现有工作流兼容测试通过或有明确归因。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 4：运行兼容回归并修正误伤`
- 必须记录：focused regression 命令、失败归因、allowlist 是否调整。

## 更新索引、TODO 和完成总体验证（TASK-005 / REQ-004）

### 任务目标

更新文档索引、TODO 和 VED，运行总体验证，并明确记录完整 preflight 中 productization CLI doctor 失败是否仍存在。

### 执行前提

- TASK-001 到 TASK-004 已完成。
- VED 已记录每个任务的 RED/GREEN/REFACTOR 或 TDD 例外。

### 修改范围

- 修改：`docs/coding-plugins/INDEX.md`
- 修改：`todo.md`
- 修改：`docs/coding-plugins/features/skills-optimization/evidences/skills-optimization-VED.md`
- 测试：validators、docs-index、preflight。

### 执行步骤

- [ ] **步骤 1：更新索引**
  - 命令：`npm run preflight -- --write-index`
  - 预期：INDEX 包含 PRD/TSD/TVD/TED/VED；如果完整命令后续失败，仍要确认索引是否已写入。
- [ ] **步骤 2：运行专项验证**
  - 命令：`node ./bin/coding-plugins.js validate-spec docs/coding-plugins/features/skills-optimization/requirements/skills-optimization-PRD.md --format json`
  - 命令：`node ./bin/coding-plugins.js validate-technicals --root . --format json --strict docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md`
  - 命令：`node --test tests/ts/docs-index.test.mjs tests/ts/skill-guard-boundary.test.mjs`
- [ ] **步骤 3：运行完整 preflight**
  - 命令：`npm run preflight -- --write-index`
  - 预期：PASS；如果失败，归因到具体测试，不得把既有 doctor 失败记为本需求通过。
- [ ] **步骤 4：同步 TODO 和 VED**
  - 写入：同一 `doc_id` 的 VED 证据文档。
  - 内容：每个任务的命令、结果、剩余风险和 preflight 状态。

### 验证方式

- 覆盖规格：REQ-001, REQ-002, REQ-003, REQ-004
- 测试类型：source-scan / contract / regression
- 命令：validators、docs-index、boundary test、focused regression 和 preflight
- 预期结果：边界测试、focused regression 和文档校验通过；preflight 失败时有明确归因和后续处理。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 5：更新索引、TODO 和完成总体验证`
- 必须记录：最终验证命令、preflight 结果、既有失败或剩余风险。

## 完成检查

- [ ] 每个 MUST Spec ID 都映射到任务或明确豁免。
- [ ] 每个任务都有 RED/GREEN/REFACTOR 命令或 TDD 例外记录。
- [ ] 每个任务都指向 VED 证据文件和字段。
- [ ] 已运行相关 validator、测试或 preflight。
- [ ] DP-4 执行计划批准后，才进入 `using-git-worktrees` 和实现阶段。
