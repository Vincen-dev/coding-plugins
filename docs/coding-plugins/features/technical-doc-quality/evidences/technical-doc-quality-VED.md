---
title: Technical Doc Quality VED
status: approved
feature: technical-doc-quality
doc_id: technical-doc-quality
created: 2026-07-04
updated: 2026-07-06
related_docs: []
external_references: []
---
# Technical Doc Quality VED

覆盖 REQ-001。

## TDD 证据

- **规格/缺陷/验收:** P0 验收要求将 DP-0 到 DP-7 做成可执行决策点，提供 `coding-plugins dp status|request|approve|audit`；正式链路输出当前 DP、所需确认和被阻止动作；DP-4 未批准禁止执行，DP-6/DP-7 未批准禁止提交、tag、发布。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs` 中的 `task status is the unified workflow entrypoint for executable document work`、`dp CLI requests, approves, audits, and unblocks executable task status` 和 `dp audit blocks commit and release targets until DP-6 and DP-7 are approved`。
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`
- **RED 失败:** `task status` 没有 `decision_status` 字段，`dp` 子命令返回 `Unknown command: dp`。
- **GREEN 变更:** 新增 `.coding-plugins-decisions.json` 决策点状态、`dp status/request/approve/audit` CLI、DP-4 execute audit 和 DP-6/DP-7 commit/tag/release/publish audit；`task status` 在 DP-4 未批准时输出 `request-decision:DP-4` 并阻断 execute/brief；修正 npm 包边界，确保 dist registry 进入安装包。
- **GREEN 命令:** `npm run typecheck`；`npm run build`；`node --test tests/ts/productization-cli.test.mjs`
- **REFACTOR 命令:** `node --test tests/ts/npm-package.test.mjs`
- **最终验证:** `npm run preflight` PASS。

## TDD 证据

- **规格/缺陷/验收:** P0 验收要求强化 full-chain / maintenance-chain 执行门禁：没有 approved PRD/TSD/TVD/TED 时不允许进入实现；public API、schema、generator、release、dependency、SDK 兼容窗口等变更默认进入 full-chain 或 maintenance-chain；发现实现状态早于 TSD/TVD/TED 正式批准时标记 workflow violation。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs` 中的 `schema validate reports workflow violations when formal execution artifacts are not approved`、`schema validate reports workflow violations when implementation is marked before downstream planning is approved` 和 `workflow mode routes dependency SDK release work to the maintenance chain`。
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`
- **RED 失败:** 前两个 validate 测试失败于 `chain.workflow_violations` 不存在；workflow mode 测试失败于英文 dependency / SDK / release 维护风险被判为 `full-chain` 而不是 `maintenance-chain`。
- **GREEN 变更:** `validateDocumentChains()` 为每条链输出 `workflow_violations`，并把未 approved 的 PRD/TSD/TVD/TED、implemented TSD 下游仍未批准的情况并入 `chain_errors`；`workflow-mode` 增加 dependency、SDK、release、generator 等维护风险关键词和原因文本。
- **GREEN 命令:** `npm run build`；`node --test tests/ts/productization-cli.test.mjs`
- **REFACTOR 命令:** `npm run typecheck`；`git diff --check`
- **最终验证:** `npm run preflight` PASS。

## TDD 证据

