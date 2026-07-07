---
title: Skills 专项优化技术方案
status: approved
lifecycle_status: approved
feature: skills-optimization
doc_id: skills-optimization
created: 2026-07-07
updated: 2026-07-07
implemented_commits: []
validated_by: "planned: node ./bin/coding-plugins.js validate-technicals --root . --format json --strict docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md"
related_docs:
  - docs/coding-plugins/features/skills-optimization/requirements/skills-optimization-PRD.md
  - docs/coding-plugins/features/skills-optimization/test-cases/skills-optimization-TVD.md
  - docs/coding-plugins/features/skills-optimization/plans/skills-optimization-TED.md
  - docs/coding-plugins/features/skills-optimization/evidences/skills-optimization-VED.md
---

# Skills 专项优化技术方案

## 阅读摘要

- **本文结论:** 采用 inventory first 的维护方案：新增一份 skills 边界清单记录每个 skill 的主职责、guard 权威来源、重复风险和迁移动作，再新增 source-scan 测试确保清单覆盖全部 `SKILL.md` 并阻止高风险 guard 细节重新写回 skill 正文。
- **当前状态:** 已批准，进入任务执行文档阶段。
- **先读重点:** 先看方案摘要、规格缺口审查、规格到设计映射和关键决策。
- **下游同步:** TSD 已确认，TVD 和 TED 已批准；执行阶段按同一 `doc_id` 写入 VED 证据。

## 文档信息

- 状态：approved。
- 生命周期：approved。
- Feature：skills-optimization。
- Doc ID：skills-optimization。
- 文档类型：TSD / 技术方案文档。
- 已实现提交：[]。
- 验证方式：计划运行 `validate-technicals`、skill boundary source-scan、routing/productization/i18n focused tests 和 preflight。

