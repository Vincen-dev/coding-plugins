---
title: Skill 国际化优化验证证据
status: approved
feature: skill-internationalization
doc_id: skill-internationalization
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md
  - docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md
  - docs/coding-plugins/features/skill-internationalization/test-cases/skill-internationalization-TVD.md
  - docs/coding-plugins/features/skill-internationalization/plans/skill-internationalization-TED.md
external_references: []
---

# Skill 国际化优化验证证据（VED）

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | skill-internationalization |
| Doc ID | skill-internationalization |
| 文档类型 | VED |
| 缩写含义 | Validation Evidence Document |

本文记录 skill 国际化优化的 RED/GREEN/REFACTOR 证据。DP-6 完成验证确认后，本文件作为提交前验证证据使用。

## 任务 1：建立 i18n surface 语言边界测试

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-004；agent-facing skill surface 必须默认英文，中文用户入口必须继续保留，且语言边界需要自动化门禁。
- **测试类型:** `config`
- **RED 测试:** `tests/ts/i18n-surface.test.mjs`
- **RED 命令:** `node --test tests/ts/i18n-surface.test.mjs`
- **RED 失败:** 1 failure：`REQ-002 agent-facing skill surface defaults to English` 报告 46 个 agent-facing 文件中仍有 1856 行未授权中文；`REQ-001 Chinese user entrypoints remain localized` 未失败，说明 RED 来自英文执行面缺口而不是中文入口被误伤。
- **GREEN 变更:** 待 TASK-002/TASK-003 迁移 skill、prompt、agent metadata 和分发入口文案后记录。
- **GREEN 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3。
- **REFACTOR 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3。
- **最终验证:** TASK-001 source-scan 门禁已可稳定检测并通过当前 agent-facing surface；同一测试文件也覆盖中文用户入口与分发入口英文一致性。

## 任务 2：迁移 skill、prompt 和 agent metadata 为英文执行面

### TDD 证据

- **规格/缺陷/验收:** REQ-002；agent-facing `skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml` 必须默认英文。
- **测试类型:** `source-scan`
- **RED 测试:** `tests/ts/i18n-surface.test.mjs`
- **RED 命令:** `node --test tests/ts/i18n-surface.test.mjs`
- **RED 失败:** 初始 RED 报告 46 个 agent-facing 文件中仍有 1856 行未授权中文；压缩输出后仍报告 12 个未迁移 `SKILL.md` 中 1138 行未授权中文。
- **GREEN 变更:** 翻译全部 blocked skill 执行面：`skills/*/SKILL.md`、`skills/**/*-prompt.md` 和 `skills/*/agents/openai.yaml`；保留技能名、CLI 命令、Spec/TDD/SDD/TED/VED/DP 等技术术语，并把中文用户入口留在 README/INSTALL。
- **GREEN 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3。
- **REFACTOR 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3。
- **最终验证:** i18n surface source-scan PASS；中文用户入口测试 PASS。

## 任务 3：统一跨平台分发入口文案

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-003；Codex、Claude Code、Gemini、本地 skills 和 package metadata 必须一致表达 Chinese-first 用户定位与 English agent-facing skill surface。
- **测试类型:** `config`
- **RED 测试:** `tests/ts/i18n-surface.test.mjs`
- **RED 命令:** `node --test tests/ts/i18n-surface.test.mjs`
- **RED 失败:** `REQ-003 distribution copy is English and consistent across platforms` 报告 4 个分发表面文件中有 33 行中文残留，集中在 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`GEMINI.md` 和 `hooks/session-start-codex`。
- **GREEN 变更:** 统一 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、`plugin.json`、`gemini-extension.json`、`package.json`、`GEMINI.md` 和 `hooks/session-start-codex` 的英文分发文案，明确包含 `Chinese-first` 与 `English agent-facing` 定位；修正 hook evidence 路径为 VED。
- **GREEN 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3；`node --test tests/ts/manifest-checks.test.mjs` PASS，5/5。
- **REFACTOR 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3；`node --test tests/ts/manifest-checks.test.mjs` PASS，5/5。
- **最终验证:** 分发入口 source-scan 与 manifest 契约均通过。

## 任务 4：保护中文工作流兼容区

### TDD 证据

