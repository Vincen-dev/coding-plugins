---
title: Skills 专项优化验证证据
status: approved
feature: skills-optimization
doc_id: skills-optimization
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/skills-optimization/requirements/skills-optimization-PRD.md
  - docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md
  - docs/coding-plugins/features/skills-optimization/test-cases/skills-optimization-TVD.md
  - docs/coding-plugins/features/skills-optimization/plans/skills-optimization-TED.md
external_references: []
---

# Skills 专项优化验证证据（VED）

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | skills-optimization |
| Doc ID | skills-optimization |
| 文档类型 | VED |
| 缩写含义 | Validation Evidence Document |

本文记录 Skills 专项优化的 RED/GREEN/REFACTOR 证据。DP-6 完成验证确认后，本文件作为提交前验证证据使用。

## 验证证据状态

### TDD 例外记录

- **原因:** 执行门禁要求 VED artifact 在 implementation 前存在；本节只记录执行证据容器创建，不替代 TASK-001 到 TASK-005 的 RED/GREEN/REFACTOR 证据。
- **用户批准:** 2026-07-07 用户回复“好的继续”，并通过 DP-4 approve 记录批准执行计划。
- **替代验证:** 已运行 workflow-state inspect，确认 PRD、TSD、TVD、TED 均为 approved 且 source_hash current；后续每个任务会追加独立 TDD 证据。
- **风险:** 如果任务完成后仍只保留本例外记录，DP-6 不应通过；完成验证前必须补齐每个任务的真实证据。

## 任务 1：建立 skill/guard 边界 source-scan

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-003；skill 本体说明必须与机器 guard 判定细节分层，且边界需要自动化检查。
- **测试类型:** `source-scan`
- **RED 测试:** `tests/ts/skill-guard-boundary.test.mjs`
- **RED 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs`
- **RED 失败:** 1 failure：`REQ-002 inventory covers every skill with stable boundary fields` 报告 `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md must exist`；失败来自缺失 inventory 资产。
- **GREEN 变更:** 新增 `tests/ts/skill-guard-boundary.test.mjs`，包含 inventory 覆盖率检查、稳定字段检查、高风险 guard 细节负向样例和合法 guard command reference 正向样例。
- **GREEN 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，2/2。
- **REFACTOR 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，2/2。
- **最终验证:** TASK-001 source-scan 已可稳定检测 inventory 缺失、guard 细节负向样例和合法 command reference。

## 任务 2：创建全量 skill 边界 inventory

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002；全部 `skills/*/SKILL.md` 必须有职责边界、guard 权威来源、重复风险、迁移动作和验证方式。
- **测试类型:** `source-scan`
- **RED 测试:** `tests/ts/skill-guard-boundary.test.mjs`
- **RED 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs`
- **RED 失败:** TASK-001 RED 报告 `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md must exist`，证明 inventory 覆盖率检查会阻止缺失清单。
- **GREEN 变更:** 新增 `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`，覆盖 19 个 `skills/*/SKILL.md`，并为每个 skill 填写 `skill`、`primary_role`、`agent_guidance`、`guard_authority`、`duplication_risk`、`migration_action`、`verification`。
- **GREEN 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，2/2。
- **REFACTOR 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，2/2。
- **最终验证:** Inventory 覆盖率和字段完整性通过；第一批 high-risk skill 已在清单中标记为迁移候选。

## 任务 3：收敛第一批高风险 skill 文案

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-004；高风险 skill 文案不得复制 guard 完整判定细节，同时不得删除 agent 下一条必要命令。
- **测试类型:** `source-scan`
- **RED 测试:** `tests/ts/skill-guard-boundary.test.mjs`
- **RED 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs`
- **RED 失败:** 1 failure：`REQ-001 skills avoid duplicating high-risk guard internals` 报告 `finishing-a-development-branch` 和 `git-commit` 复制 commit author AI 细节，`spec-driven-development` 和 `using-coding-plugins` 复制完整 DP 列表。
- **GREEN 变更:** 将 commit author 判定细节委托给 `git-commit` 和 `commit-guard`；将 DP 完整目录委托给 `decision-points`、`dp status`、`dp approve` 和 `dp audit`；保留必要命令入口和执行边界。
- **GREEN 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，3/3。
- **REFACTOR 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，3/3。
- **最终验证:** 第一批 high-risk skill 文案不再触发边界 source-scan；inventory 已同步迁移动作状态。

## 任务 4：运行兼容回归并修正误伤

### TDD 证据

- **规格/缺陷/验收:** REQ-003, REQ-004；边界检查不得误伤合法 guard 引用，routing、productization、i18n 和 skill ownership 行为保持兼容。
- **测试类型:** `source-scan`
- **RED 测试:** `tests/ts/skill-guard-boundary.test.mjs`
- **RED 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs`
- **RED 失败:** TASK-003 RED 报告 4 个实际 skill 边界重复点，证明 source-scan 会阻止 guard 细节重新写回 skill 正文。
- **GREEN 变更:** 保留 `workflow-guard`、`commit-guard`、`decision-points`、`dp status`、`dp approve` 和 `dp audit` 等合法命令入口；未删除必要 guard 引用。
- **GREEN 命令:** `node --test tests/ts/scenario-routing-contract.test.mjs tests/ts/i18n-surface.test.mjs tests/ts/skill-script-ownership.test.mjs tests/ts/skill-guard-boundary.test.mjs` PASS，17/17。
- **REFACTOR 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs` PASS，3/3。
- **最终验证:** 初次 focused regression 暴露 3 个 doctor 用例失败；根因为 TSD 章节名不符合 `document-schema` 的 `规格到设计映射` 要求并导致 TED `source_hash` stale。修正 TSD 章节名并刷新 TED hash 后，`node --test tests/ts/productization-cli.test.mjs` PASS，54/54。

## 任务 5：更新索引、TODO 和完成总体验证

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-003, REQ-004；文档链、TODO、边界测试和总体验证必须闭环。
- **测试类型:** `contract`
- **RED 测试:** `npm run preflight -- --write-index`
- **RED 命令:** `npm run preflight -- --write-index`
- **RED 失败:** 初次完整 preflight 在 `tests/ts/productization-cli.test.mjs` 中出现 3 个 doctor failures；直接运行 `doctor --root . --format json` 指向 `document-schema` 失败：`skills-optimization-TSD.md TSD is missing required sections: 规格到设计映射`。
- **GREEN 变更:** 将 TSD 章节 `规格到方案映射` 改为 schema 要求的 `规格到设计映射`，刷新 TED `source_hash`，更新 TODO、INDEX 和 VED 证据。
- **GREEN 命令:** `node ./bin/coding-plugins.js doctor --root . --format json` PASS；`node --test tests/ts/productization-cli.test.mjs` PASS，54/54；`npm run preflight -- --write-index` PASS。
- **REFACTOR 命令:** `node --test tests/ts/skill-guard-boundary.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/i18n-surface.test.mjs tests/ts/skill-script-ownership.test.mjs` PASS，17/17。
- **最终验证:** `npm run preflight -- --write-index` PASS；`git diff --check` PASS；`validate-spec`、`validate-technicals --strict` 和 `validate-tdd-evidence --strict --artifact-mode tracked` 均通过。
