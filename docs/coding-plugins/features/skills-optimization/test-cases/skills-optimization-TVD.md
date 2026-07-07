---
title: Skills 专项优化测试用例
status: approved
feature: skills-optimization
doc_id: skills-optimization
created: 2026-07-07
updated: 2026-07-07
tags:
  - skills-optimization
  - skills
  - guards
related_docs:
  - docs/coding-plugins/features/skills-optimization/requirements/skills-optimization-PRD.md
  - docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md
  - docs/coding-plugins/features/skills-optimization/plans/skills-optimization-TED.md
  - docs/coding-plugins/features/skills-optimization/evidences/skills-optimization-VED.md
---

# Skills 专项优化测试用例

## 阅读摘要

- **本文结论:** 测试设计覆盖 REQ-001 到 REQ-004，核心自动化边界是 `tests/ts/skill-guard-boundary.test.mjs`，并用 focused routing/productization/i18n/ownership 回归证明 skill 文案收敛不改变 workflow 行为。
- **当前状态:** 已批准，进入任务执行文档阶段。
- **先读重点:** 先看测试策略摘要、测试用例总览，再按 `## 标题（TC-001 / REQ-001）` 阅读每个测试用例。
- **下游同步:** TVD 已确认，继续创建同一 `doc_id` 的 TED，执行证据写入同一 `doc_id` 的 VED。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skills-optimization |
| Doc ID | skills-optimization |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节、边界和错误用例 |

## 测试策略摘要

本测试设计采用 source-scan + negative fixture + focused regression 的组合。职责边界由新增 `tests/ts/skill-guard-boundary.test.mjs` 固定：它必须能识别 `SKILL.md` 中重新复制高风险 guard 判定细节的情况，同时允许 guard 命令入口、短摘要和必要用户确认提示保留在 skill 中。迁移清单覆盖率由同一测试校验，确保每个 `skills/*/SKILL.md` 都有 inventory 条目。工作流兼容性由 routing、productization、i18n surface、skill ownership 和最终 preflight 覆盖；如果完整 preflight 在正式文档链未完成前失败，VED 必须单独记录失败来源。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | Skill 与 guard 边界扫描 | REQ-001 | source-scan | 自动化 + 人工审查 | VED |
| TC-002 | Inventory 覆盖率检查 | REQ-002 | source-scan | 自动化 | VED |
| TC-003 | 边界漂移负向样例 | REQ-003 | contract | 自动化 | VED |
| TC-004 | 合法 guard 引用误伤保护 | REQ-003 | source-scan | 自动化 | VED |
| TC-005 | 工作流兼容回归 | REQ-004 | regression | 自动化 | VED |

## Skill 与 guard 边界扫描（TC-001 / REQ-001）

### 测试目标

验证 skill 文本只保留 agent 执行所需的操作指导、guard 入口和短摘要，不复制 CLI guard、测试或共享模块已经能稳定判定的完整规则集合。

### 前置条件

- 已创建 `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`。
- 已创建 `tests/ts/skill-guard-boundary.test.mjs`。
- 第一批 skill 文案收敛已经按 inventory 执行。

### 测试步骤

1. 运行 `node --test tests/ts/skill-guard-boundary.test.mjs`。
2. 检查测试是否扫描全部 `skills/*/SKILL.md`。
3. 人工抽查被修改的高风险 skill，确认下一条命令、失败处理和验证入口仍然存在。

### 断言

- `SKILL.md` 不包含完整 DP 判定矩阵、commit author identity 判定细节、release completion 判定细节或 artifact mode 内部判定细节。
- `SKILL.md` 可以引用 `workflow-guard`、`commit-guard`、`release guard`、`scope-check`、`task status` 等命令入口。
- 被修改的 skill 仍能告诉 agent 下一步应该运行什么命令，以及失败时应该回到哪个文档或 guard。

### 测试数据

- 主要数据：`skills/*/SKILL.md`、`docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`。
- 覆盖条件：高风险 guard 细节、允许的 guard 命令入口、低风险说明文字。
- 数据隔离：只读仓库文本，无需外部账号或网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 RED/GREEN/REFACTOR 或 TDD 例外记录。

## Inventory 覆盖率检查（TC-002 / REQ-002）

### 测试目标

验证迁移清单覆盖全部现有 skills，并为每个 skill 记录主职责、agent guidance、guard authority、重复风险、迁移动作和验证方式。

### 前置条件

- `skill-boundary-inventory.md` 使用稳定表格字段。
- 当前仓库中的 skill 目录以 `skills/{name}/SKILL.md` 为准。

### 测试步骤

1. 运行 `node --test tests/ts/skill-guard-boundary.test.mjs`。
2. 对比测试读取到的 `skills/*/SKILL.md` 列表和 inventory 中的 skill 条目。
3. 检查每个 inventory 条目是否包含职责、权威来源、风险、动作和验证字段。

### 断言

- 每个 `skills/{name}/SKILL.md` 都有且只有一个 inventory 条目。
- Inventory 中不存在指向已删除 skill 的孤立条目。
- 每个条目都明确标注 `primary_role`、`agent_guidance`、`guard_authority`、`duplication_risk`、`migration_action` 和 `verification`。

### 测试数据

- 主要数据：`skills/`、`skill-boundary-inventory.md`。
- 覆盖条件：新增 skill、删除 skill、重复条目、缺失字段。
- 数据隔离：只读仓库文本，无需外部账号或网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 inventory 覆盖率 RED/GREEN 结果。

## 边界漂移负向样例（TC-003 / REQ-003）

