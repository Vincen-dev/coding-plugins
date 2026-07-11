---
title: Coding Plugins 工作流简化与工程策略绑定 VED 证据文档
status: complete
feature: workflow-runtime
doc_id: workflow-simplification
created: 2026-07-11
updated: 2026-07-11
related_docs:
  - docs/coding-plugins/features/workflow-runtime/requirements/workflow-simplification-PRD.md
  - docs/coding-plugins/features/workflow-runtime/technicals/workflow-simplification-TSD.md
  - docs/coding-plugins/features/workflow-runtime/test-cases/workflow-simplification-TVD.md
  - docs/coding-plugins/features/workflow-runtime/plans/workflow-simplification-TED.md
---

# Coding Plugins 工作流简化与工程策略绑定 VED 证据文档

## 阅读摘要

- **本文结论:** TASK-001 至 TASK-009 已按 TDD 完成；新增 workflow tests、全部既有 tests、typecheck、package/build、文档 strict validators、formal evidence eligibility 和 SessionStart hook 均通过。
- **当前状态:** complete；DP-6 已确认完成验证，DP-7 已批准 commit、push 与 GitHub Release，交付证据将在发布流程中生成。
- **先读重点:** 按 TASK-001 至 TASK-009 查看 Requirement Evidence、Policy Evidence，再看最终验证与明确保留的兼容边界。
- **上游来源:** 证据必须追溯到同一 `doc_id` 的 PRD、TSD、TVD 和 TED，并匹配 TED `source_hash`。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | complete |
| Feature | workflow-runtime |
| Doc ID | workflow-simplification |
| 文档类型 | VED |
| 当前资格 | `valid_for=[local-review, task-completion, formal-completion]`；`formal_completion_allowed=true` |

## TDD 证据

- **规格/缺陷/验收:** REQ-009、POL-DOC-001；正式 VED 在进入任务执行前也需要满足可复现证据文档契约，但不得声称业务实现完成。
- **测试类型:** config
- **RED 测试:** `docs/coding-plugins/features/workflow-runtime/evidences/workflow-simplification-VED.md`
- **RED 命令:** `npm test`
- **RED 失败:** Preflight reported `Missing TDD 证据 or TDD 例外记录 section` because the initial pending container used an unsupported evidence heading.
- **GREEN 变更:** 将证据容器改为校验器支持的 `TDD 证据` 结构，保留所有实现任务为 pending，并明确 `formal_completion_allowed=false`。
- **GREEN 命令:** `npm test`
- **REFACTOR 命令:** `npm test`
- **最终验证:** `npm test` PASS；preflight、typecheck、全部现有 TypeScript tests 与 SessionStart hook baseline 均通过。

### 待执行任务登记

| Task | Requirement Evidence | Policy Evidence | RED/GREEN/REFACTOR | 状态 |
| --- | --- | --- | --- | --- |
| TASK-001 | REQ-001、REQ-002、OBS-001 | POL-ARCH-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-002 | REQ-002、REQ-010、MIG-001 | POL-ARCH-001、POL-COMPAT-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-003 | REQ-003、REQ-004 | POL-DOC-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-004 | REQ-005、MIG-001 | POL-COMPAT-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-005 | REQ-006 | POL-ARCH-001、POL-DOC-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-006 | REQ-007 | POL-DOC-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-007 | REQ-008 | POL-ARCH-001、POL-TDD-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-008 | REQ-009 | POL-TDD-001、POL-VERIFY-001 | RED/GREEN/REFACTOR 已记录 | complete |
| TASK-009 | REQ-010、MIG-001、OBS-001 | 全部 required Policies | RED/GREEN/REFACTOR 已记录 | complete |

## Requirement Evidence

## TASK-001：建立唯一路由决策契约

### TDD 证据

