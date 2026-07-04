---
title: Review Findings Subagents VED
status: approved
feature: review-findings-subagents
created: 2026-07-04
updated: 2026-07-04
related_docs: []
external_references: []
---
# Review Findings Subagents VED

## TDD 证据

- **规格/缺陷/验收:** bug 复现：整体 review 发现 CI 缺 npm 依赖安装、scenario routing 契约未被 preflight 保护、npm 包缺 `.agents/skills`、external reference 检查为 no-op、`.version-bump.json` 仍引用 Python。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/test_npm_package.mjs`、`tests/ts/test_no_python_source.mjs`、`tests/ts/test_preflight_cli.mjs`
- **RED 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/test_npm_package.mjs tests/ts/test_no_python_source.mjs tests/ts/test_preflight_cli.mjs`
- **RED 失败:** 3 failures：`.version-bump.json` 旧 Python 入口、npm package 缺 `.agents/skills`、preflight 未纳入 `tests/ts/test_scenario_routing_contract.mjs`。CI `npm ci` 和 external reference no-op 断言位于同一测试链路中，由后续 GREEN 验证覆盖。
- **GREEN 变更:** workflows 在 preflight 前执行 `npm ci`；`.agents/skills` 改为可打包文本入口；`.version-bump.json` 改为 npm TypeScript 命令；preflight 新增 scenario routing contract 测试；`--check-external-references` 改为扫描 feature 文档 frontmatter 的本机引用；新增缺失 external reference 行为测试。
- **GREEN 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/test_no_python_source.mjs tests/ts/test_npm_package.mjs tests/ts/test_preflight_cli.mjs tests/ts/test_scenario_routing_contract.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm pack --dry-run --json` PASS 且包内包含 `.agents/skills`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --check-external-references` PASS；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS。

## 子代理验证记录

- **Worker A:** 负责 CI、npm package 和版本配置。主线程复验发现真实 `npm pack --dry-run --json` 已包含 `.agents/skills`，说明它没有只改 manifest。
- **Worker B:** 负责 preflight、scenario routing 和 external references。主线程补充了缺失 external reference 行为测试，避免只靠源码字符串断言。
- **Observer:** 指出共享 RED 测试会让单 worker 的 GREEN 受其他任务影响，并要求主线程最终复验 `npm pack` 和完整 preflight。
- **潜在问题:** 子代理容易报告局部 green，但无法证明整体集成；共享测试文件会跨任务耦合；package 行为必须用真实 pack 输出验证；external reference no-op 需要行为测试而非只看日志。

## TDD 证据

- **规格/缺陷/验收:** bug 复现：重新整体 review 发现当前 `main` 复用已发布版本号、`.agents/skills` 文档把文本 fallback 误写成 symlink、CASE-INDEX 只验证存在性、`external_references` 仍需显式参数才检查，且 agent pressure split case 中存在无效 JSON。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/test_npm_package.mjs`、`tests/ts/test_preflight_cli.mjs`、`tests/ts/test_scenario_routing_contract.mjs`
- **RED 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/test_npm_package.mjs`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/test_preflight_cli.mjs`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/test_scenario_routing_contract.mjs`
- **RED 失败:** `INSTALL.md must describe the repository packaged .agents/skills text fallback`；`external reference checks must not be optional only`；`apr-parallel-real-001.json` JSON parse failure。
- **GREEN 变更:** 版本提升到 `1.0.12` 并补 release notes；默认 preflight 执行 `checkExternalReferences()`；`.agents/skills` 文档改为文本入口描述；scenario routing 测试要求 CASE-INDEX 通过关联 scenario 绑定 real-command agent pressure evidence；修复 split case JSON 转义；文档明确 `Node.js >=22.6` 和当前 release workflow 不执行 `npm publish`。
- **GREEN 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/test_npm_package.mjs tests/ts/test_preflight_cli.mjs tests/ts/test_scenario_routing_contract.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`、`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm pack --dry-run --json`、`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run prepare-release:ts -- --notes-out /private/tmp/coding-plugins-release-notes.md`、`git diff --check`。