### 测试目标

验证边界测试能发现遗漏清单、重复高风险 guard 细节和不可维护的规则复制，而不是只验证当前仓库的正向状态。

### 前置条件

- `skill-guard-boundary.test.mjs` 包含内联负向样例或 fixture 解析单元。
- 测试失败输出包含文件路径、规则类别和建议处理方式。

### 测试步骤

1. 运行 `node --test tests/ts/skill-guard-boundary.test.mjs`。
2. 检查测试中的负向样例是否覆盖遗漏 inventory 条目。
3. 检查测试中的负向样例是否覆盖高风险 guard 细节重复。

### 断言

- 缺失 inventory 条目的样例会被判定为失败。
- 复制完整 guard 判定细节的样例会被判定为失败。
- 失败信息能定位到规则类别，例如 `inventory-coverage` 或 `guard-detail-duplication`。

### 测试数据

- 主要数据：测试内联样例或 `tests/fixtures/` 中的专用样例。
- 覆盖条件：遗漏清单、重复判定矩阵、重复 release/commit/workflow guard 细节。
- 数据隔离：测试样例不得污染真实 `skills/` 和正式文档链。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录负向样例 GREEN 结果。

## 合法 guard 引用误伤保护（TC-004 / REQ-003）

### 测试目标

验证边界扫描不会把必要的 guard 命令入口、短摘要和用户确认提示误判为重复规则，避免优化后削弱 agent 行动指引。

### 前置条件

- `skill-guard-boundary.test.mjs` 定义 allowlist 或明确的允许模式。
- 测试样例覆盖合法 command reference 和 short summary。

### 测试步骤

1. 运行 `node --test tests/ts/skill-guard-boundary.test.mjs`。
2. 检查合法样例中包含 `workflow-guard`、`commit-guard`、`release guard`、`scope-check` 或 `task status` 的短引用。
3. 检查测试没有要求删除下一条命令、失败处理或用户确认点。

### 断言

- 合法 guard 命令引用通过测试。
- 短摘要通过测试，完整判定细节不通过测试。
- 测试 allowlist 不覆盖整个 skill 文件，只覆盖具体命令入口或短句模式。

### 测试数据

- 主要数据：`skills/*/SKILL.md`、测试内联合法样例。
- 覆盖条件：命令入口、短摘要、用户确认点、中文模板引用。
- 数据隔离：只读仓库文本，无需外部账号或网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录误伤保护样例结果。

## 工作流兼容回归（TC-005 / REQ-004）

### 测试目标

验证 skills 专项优化没有改变 routing、productization、i18n、skill ownership 和 preflight 相关行为。

### 前置条件

- 第一批 skill 文案收敛、inventory 和 boundary test 已完成。
- 正式文档链补齐到当前执行阶段允许的状态。

### 测试步骤

1. 运行 `node --test tests/ts/scenario-routing-contract.test.mjs tests/ts/productization-cli.test.mjs tests/ts/i18n-surface.test.mjs tests/ts/skill-script-ownership.test.mjs`。
2. 运行 `node --test tests/ts/skill-guard-boundary.test.mjs`。
3. 运行 `npm run preflight -- --write-index`。
4. 如果 preflight 失败，区分正式文档链未完成导致的 `document-schema` 失败和本需求实现失败。

### 断言

- Focused routing/productization/i18n/ownership 回归通过。
- Boundary test 通过，并被 preflight 的 test discovery 覆盖。
- 完整正式链完成后，preflight 通过；正式链未完成前的 preflight 失败必须在 VED 中归因为阶段限制。

### 测试数据

- 主要数据：`skills/`、`tests/ts/`、`src/lib/workflow/`、`src/lib/git/`、`src/lib/release/`、`docs/coding-plugins/INDEX.md`。
- 覆盖条件：routing discoverability、guard command entry、中文兼容区、script ownership、preflight 集成。
- 数据隔离：本地测试命令，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 focused tests 和 preflight 结果。

## 边界和错误用例

| Spec ID | 测试用例 ID | 条件 | 期望结果 | 测试类型 |
| --- | --- | --- | --- | --- |
| ERR-001 | TC-001 | `SKILL.md` 复制 guard 已经能判定的完整规则集合。 | boundary test 或人工审查失败，要求改成 guard 引用或短摘要。 | source-scan |
| ERR-002 | TC-001 | 文案收敛后 skill 不再给出下一条必要命令。 | 人工审查失败，要求补回操作入口。 | review |
| ERR-003 | TC-002 | Inventory 遗漏已有 `skills/*/SKILL.md`。 | 覆盖率检查失败并指出缺失 skill。 | source-scan |
| ERR-004 | TC-004 | 测试把合法 guard 命令引用当作重复规则。 | 测试设计失败，必须调整 allowlist 或检测模式。 | source-scan |
| ERR-005 | TC-005 | Skill 文案优化后 routing 或 productization 回归失败。 | 阻止完成，先修复 discoverability 或 guard 入口。 | regression |
| ERR-006 | TC-005 | 正式文档链未完成时 preflight 报 document-schema 失败。 | VED 归因为阶段限制，补齐 TED/VED 后重新运行 preflight。 | preflight |

## 不需要测试用例的规格

- 无：REQ-001 到 REQ-004 均有对应测试用例。

## 执行提示

- 实现阶段使用 `test-driven-development`。
- 实际 RED/GREEN/REFACTOR 输出写入 VED，不写入本文档。
- 如果 TED 改变测试顺序，必须回看本文档，确认 Spec ID 覆盖没有丢失。