- **规格/缺陷/验收:** REQ-001、REQ-002、OBS-001；四个历史意图得到唯一稳定 flow，unknown scope 不转成零，diagnostics 使用稳定 code。
- **测试类型:** contract
- **RED 测试:** `tests/ts/workflow-runtime-routing.test.mjs`、`tests/ts/workflow-runtime-contract.test.mjs`、`tests/ts/workflow-runtime-diagnostics.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-routing.test.mjs tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs`
- **RED 失败:** 6 tests failed with explicit assertions that `classifyIntent`, `decideRoute`, diagnostic registry and sorting contracts were missing.
- **GREEN 变更:** 新增 deterministic intent classifier、三流程 route decision、unknown scope 语义和稳定 diagnostics registry，并从现有 workflow-mode 兼容入口重导出。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-routing.test.mjs tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs` PASS，6/6。
- **REFACTOR 命令:** `node --test tests/ts/src-architecture.test.mjs tests/ts/workflow-runtime-routing.test.mjs tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs` PASS，11/11。
- **最终验证:** `npm run typecheck` PASS；targeted behavior/contract/diagnostics/architecture tests PASS。

### Requirement Evidence

- TC-001：SDK 分析和 OpenSpec 比较返回 Inspect；UI 优化返回 Change；schema/protobuf migration 返回 Governed Change。
- TC-002：`schemaVersion=2.0`，unknown counts 不出现为零，allowed/blocked actions 无交集。
- TC-012：diagnostic registry、remediation 和 priority sorting 均由自动化断言覆盖。

## TASK-002：接入 WorkflowRuntime 与 v1 投影

### TDD 证据

- **规格/缺陷/验收:** REQ-002、REQ-010、MIG-001；TaskStatus 只消费一次 v2 route decision，并保留现有 v1 字段和默认语义。
- **测试类型:** contract
- **RED 测试:** `tests/ts/workflow-runtime-contract.test.mjs`、`tests/ts/workflow-runtime-cli.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-cli.test.mjs tests/ts/productization-cli.test.mjs`
- **RED 失败:** 3 tests failed because `WorkflowRuntime`, the v1 projector, and `route_decision` on TaskStatus did not exist; all 55 existing productization tests remained green.
- **GREEN 变更:** 新增 `WorkflowRuntime.evaluate` 等价 API、显式 v1 projector 和 TaskStatus `route_decision`，使“分析 schema 怎么实现”不再被旧 contract-first 规则误路由。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-contract.test.mjs tests/ts/workflow-runtime-cli.test.mjs tests/ts/productization-cli.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/workflow-state.test.mjs` PASS，68/68。
- **REFACTOR 命令:** `npm run typecheck` PASS；runtime/projector 类型边界无循环依赖错误。
- **最终验证:** v1 productization 55/55 PASS，新增 contract/CLI 5/5 PASS，scenario/workflow-state 回归 PASS。

### Requirement Evidence

- TaskStatus payload 保留 `entrypoint`、`mode`、state/actions/next fields，同时新增同源 `route_decision`。
- v2 Inspect 投影为 legacy analysis-only，Change 投影为 tdd-only，Governed 显式投影为 full/maintenance chain。

### Policy Evidence

- POL-ARCH-001：编排位于 `src/lib/workflow/workflow-runtime.ts`，CLI 未新增决策逻辑。
- POL-COMPAT-001：现有 55 个 productization CLI tests 全部通过。
- POL-TDD-001：先观察 3 个缺失 contract RED，再实施 projector GREEN。

## TASK-003：实现 Active Change 与文档分层

### TDD 证据