关联关系只维护在 frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md`。正文只说明技术方案、设计决策、影响范围和测试交接。

## 方案摘要

本方案不直接重写全部 skills，也不新增运行时 CLI API。REQ-002 的技术落点是 `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`，用于把 20 个现有 skills 的职责、guard 权威来源、重复风险和迁移动作变成可审查资产。REQ-003 的技术落点是 `tests/ts/skill-guard-boundary.test.mjs`，用于 source-scan 校验 inventory 覆盖率、允许的 guard 命令引用和高风险 guard 细节重复。REQ-004 约束第一批实现按清单执行低风险 skill 文案收敛，并保持现有 workflow、DP、guard 和中文兼容区行为不变。

## 规格缺口审查

- 未覆盖需求：无。REQ-001 到 REQ-004 都有技术落点和验证目标。
- 验收标准不清：无。每条需求都能映射到 inventory 审查、source-scan、focused tests 或 preflight。
- 新增外部行为：无。方案不新增公开 CLI 命令、manifest 字段或用户可见 workflow 状态。
- 错误边界 / 兼容要求：无缺口。PRD 已明确不改变 DP、workflow state、guard 语义和发布包范围。
- 处理状态：通过，未发现需要回写 PRD 的缺口。

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 定义 skill 与 guard 职责边界。 | inventory 字段定义和 source-scan 规则共同固定边界。 | TD-001, TD-002 | `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`; `tests/ts/skill-guard-boundary.test.mjs` | `node --test tests/ts/skill-guard-boundary.test.mjs` | VED 记录边界测试和人工审查结果。 |
| REQ-002 | 现有 skills 需要迁移清单。 | inventory 覆盖全部 `skills/*/SKILL.md`，并记录职责、风险和下一步动作。 | TD-001 | `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md` | `node --test tests/ts/skill-guard-boundary.test.mjs` | VED 记录覆盖率检查。 |
| REQ-003 | 边界自动化检查阻止漂移。 | 新增 source-scan 测试，校验 inventory 覆盖率、高风险 guard 细节和 allowlist。 | TD-002, TD-003 | `tests/ts/skill-guard-boundary.test.mjs` | `node --test tests/ts/skill-guard-boundary.test.mjs` | VED 记录 RED/GREEN 测试。 |
| REQ-004 | 工作流行为保持兼容。 | 保持 CLI guard 和 workflow runtime 不变，仅收敛文档与 skill 文案；用 focused tests 和 preflight 回归。 | TD-004 | `skills/`; `tests/ts/scenario-routing-contract.test.mjs`; `tests/ts/productization-cli.test.mjs`; `tests/ts/i18n-surface.test.mjs` | `node --test tests/ts/scenario-routing-contract.test.mjs tests/ts/productization-cli.test.mjs tests/ts/i18n-surface.test.mjs` | VED 记录兼容回归。 |

## 无需技术方案的规格

- 无：REQ-001 到 REQ-004 都涉及文档资产、测试契约或兼容回归，需要技术落点。

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 用 Markdown inventory 作为 skill/guard 边界的人工可读事实源。 | 迁移首先需要全量可审查清单；Markdown 与现有文档链路一致，便于中文维护和 review。 | 不是强 schema，需要测试补充覆盖率和字段完整性。 |
| TD-002 | 用 `tests/ts/skill-guard-boundary.test.mjs` 做边界检查，而不是新增 CLI 子命令。 | 当前需求是维护边界，不需要公开运行时 API；测试能被 preflight 自动发现。 | 如果后续需要用户手动运行边界检查，可再把测试规则提升为 CLI。 |
| TD-003 | 允许 skill 保留 guard 命令入口和简短摘要，禁止复制 guard 的完整判定细节。 | Agent 需要知道下一条命令，但重复细节会造成漂移。 | Source-scan 需要 allowlist，不能用简单关键词全禁。 |
| TD-004 | 第一批实现只做低风险文案收敛和 guard 边界测试，不修改 guard runtime 语义。 | 这样能降低 workflow 回归风险，并把行为改变留给后续明确需求。 | 部分 skill 仍会保留摘要式门禁，后续按 inventory 分批处理。 |

## 实现方案

- 实现模式：documentation + test + scoped skill text cleanup。
- 关联决策：TD-001、TD-002、TD-003、TD-004。
- 实现点：
  - 新增 `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`，包含每个 skill 的 `skill`、`primary_role`、`agent_guidance`、`guard_authority`、`duplication_risk`、`migration_action`、`verification` 字段。
  - 新增 `tests/ts/skill-guard-boundary.test.mjs`，扫描 `skills/*/SKILL.md` 并校验 inventory 覆盖全部 skill。
  - 在同一测试中定义高风险 guard 细节模式，例如 commit author identity 细节、release completion standards 细节、artifact mode 判定细节、workflow stale 判定细节；允许命令入口和短摘要。
  - 第一批 skill 文案只收敛重复最明显的 guard 细节，优先保留 discoverability、下一条命令和失败处理。
  - 不修改 `src/lib/workflow/`、`src/lib/git/`、`src/lib/release/` 的 runtime 语义。
- 不写入本文的内容：具体 RED/GREEN 输出、每个 skill 的最终 diff、TED 任务步骤和 VED 证据。

## 影响组件

- `docs/coding-plugins/features/skills-optimization/skill-boundary-inventory.md`：新增迁移清单，覆盖 REQ-001 和 REQ-002。
- `tests/ts/skill-guard-boundary.test.mjs`：新增边界检查，覆盖 REQ-002 和 REQ-003。
- `skills/*/SKILL.md`：按 inventory 做第一批文案收敛，覆盖 REQ-001 和 REQ-004。
- `docs/coding-plugins/INDEX.md`：由 `--write-index` 更新文档链索引。
- `todo.md`：最终实现完成后同步 Skills 专项优化 TODO 状态。
- 不适用：本阶段不修改公开 CLI 命令、manifest、package metadata 或发布脚本。

## 数据流 / 控制流

本需求没有运行时业务数据流。验证控制流如下：

```text
edit inventory and skills
  -> skill-guard-boundary source-scan checks inventory coverage and duplication rules
  -> focused routing/productization/i18n tests verify behavior compatibility
  -> preflight aggregates repository validation
  -> VED records RED/GREEN/REFACTOR evidence
```

## 接口和契约

- 设计约束 TD-001：inventory 是维护资产，字段必须稳定到可测试；新增 skill 时必须同步 inventory。
- 设计约束 TD-002：`skill-guard-boundary.test.mjs` 是边界自动化契约，被 preflight 发现并执行。
- 设计约束 TD-003：skill 可以包含 `workflow-guard`、`commit-guard`、`release guard`、`scope-check`、`dp audit` 等命令入口；不得复制这些 guard 的内部完整判定矩阵。
- 设计约束 TD-004：CLI guard runtime、DP 状态机、正式文档 frontmatter schema 和中文兼容区不变。

## 迁移 / 兼容性

迁移按 inventory 分批进行。第一批只处理重复风险高且验证明确的 skill 文案，避免一次性重写全部 20 个 skills。回滚方式是恢复对应 `SKILL.md` 文案和 inventory 条目；如果边界测试误伤合法命令引用，优先调整 allowlist 或测试模式，不删除必要 guard 入口。兼容性重点是 routing discoverability、workflow guard 强制性、commit/release 安全边界和中文模板保留。

## 测试策略

- REQ-001：source-scan 和人工审查验证 skill 与 guard 职责边界；RED 命令为 `node --test tests/ts/skill-guard-boundary.test.mjs`，GREEN 命令相同，证据写入 VED。
- REQ-002：inventory 覆盖率测试验证全部 `skills/*/SKILL.md` 都有清单条目；RED/GREEN 命令为 `node --test tests/ts/skill-guard-boundary.test.mjs`。
- REQ-003：构造测试断言遗漏 inventory 或重复高风险 guard 细节会失败；GREEN 后接入 preflight 自动发现。
- REQ-004：运行 `node --test tests/ts/scenario-routing-contract.test.mjs tests/ts/productization-cli.test.mjs tests/ts/i18n-surface.test.mjs tests/ts/skill-script-ownership.test.mjs`，最终运行 `npm run preflight -- --write-index`。

## 风险和缓解

- Source-scan 误伤合法 guard 命令入口：TD-003 明确允许命令入口和摘要，测试使用 allowlist 并增加误伤保护样例。
- Inventory 变成无人维护的文档：TD-002 用测试强制覆盖新增 skill，TVD 需加入新增 skill 漏清单的失败用例。
- 文案收敛削弱 agent 行动指引：REQ-004 focused tests 和人工审查必须确认每个高风险 skill 仍保留下一条命令、失败处理和验证入口。
- Preflight 因 draft 下游文档失败：REQ-004 的验证在正式链路完成前记录为阶段限制；TVD/TED/VED 补齐后再以 preflight 作为完成验证。
