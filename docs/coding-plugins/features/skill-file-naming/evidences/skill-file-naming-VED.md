---
title: Skill File Naming VED
status: approved
feature: skill-file-naming
doc_id: skill-file-naming
created: 2026-07-04
updated: 2026-07-04
related_docs: []
external_references: []
---
# Skill File Naming VED

覆盖 REQ-001。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：插件 `skills/` supporting files 应使用可搜索的小写 kebab-case 名称；数字序号式命名和 prompt 模板后缀不一致应被统一规范。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/file-naming.test.mjs`
- **RED 命令:** `node --test tests/ts/file-naming.test.mjs`
- **RED 失败:** 新测试列出 `skills/systematic-debugging/CREATION-LOG.md`、`test-pressure-1.md`、`test-pressure-2.md`、`test-pressure-3.md` 和 `skills/writing-skills/examples/CLAUDE_MD_TESTING.md`，证明当前命名契约未满足。
- **GREEN 变更:** 将异常文件重命名为 `skill-creation-log.md`、`concept-check.md`、`pressure-scenario-flaky-ci.md`、`pressure-scenario-signing-chain.md`、`pressure-scenario-repeated-patches.md`、`claude-md-testing.md`；将代码评审 prompt 模板统一为 `code-reviewer-prompt.md` 并同步 builder 和 skill 引用；新增命名契约测试并接入 preflight 防回归。
- **GREEN 命令:** `node --test tests/ts/file-naming.test.mjs`
- **REFACTOR 命令:** `node --test tests/ts/file-naming.test.mjs tests/ts/agent-pressure-harness.test.mjs tests/ts/skill-script-ownership.test.mjs`；`npm run typecheck`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS。

## TDD 证据

- **规格/缺陷/验收:** 明确验收：全仓内部路径统一使用 kebab-case；`tests/ts` 测试文件不再使用 `test_*.mjs` snake_case 命名，改为 `*.test.mjs`。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/file-naming.test.mjs`
- **RED 命令:** `node --test tests/ts/file-naming.test.mjs`
- **RED 失败:** 扩展后的全仓命名测试列出 13 个 `tests/ts/test_*.mjs` 文件，证明测试层命名仍未纳入统一规范。
- **GREEN 变更:** 将 `tests/ts/test_*.mjs` 批量重命名为 `tests/ts/*.test.mjs`；同步 preflight、manifest checks、agent pressure fixture、workflow docs、CASE index 和历史 evidence 中的测试路径；命名契约扩展为检查文件和目录路径。
- **GREEN 命令:** `node --test tests/ts/file-naming.test.mjs`；`node --test tests/ts/preflight-cli.test.mjs tests/ts/manifest-checks.test.mjs tests/ts/agent-pressure-harness.test.mjs`
- **REFACTOR 命令:** `rg -n "test_[a-z0-9_]+\\.mjs|tests/ts/test_" . -g '!node_modules/**' -g '!.git/**' -g '!docs/coding-plugins/features/skill-file-naming/evidences/skill-file-naming-VED.md'`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS，包含 `tests/ts/file-naming.test.mjs` PASS。
