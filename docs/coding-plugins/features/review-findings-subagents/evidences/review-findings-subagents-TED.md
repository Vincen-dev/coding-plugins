---
title: Review Findings Subagents TED
status: approved
feature: review-findings-subagents
created: 2026-07-04
updated: 2026-07-04
related_docs: []
external_references: []
---
# Review Findings Subagents TED

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