- **规格/缺陷/验收:** P0 验收要求新增 `coding-plugins task start|continue|status` 统一入口，合并 mode、文档链状态、guard、brief、下一步和动作边界；输出必须包含 `mode`、`feature`、`doc_id`、`state`、`allowed_actions`、`blocked_actions`、`next_skill`、`decision_point`。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs` 中的 `task status is the unified workflow entrypoint for executable document work` 和 `task start blocks execution when a document chain has not been started`。
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`
- **RED 失败:** 两个新测试均失败于 `Unknown command: task`，证明 CLI 注册表尚未提供统一任务入口。
- **GREEN 变更:** 新增 `src/lib/workflow/task-status.ts` 聚合 mode、`workflow-state`、`workflow-guard` 和 `workflow-brief`；新增 `src/cli/task.ts`、`src/cli/workflow/task.ts` 并注册 `task start|continue|status`；README、INSTALL、`using-coding-plugins` 和 P0 清单改为以 `task status/start` 为主入口。
- **GREEN 命令:** `npm run typecheck`；`npm run build`；`node --test tests/ts/productization-cli.test.mjs`
- **REFACTOR 命令:** `node --test tests/ts/scenario-routing-contract.test.mjs`
- **最终验证:** `npm run preflight` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：`writing-technicals` 生成的 TSD 不能保留模板残留文本。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/document-metadata.test.mjs` 中的 `TypeScript technical validator rejects unfinished template content in TSD`
- **RED 命令:** `node --test tests/ts/document-metadata.test.mjs`
- **RED 失败:** 新测试构造了包含模板残留文本的 TSD，但 strict technical validation 返回 `ok: true`。
- **GREEN 变更:** `src/lib/validate-technicals.ts` 新增 unfinished template content 检查，并在 TSD strict validation 中执行。
- **GREEN 命令:** `node --test tests/ts/document-metadata.test.mjs`
- **REFACTOR 命令:** `npm run validate-technicals:ts -- --strict`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：`technical-design-document` 模板正文应避免表格滥用，文档关系必须留在 metadata/INDEX，不应在正文重复维护下游路径。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/document-metadata.test.mjs` 中的 `technical design template keeps relations in metadata and avoids table-heavy body`
- **RED 命令:** `node --test tests/ts/document-metadata.test.mjs`
- **RED 失败:** 新测试发现模板正文表格数量超过门禁，且正文仍包含下游文档路径。
- **GREEN 变更:** 重写 `technical-design-document.md` 正文结构，仅保留规格映射和关键决策两类矩阵；文档信息、缺口审查、实现交接、影响组件、测试策略、风险改为段落或清单；正文只说明关系源，不重复路径清单。
- **GREEN 命令:** `node --test tests/ts/document-metadata.test.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：`writing-technicals` 默认只生成一份 `<doc-id>-TSD.md` 技术方案，TVD/TED/VED 的必需上游为 PRD/TSD。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/document-metadata.test.mjs` 中的 artifact sync dependency expectations；`tests/ts/scaffold-fixture-case.test.mjs` 中的 no generated old technical assertion。
- **RED 命令:** `node --test tests/ts/document-metadata.test.mjs`；`node --test tests/ts/scaffold-fixture-case.test.mjs`
- **RED 失败:** metadata 同步链仍要求 TVD/TED/VED 依赖旧技术实现；scaffold fixture 仍生成旧技术实现文档。
- **GREEN 变更:** 将正式链路收敛为 `PRD -> TSD -> TVD -> TED -> VED`；`workflow-state`、`workflow-guard`、`scaffold-fixture-case` 不再要求旧技术实现；`writing-technicals` 和技术方案模板改为单文档主线；下游 `writing-test-cases`、`writing-plans`、metadata 模板、CASE 索引和 workflow 文档同步到 TSD 技术方案文档。
- **GREEN 命令:** `node --test tests/ts/document-metadata.test.mjs tests/ts/scaffold-fixture-case.test.mjs tests/ts/agent-pressure-harness.test.mjs tests/ts/scenario-routing-contract.test.mjs`
- **REFACTOR 命令:** `npm run typecheck`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index` PASS；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS；`git diff --check` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：技术方案文档缩写为 TSD，默认路径为 `technicals/<doc-id>-TSD.md`。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/document-metadata.test.mjs` 中的 artifact suffix expectations；`tests/ts/scaffold-fixture-case.test.mjs` 中的 generated TSD/no generated old technical assertions；`tests/ts/docs-index.test.mjs` 中的 TSD index row assertion。
- **RED 命令:** `node --test tests/ts/document-metadata.test.mjs`；`node --test tests/ts/scaffold-fixture-case.test.mjs`；`node --test tests/ts/docs-index.test.mjs`
- **RED 失败:** artifact registry 不包含 `TSD`；scaffold 仍生成旧技术方案文档；INDEX 仍按旧技术方案文档查找技术方案。
- **GREEN 变更:** 新增 TSD artifact 并设为正式技术方案文档；`workflow-state`、`workflow-guard`、`docs-index`、`scaffold-fixture-case`、technical validator、模板、fixture、scenario routing 和下游技能全部改用 TSD。
- **GREEN 命令:** `node --test tests/ts/document-metadata.test.mjs tests/ts/scaffold-fixture-case.test.mjs tests/ts/docs-index.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/agent-pressure-harness.test.mjs tests/ts/document-contract-migration.test.mjs`
- **REFACTOR 命令:** `npm run typecheck`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：正式文档链路缩写调整为 `PRD -> TSD -> TVD -> TED -> VED`；TVD 是测试用例文档，TED 是 Task Execution Document / 任务执行文档，VED 是证据文档。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/document-metadata.test.mjs` 中的 artifact suffix/sync expectations；`tests/ts/scaffold-fixture-case.test.mjs` 中的 generated TVD/TED/VED assertions；`tests/ts/docs-index.test.mjs` 中的 TVD index assertion。
- **RED 命令:** `node --test tests/ts/document-metadata.test.mjs tests/ts/scaffold-fixture-case.test.mjs tests/ts/docs-index.test.mjs`
- **RED 失败:** registry 仍使用旧测试用例、计划和证据后缀；scaffold 仍生成旧测试用例、计划和证据文档；INDEX 仍按旧测试用例后缀查找。
- **GREEN 变更:** `document-metadata`、`workflow-state`、`workflow-guard`、`docs-index`、`scaffold-fixture-case`、`subagent-prompt-builder`、`agent-pressure-harness`、场景路由、技能模板和 fixtures 全部迁移到 `TVD/TED/VED`；重命名正式 fixture 文件并重算 TED `source_hash`。
- **GREEN 命令:** `node --test tests/ts/document-metadata.test.mjs tests/ts/scaffold-fixture-case.test.mjs tests/ts/docs-index.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/agent-pressure-harness.test.mjs tests/ts/document-contract-migration.test.mjs`
- **REFACTOR 命令:** `npm run typecheck`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index`
- **最终验证:** `npm run typecheck` PASS；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index` PASS；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS；`git diff --check` PASS。

## TDD 证据

- **规格/缺陷/验收:** 用户明确要求相关 skill 同步更新，不保留旧契约；`skills/` 对外指令只能描述当前 `PRD -> TSD -> TVD -> TED -> VED` 链路，不再教代理读取或创建旧链路。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/skill-document-contract.test.mjs`
- **RED 命令:** `node --test tests/ts/skill-document-contract.test.mjs`
- **RED 失败:** 新测试发现 `skills/document-metadata`、`using-coding-plugins`、`writing-technicals`、`writing-test-cases` 和 `writing-plans` 仍包含旧链路表达、旧 `related_*` 字段或旧文档后缀。
- **GREEN 变更:** 清理 skill 文本中的旧契约说明，只保留 `related_docs` 和当前 `PRD/TSD/TVD/TED/VED` 链路；将 `skill-document-contract.test.mjs` 接入 preflight。
- **GREEN 命令:** `node --test tests/ts/skill-document-contract.test.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS，包含 `tests/ts/skill-document-contract.test.mjs` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：runtime 文档链路状态必须复用 `src/lib/document-metadata.ts` 的 artifact registry 和 frontmatter parser；preflight 必须自动发现 `tests/ts/*.test.mjs`，避免新增门禁测试漏跑。
- **测试类型:** `architecture`
- **RED 测试:** `tests/ts/workflow-state.test.mjs`；`tests/ts/preflight-cli.test.mjs` 中的 `TypeScript preflight discovers TypeScript test files instead of hard-coding the suite`
- **RED 命令:** `node --test tests/ts/workflow-state.test.mjs`；`node --test tests/ts/preflight-cli.test.mjs`
- **RED 失败:** `workflow-state` 测试发现源码仍声明本地 `splitFrontmatter` / frontmatter line parser；preflight 测试发现源码仍硬编码具体测试文件数组。
- **GREEN 变更:** `src/lib/workflow-state.ts` 改为通过 `artifactFile` 和 `parseFrontmatter` 复用 `document-metadata`；`src/cli/preflight.ts` 新增 `collectTypeScriptTestFiles()` 自动扫描 `tests/ts/*.test.mjs`。
- **GREEN 命令:** `node --test tests/ts/workflow-state.test.mjs`；`node --test tests/ts/preflight-cli.test.mjs`；`node --test tests/ts/scaffold-fixture-case.test.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS；`git diff --check` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：formal feature-chain fixtures 也必须遵守 metadata-first 和可读性规则，正文需要 `## 阅读摘要`，且不得重复完整 `docs/coding-plugins/features/...` 文档路径。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/formal-fixture-document-quality.test.mjs`
- **RED 命令:** `node --test tests/ts/formal-fixture-document-quality.test.mjs`
- **RED 失败:** 新测试列出 4 条 fixture 链路中的 VED/TSD/TVD/TED 缺少阅读摘要，PRD/TSD/TVD/TED 正文重复完整 VED 路径。
- **GREEN 变更:** 为 formal fixture 的 TSD/TVD/TED/VED 补充阅读摘要，把正文中的完整 VED 路径改为“同一 `doc_id` 的 VED”，并按上游变更重算 4 份 TED 的 `source_hash`。
- **GREEN 命令:** `node --test tests/ts/formal-fixture-document-quality.test.mjs`；`node --test tests/ts/scenario-routing-contract.test.mjs`；`node --test tests/ts/scaffold-fixture-case.test.mjs`
- **REFACTOR 命令:** `node --test tests/ts/agent-pressure-harness.test.mjs`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS；`git diff --check` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：Codex marketplace 安装后，即使 `coding-plugins` 不在 PATH，SessionStart 也必须给 Agent 暴露可执行的 `CP_CLI` fallback；用户需要终端快捷命令时，CLI 必须能显式安装和卸载 shim，且不能静默覆盖或删除非本插件 shim。
- **测试类型:** `contract`
- **RED 测试:** `tests/hooks/test-session-start.sh` 中的 SessionStart context assertions；`tests/ts/productization-cli.test.mjs` 中的 `cli status reports fallback command when coding-plugins is not on PATH`、`cli install creates a user shim that runs the packaged CLI`、`cli uninstall removes only the current coding-plugins shim`。
- **RED 命令:** `bash tests/hooks/test-session-start.sh`；`node --test tests/ts/productization-cli.test.mjs`
- **RED 失败:** SessionStart 输出缺少 `CP_CLI`、`bin/coding-plugins.js` 和“无需安装全局 coding-plugins 命令”；`productization-cli` 中 `cli` 子命令返回 `Unknown command: cli`，无法提供 status/install/uninstall。
- **GREEN 变更:** 新增 `src/lib/runtime/cli-shim.ts` 和 `src/cli/cli.ts`，提供 `cli status|install|uninstall`；SessionStart 根据 `PLUGIN_ROOT` 注入 `CP_CLI`；README/INSTALL/skills/platform instructions 改为优先使用 `CP_CLI`，需要终端快捷命令时再显式安装 shim。
- **GREEN 命令:** `bash tests/hooks/test-session-start.sh`；`node --test tests/ts/productization-cli.test.mjs`
- **REFACTOR 命令:** `npm run typecheck`
- **最终验证:** `npm run preflight` PASS。