- **规格/缺陷/验收:** REQ-005；国际化不能破坏中文 PRD/TSD/TVD/TED/VED 文档契约、中文 fixtures、scenario routing 和中文用户入口。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/scenario-routing-contract.test.mjs`
- **RED 命令:** `node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs`
- **RED 失败:** 初次回归 2 failures：测试仍硬编码中文 `using-coding-plugins` 门禁文案，并且 `document-metadata` / `writing-skills` 在英文入口 skill 中不可发现。
- **GREEN 变更:** 将 scenario routing 测试改为检查等价英文门禁；在 `using-coding-plugins` 路由中补齐 `document-metadata`、`dispatching-parallel-agents` 和 `writing-skills` discoverability，避免国际化削弱技能入口。
- **GREEN 命令:** `node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs` PASS，15/15。
- **REFACTOR 命令:** `node --test tests/ts/i18n-surface.test.mjs` PASS，3/3；`node --test tests/ts/document-metadata.test.mjs tests/ts/scenario-routing-contract.test.mjs tests/ts/formal-fixture-document-quality.test.mjs` PASS，15/15。
- **最终验证:** 中文兼容区回归通过，且 i18n source-scan 仍通过。

## 任务 5：更新索引并完成总体验证

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005；新增 i18n 门禁必须进入 preflight 可发现测试，文档索引必须包含 PRD/TSD/TVD/TED/VED 链路，最终验证必须明确剩余风险。
- **测试类型:** `contract`
- **RED 测试:** `npm run preflight -- --write-index`
- **RED 命令:** `npm run preflight -- --write-index`
- **RED 失败:** 首次运行在 VED 严格校验失败：source-scan evidence 被用于用户入口定位且 RED 描述包含非失败断言；修正后继续暴露翻译导致的 agent-pressure、git-commit 和 runtime fallback 测试耦合，均已逐项修复。
- **GREEN 变更:** 更新 `docs/coding-plugins/INDEX.md`，补齐 VED；修复 `agent-pressure-harness` 对中文 fixture heading 的硬编码，扩展 `subagent-prompt-builder` 支持英文 prompt 占位符并同步 dist；更新 `git-commit-skill` 和 `scenario-routing-contract` 测试为英文等价契约；补回 `test-driven-development` 的 `CP_CLI` fallback 文案。
- **GREEN 命令:** `node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-spec docs/coding-plugins/features/skill-internationalization/requirements/skill-internationalization-PRD.md --format json` PASS；`node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-technicals --root . --format json --strict docs/coding-plugins/features/skill-internationalization/technicals/skill-internationalization-TSD.md` PASS；`node --test tests/ts/i18n-surface.test.mjs tests/ts/manifest-checks.test.mjs tests/ts/docs-index.test.mjs` PASS，10/10；`node /Users/vincen/.codex/plugins/cache/coding-plugins/coding-plugins/1.0.19/bin/coding-plugins.js validate-tdd-evidence --root . --artifact-mode tracked docs/coding-plugins/features/skill-internationalization/evidences/skill-internationalization-VED.md --format json` PASS，0 warnings；`node --test tests/ts/agent-pressure-harness.test.mjs` PASS，1/1；`node --test tests/ts/git-commit-skill.test.mjs` PASS，2/2。
- **REFACTOR 命令:** `npm run build` PASS；`npm run preflight -- --write-index` rerun reaches productization CLI and all i18n-related checks pass before the known productization failures.
- **最终验证:** `git diff --check` PASS；`node --test tests/ts/i18n-surface.test.mjs tests/ts/manifest-checks.test.mjs tests/ts/docs-index.test.mjs` PASS，10/10；`npm run preflight -- --write-index` reached `tests/ts/productization-cli.test.mjs` and exposed 5 productization CLI failures. These failures were initially recorded as residual risk and later fixed in任务 6。

## 任务 6：修复 productization CLI 残留失败

### TDD 证据

- **规格/缺陷/验收:** Bug reproduction；`npm run preflight -- --write-index` 不应因共享 session-lock、TSD schema 口径不一致或 Codex doctor 前置失败而阻塞 productization CLI。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs`
- **RED 命令:** `node --test --test-name-pattern "schema validate/list/doctor/inject CLIs support arbitrary project roots|doctor audits plugin repository wiring|cli install creates a user shim|doctor checks active Codex plugin enablement|doctor times out Codex plugin list" tests/ts/productization-cli.test.mjs`
- **RED 失败:** 5 failures：`doctor` 在 repo/fixture root 读取旧 `.coding-plugins/session-lock.json` 后返回 `recommended_action=repair-session-lock`；`cli install` status 期望 `none` 但得到 `repair-session-lock`；`doctor` schema 报 `skill-internationalization TED source_hash is stale`；Codex plugin enablement 两个用例被 `doctor` exit 1 前置阻断。
- **GREEN 变更:** productization CLI 测试改用隔离 fixture root 和 isolated `cli status --root`；`doctor` 调用 `cliStatus` 时显式跳过跨会话 thread id 校验但仍检查 plugin version、plugin root 和 CLI path；修正 TSD 标准章节名并刷新 TED `source_hash`；同步 dist runtime。
- **GREEN 命令:** `node --test --test-name-pattern "schema validate/list/doctor/inject CLIs support arbitrary project roots|doctor audits plugin repository wiring|cli install creates a user shim|doctor checks active Codex plugin enablement|doctor times out Codex plugin list" tests/ts/productization-cli.test.mjs` PASS，5/5。
- **REFACTOR 命令:** `npm run build` PASS。
- **最终验证:** `node --test tests/ts/productization-cli.test.mjs` PASS，54/54；`bash tests/hooks/test-session-start.sh` PASS；`npm run preflight -- --write-index` PASS。
