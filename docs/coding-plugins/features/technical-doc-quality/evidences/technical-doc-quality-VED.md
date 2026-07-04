---
title: Technical Doc Quality VED
status: approved
feature: technical-doc-quality
doc_id: technical-doc-quality
created: 2026-07-04
updated: 2026-07-04
related_docs: []
external_references: []
---
# Technical Doc Quality VED

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