- **规格/缺陷/验收:** REQ-003、REQ-004；active change 可从 cache/Standard Change 恢复，歧义阻断，范围四分类与 0/1/完整链 artifact profile 可判定。
- **测试类型:** behavior
- **RED 测试:** `tests/ts/workflow-runtime-active-change.test.mjs`、`tests/ts/workflow-runtime-artifacts.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-active-change.test.mjs tests/ts/workflow-runtime-artifacts.test.mjs`
- **RED 失败:** 5 tests failed with explicit missing store/recovery/scope/profile/renderer contracts.
- **GREEN 变更:** 新增原子 local cache、Standard Change 单文档、恢复优先级/歧义诊断、scope relation 与 artifact profile selector。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-active-change.test.mjs tests/ts/workflow-runtime-artifacts.test.mjs` PASS，5/5。
- **REFACTOR 命令:** `node --test tests/ts/workflow-runtime-active-change.test.mjs tests/ts/workflow-runtime-artifacts.test.mjs tests/ts/document-metadata.test.mjs tests/ts/file-naming.test.mjs tests/ts/docs-index.test.mjs` PASS，18/18。
- **最终验证:** `npm run typecheck` PASS；document metadata、naming、INDEX 回归全部通过。

### Requirement Evidence

- cache 删除后可从唯一 `docs/coding-plugins/changes/<id>/change.md` 重建；两个候选返回 `ACTIVE_CHANGE_AMBIGUOUS`。
- Quick/Standard/Governed 分别映射 zero-flow-doc、one `change.md`、formal chain profile。

### Policy Evidence

- POL-DOC-001：Standard Change 含固定七章节，local runtime state 被 gitignore 且不作为 formal artifact。
- POL-TDD-001：先观察 5 个 missing-contract RED，再完成最小实现和 18 项回归。

## TASK-004：实现版本化三批准点

### TDD 证据

- **规格/缺陷/验收:** REQ-005、MIG-001；governed-v1 DP 语义不变，governed-v2 使用 DP-1 范围、DP-2 技术、DP-3 执行，并以 required bundle hash 检测 stale。
- **测试类型:** contract
- **RED 测试:** `tests/ts/workflow-runtime-decisions.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-decisions.test.mjs tests/ts/productization-cli.test.mjs tests/ts/workflow-state.test.mjs`
- **RED 失败:** 3 tests failed because versioned catalog, semantic bundle hash, ordered v2 approval and stale audit APIs were missing; 56 existing tests remained green.
- **GREEN 变更:** 新增独立 governed-v2 catalog、DecisionRecord v2 fields、稳定 artifact/required Policy hash、批准顺序和 stale audit；v1 records 缺 catalog 时固定解释为 governed-v1。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-decisions.test.mjs tests/ts/productization-cli.test.mjs tests/ts/workflow-state.test.mjs` PASS，59/59。
- **REFACTOR 命令:** `npm run typecheck` PASS；v1/v2 records 共存且旧 state schema 不被 v1 写操作降级。
- **最终验证:** catalog/hash/order/stale 3/3 PASS，既有 productization/workflow-state 56/56 PASS。

### Policy Evidence

- POL-COMPAT-001：旧 DP-2/3/4 名称与作用保持原样，现有 CLI tests 全绿。
- POL-TDD-001：先观察 3 个 v2 contract RED，再实施 catalog/hash/audit GREEN。

## TASK-005：实现 Policy/Skill Resolver

### TDD 证据

