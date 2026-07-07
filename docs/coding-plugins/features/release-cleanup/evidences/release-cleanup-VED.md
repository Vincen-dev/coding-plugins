---
title: 正式发布优化验证证据
status: approved
feature: release-cleanup
doc_id: release-cleanup
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/release-cleanup/requirements/release-cleanup-PRD.md
  - docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md
  - docs/coding-plugins/features/release-cleanup/test-cases/release-cleanup-TVD.md
  - docs/coding-plugins/features/release-cleanup/plans/release-cleanup-TED.md
external_references: []
---

# 正式发布优化验证证据（VED）

## 阅读摘要

- **本文结论:** 正式发布优化已完成 TASK-001 到 TASK-005 的 RED/GREEN/REFACTOR 证据记录；当前验证证明发布包不再包含 broad `src/`、`docs/`、`tests/`，真实 pack 输出通过 policy/security audit，隔离 tarball 安装后可运行。
- **当前状态:** approved。
- **先读重点:** 先看各任务的 TDD 证据，再看最终验证和残余风险。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | release-cleanup |
| Doc ID | release-cleanup |
| 文档类型 | VED |
| 缩写含义 | Validation Evidence Document |

## 任务 1：建立 package policy 和 allowlist RED 契约

### TDD 证据

- **规格/缺陷/验收:** REQ-001；正式发布包边界必须集中定义，禁止 broad `src/`、`docs/`、`tests/` 进入 `package.json.files` 或 manifest policy。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/npm-package.test.mjs`
- **RED 命令:** `node --test tests/ts/npm-package.test.mjs`
- **RED 失败:** 1 failure：`package.json files must not include broad development entry: src/`，证明旧 `package.json.files` 仍发布 broad development entry。
- **GREEN 变更:** 新增 `src/lib/release/package-policy.ts`；`manifest-checks` 改为复用 policy；`package.json.files` 移除 `src/`、`docs/`、`tests/` broad entries；fixture 改用 `dist` runtime 文件。
- **GREEN 命令:** `node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs` PASS，19/19。
- **REFACTOR 命令:** `npm run build` PASS，用于同步 `dist` runtime。
- **最终验证:** package policy 覆盖 runtime files、user docs、platform files、allowed entries、denied broad entries 和 pack path audit。

## 任务 2：接入真实 pack denylist 和 security audit

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002；真实 `npm pack --dry-run --json` 输出必须经过 allowlist/denylist 和 security audit 检查。
- **测试类型:** `contract` / `integration`
- **RED 测试:** `tests/ts/npm-package.test.mjs` 中 `security audit fails real npm pack output that contains internal development content`
- **RED 命令:** `node --test tests/ts/npm-package.test.mjs`
- **RED 失败:** 1 failure：临时包包含 `docs/coding-plugins/features/release-cleanup/internal.md` 时旧 `security-audit` 仍返回 exit 0。
- **GREEN 变更:** `security-audit` 接入 `auditPackedFilePaths` 并输出 `pack-policy` 检查；package policy 增加 `not_allowed`、`denied_dev_content`、`missing_required_runtime`、`missing_user_doc`、`env_file` 分类；排除 `skills/**/scripts/fixtures`。
- **GREEN 命令:** `node --test tests/ts/npm-package.test.mjs` PASS，16/16。
- **REFACTOR 命令:** `npm run security-audit:ts -- --root . --format json` PASS，`pack-policy`、`pack-secrets`、`env-files` 均为 ok。
- **最终验证:** 真实 pack 输出满足 release package policy，且含 internal docs 的 fixture 会被 `pack-policy` 拒绝。

## 任务 3：强化隔离 tarball 安装 smoke 和 runtime 独立性

### TDD 证据

- **规格/缺陷/验收:** REQ-003；正式发布候选 tarball 在隔离目录安装后必须不依赖仓库-only 文件。
- **测试类型:** `integration`
- **RED 测试:** `tests/ts/npm-package.test.mjs` 中 `packed npm artifact supports installed runtime commands without repository-only files`
- **RED 命令:** `node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs`
- **RED 失败:** 1 failure：安装包内 `npm run build` 报错 `Unable to locate coding-plugins repository root`，因为 packaged install 不包含 `src/`。
- **GREEN 变更:** `src/cli/release/build-dist.ts` 支持源码仓库根和 packaged runtime 根双模式解析；安装烟测断言无 `src`、`tests`、内部 feature docs、skill fixtures，并运行 `bin/coding-plugins.js --help`、`npm run build`、`coding-plugins manifest-check --root <installedPackage>`。
- **GREEN 命令:** `node --test tests/ts/npm-package.test.mjs` PASS，16/16。
- **REFACTOR 命令:** `npm run build` PASS，同步 build script 编译产物。
- **最终验证:** 隔离 tarball install、bin help、build fallback 和 manifest smoke 均通过。

## 任务 4：收紧发布包内容并保护中文用户文档

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-004；发布包收紧不能删除中文用户入口文档，也不能破坏 English agent-facing skill 表面。
- **测试类型:** `contract` / `i18n`
- **RED 测试:** TASK-001/TASK-002 RED 已暴露 broad package entries 和内部 docs/fixture 发布问题。
- **RED 命令:** `node --test tests/ts/npm-package.test.mjs`
- **RED 失败:** `src/` broad entry、security audit 未拦截 internal docs、skill fixtures 进入真实 pack 输出。
- **GREEN 变更:** `package.json.files` 保留 `README.md`、`INSTALL.md`、`SECURITY.md`、`LICENSE`、`RELEASE-NOTES.md` 和 platform/skills/runtime 入口；移除 broad source/docs/tests；增加 fixture exclusions。
- **GREEN 命令:** `node --test tests/ts/i18n-surface.test.mjs tests/ts/npm-package.test.mjs` PASS，21/21。
- **REFACTOR 命令:** `npm run build` PASS。
- **最终验证:** 中文用户入口、English distribution copy、packaged agent docs 命名和收紧后的 npm package policy 同时通过。

## 任务 5：更新索引、VED 和完成总体验证

### TDD 证据

- **规格/缺陷/验收:** REQ-001, REQ-002, REQ-003, REQ-004；文档索引、VED 和总体验证必须闭环。
- **测试类型:** `contract`
- **RED 测试:** `npm run preflight -- --write-index`
- **RED 命令:** `npm run preflight -- --write-index`
- **RED 失败:** `TDD evidence validation failed: Missing TDD 证据 or TDD 例外记录 section`，证明 VED 还没有满足验证证据结构。
- **GREEN 变更:** 补全本 VED 的 TASK-001 到 TASK-005 TDD 证据；修正 TSD schema 章节为 `规格到设计映射`；刷新 TED `source_hash` 为 `sha256:ea2f6c3fc2176c883ec90e7af7119b01378271d97d7cd834f3ad7a0fc2b68797`；重新生成索引并让 Evidence 指向 `release-cleanup-VED.md`。
- **GREEN 命令:** `npm run preflight -- --write-index` PASS。
- **REFACTOR 命令:** `npm run preflight` PASS。
- **最终验证:** `workflow-state inspect` 显示 `stale=false`；doctor、preflight write-index 和普通 preflight 均通过。

## 最终验证

- `node --test tests/ts/manifest-checks.test.mjs tests/ts/npm-package.test.mjs tests/ts/i18n-surface.test.mjs` PASS，26/26。
- `npm run validate-spec:ts -- --format json --strict docs/coding-plugins/features/release-cleanup/requirements/release-cleanup-PRD.md` PASS，0 errors，0 warnings。
- `npm run validate-technicals:ts -- --root . --format json --strict docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md` PASS，0 errors，0 warnings。
- `npm run security-audit:ts -- --root . --format json` PASS，`pack-policy`、`pack-secrets`、`env-files` ok。
- `npm run preflight -- --write-index` 初次 FAIL，原因是本 VED 缺少 TDD 证据章节；已在 TASK-005 记录为 RED。
- `node ./bin/coding-plugins.js workflow-state inspect --feature release-cleanup --doc-id release-cleanup --json` PASS，`stale=false`。
- `node bin/coding-plugins.js doctor --root . --format json` PASS，`document-schema` ok。
- `npm run preflight -- --write-index` PASS。
- `npm run preflight` PASS。

## 残余风险

- 未执行真实 `npm publish`、GitHub Release、tag 或版本提升；这些动作仍需单独 DP-6/DP-7 批准。
- 当前 release workflow 继续保持不自动 `npm publish`，发布仍是 manual-only-after-security-audit。