- **规格/缺陷/验收:** REQ-006；required/recommended/informative Policy 按项目/路径/风险解析，personal absolute Skill 保持 advisory 且路径不输出。
- **测试类型:** contract
- **RED 测试:** `tests/ts/workflow-runtime-policy-resolver.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-policy-resolver.test.mjs tests/ts/src-architecture.test.mjs`
- **RED 失败:** 4 resolver tests failed because no Policy/Skill resolution contract existed; 5 architecture tests remained green.
- **GREEN 变更:** 新增 JSON-compatible YAML registry loader、appliesWhen glob、source portability/root containment、conflict/missing diagnostics、脱敏 Skill binding 和 required-only hash。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-policy-resolver.test.mjs tests/ts/src-architecture.test.mjs` PASS，9/9。
- **REFACTOR 命令:** `npm run typecheck` PASS；修正 `**/` glob 同时匹配零层和多层目录。
- **最终验证:** resolver 4/4、architecture 5/5、typecheck PASS。

### Policy Evidence

- POL-ARCH-001：resolver 位于 `src/lib/workflow`，registry 为根级机器可读文件。
- POL-DOC-001：required sources 仅接受 repo-relative existent path 或 versioned plugin ref。
- POL-TDD-001：先观察 4 个 missing resolver RED，再完成 GREEN 与 glob 边界修复。

## TASK-006：实现技术批准包与文档契约

### TDD 证据

- **规格/缺陷/验收:** REQ-007；v2 技术批准联合审计 TSD/TVD、required Policy、portable Skill、conflict/source 和 waiver。
- **测试类型:** contract
- **RED 测试:** `tests/ts/workflow-runtime-technical-approval.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-technical-approval.test.mjs tests/ts/document-contract-migration.test.mjs tests/ts/document-metadata.test.mjs tests/ts/skill-document-contract.test.mjs`
- **RED 失败:** 3 new tests failed because audit and governed-v2 template contracts were missing; 12 existing document tests passed.
- **GREEN 变更:** 新增 technical bundle audit、required design/test coverage、portable Skill/waiver/source/conflict blockers 和 approval hash；TSD/TVD/metadata 模板增加 v2 Policy 契约。
- **GREEN 命令:** 同一 targeted command PASS，15/15。
- **REFACTOR 命令:** 将新增 Policy mapping 从表格改为紧凑列表后重跑 15/15 PASS，保持 narrative-first 文档复杂度门禁。
- **最终验证:** `npm run typecheck` PASS；technical approval 3/3、document contracts 12/12 PASS。

### Policy Evidence

- POL-DOC-001：模板增加 `workflow_schema: governed-v2`、Policy-to-Design、Skill plan、TC-POL，同时没有提高允许表格数量。
- POL-TDD-001：先观察 audit/template RED；两项模板复杂度回归失败后保留约束并用列表修复。

## TASK-007：贯通 Policy Coverage 与任务简报

### TDD 证据

- **规格/缺陷/验收:** REQ-008；required Policy 必须覆盖 Design/Test/Task/Evidence，workflow brief 只返回当前 task 的 Policy/Skill。
- **测试类型:** architecture
- **RED 测试:** `tests/ts/workflow-runtime-policy-coverage.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-policy-coverage.test.mjs tests/ts/productization-cli.test.mjs`
- **RED 失败:** 2 tests failed because coverage audit and task-scoped brief fields were missing; 55 existing productization tests passed.
- **GREEN 变更:** 新增 policy coverage graph/audit、task section Policy/Skill extractor、brief JSON/text fields，并扩展 TED/VED 模板的 Policy evidence contract。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-policy-coverage.test.mjs tests/ts/productization-cli.test.mjs tests/ts/document-metadata.test.mjs` PASS，66/66。
- **REFACTOR 命令:** `npm run typecheck` PASS；brief 在无 Policy metadata 的旧 TED 上返回空数组，保持兼容。
- **最终验证:** coverage/brief 2/2、productization 55/55、document metadata 9/9 PASS。

### Policy Evidence

- POL-ARCH-001：coverage 独立于 CLI；brief 只解析当前 task section。
- POL-TDD-001：先观察 2 个 missing coverage/context RED，再完成 GREEN 和 66 项回归。

## TASK-008：实现 Evidence Eligibility 与 Completion

### TDD 证据

- **规格/缺陷/验收:** REQ-009；内容有效性与 formal eligibility 分离，completion 聚合 task/test/Policy/scope/hash/DP/artifact，VED complete 后 workflow 进入 complete。
- **测试类型:** behavior
- **RED 测试:** `tests/ts/workflow-runtime-completion.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-completion.test.mjs tests/ts/workflow-state.test.mjs tests/ts/productization-cli.test.mjs`
- **RED 失败:** 3 tests failed because eligibility fields, completion audit, and complete workflow state were absent; 56 existing tests passed.
- **GREEN 变更:** validator 增加 `content_valid`、`valid_for`、`formal_completion_allowed`；新增 CompletionSummary/audit；workflow-state 支持 complete；CLI evidence root 默认 cwd。
- **GREEN 命令:** 同一 targeted command PASS，59/59。
- **REFACTOR 命令:** `npm run typecheck` PASS；保留 strict tracked ignored evidence 的兼容错误，同时显式表明内容可有效但 formal blocked。
- **最终验证:** completion/eligibility/state 3/3、既有 productization/workflow-state 56/56 PASS。

### Policy Evidence

- POL-TDD-001：先观察 3 个 missing eligibility/completion RED，再完成 GREEN。
- POL-VERIFY-001：完成状态只接受当前输入中的 test/source hash/decision/evidence 结果，不从口头结论推断。

## TASK-009：收敛 CLI/Hook 并完成兼容验证

### TDD 证据

- **规格/缺陷/验收:** REQ-010、MIG-001、OBS-001；`task --contract-version 2` 返回紧凑单决策与结构化 task command，SessionStart 只推荐 `${CP_CLI}` facade，v1 默认保持。
- **测试类型:** contract
- **RED 测试:** `tests/ts/workflow-runtime-cli.test.mjs`、`tests/ts/workflow-runtime-diagnostics.test.mjs`
- **RED 命令:** `node --test tests/ts/workflow-runtime-cli.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs tests/ts/productization-cli.test.mjs tests/ts/manifest-checks.test.mjs`
- **RED 失败:** 3 new CLI/hook tests failed because compact projector, `--contract-version 2`, and SessionStart facade guidance were absent; 64 existing tests passed.
- **GREEN 变更:** task facade 增加 v2 contract、active change/context、structured task command、scope inputs；SessionStart/using skill/migration guide 改用 `${CP_CLI}`；command registry 同步参数。
- **GREEN 命令:** `node --test tests/ts/workflow-runtime-cli.test.mjs tests/ts/workflow-runtime-diagnostics.test.mjs tests/ts/manifest-checks.test.mjs` PASS，12/12；`bash tests/hooks/test-session-start.sh` PASS，5/5。
- **REFACTOR 命令:** `node --test tests/ts/productization-cli.test.mjs` PASS，55/55；`npm run typecheck` PASS。
- **最终验证:** v2 CLI、diagnostics、manifest、hook 与 v1 productization targeted gates 全部 PASS；完整仓库验证见本文最终验证章节。

### Policy Evidence

- POL-ARCH-001：CLI 只解析/渲染，决策、active state、completion 均在 `src/lib`。
- POL-COMPAT-001：默认仍为 v1，55 个 productization tests 全绿；v2 需显式 contract version。
- POL-TDD-001：先观察 3 个 facade RED，再完成 GREEN；dist 并行竞态改为仓库真实串行验证方式。
- POL-VERIFY-001：targeted、hook、typecheck 和 v1 suite 均使用本轮新鲜输出。
- POL-DOC-001：migration guide、using skill、command registry 与 SessionStart guidance 同步。

## Policy Evidence

- POL-ARCH-001：核心模块位于 `src/lib/workflow`，CLI 未承载路由逻辑；`src-architecture.test.mjs` PASS。
- POL-TDD-001：先观察 6 个缺失契约 RED，再完成最小 GREEN 和 architecture REFACTOR 回归。

## 最终验证

- `node --test tests/ts/workflow-runtime-*.test.mjs tests/ts/src-architecture.test.mjs`：PASS，38/38。
- `node --test tests/ts/productization-cli.test.mjs`：PASS，55/55；v1 CLI、DP、document chain、artifact mode、package build 兼容无回归。
- `node bin/coding-plugins.js validate-spec --format json --strict ...-PRD.md`：PASS，0 errors / 0 warnings。
- `node bin/coding-plugins.js validate-technicals --root . --format json --strict ...-TSD.md`：PASS，0 errors / 0 warnings。
- `node bin/coding-plugins.js validate-tdd-evidence --root . --artifact-mode tracked --format json --strict ...-VED.md`：PASS，`content_valid=true`、`formal_completion_allowed=true`。
- `npm test`：PASS；preflight 顺序执行 typecheck、全部 TypeScript tests、package/build checks 和 SessionStart hook，最终输出 `Preflight passed.`。
- Source hash：TED `sha256:a6e90473165f3e9482faf99850729fede37770325f65fc1dde63f2723197af95` 与当前 PRD/TSD/TVD chain hash 一致，`stale=false`。
- Decision gate：DP-1、DP-2、DP-3、DP-4、DP-6、DP-7 已批准；DP-7 授权中文 Conventional Commit、推送、合并到 `main`、创建并推送 `v1.2.0` tag 以及 GitHub Release，不授权 `npm publish`。

## 残余风险

- 兼容期默认 JSON 仍为 v1；v2 通过 `--contract-version 2` opt-in。默认切换和移除 v1 必须另开 release/maintenance change。
- 第一阶段没有实现任意 workflow DSL、长期 specs delta/archive、跨设备 active state 或真实外部插件安装；这些保持 PRD 非目标。
- 本 VED 的实现完成声明不等同于发布完成；commit、push、tag 和 GitHub Release 由独立发布证据确认。
