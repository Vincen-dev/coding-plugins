---
title: 正式发布优化测试用例
status: approved
feature: release-cleanup
doc_id: release-cleanup
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/release-cleanup/requirements/release-cleanup-PRD.md
  - docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md
  - docs/coding-plugins/features/release-cleanup/plans/release-cleanup-TED.md
  - docs/coding-plugins/features/release-cleanup/evidences/release-cleanup-VED.md
---

# 正式发布优化测试用例

## 阅读摘要

- **本文结论:** 测试设计覆盖 REQ-001 到 REQ-004 的全部 MUST 规格，核心验证链路是 package policy 契约测试、真实 `npm pack` denylist 扫描、release security audit、隔离 tarball 安装 smoke、中文用户文档保留检查和最终 preflight 集成。
- **当前状态:** 已批准，进入任务执行文档阶段。
- **先读重点:** 先看测试策略摘要、测试用例总览，再按 `## 标题（TC-001 / REQ-001）` 阅读每个测试用例。
- **下游同步:** TVD 确认后创建同一 `doc_id` 的 TED，执行证据写入同一 `doc_id` 的 VED。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | release-cleanup |
| Doc ID | release-cleanup |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 阅读重点 | 测试策略摘要、测试用例总览、测试用例章节、边界和错误用例 |

## 测试策略摘要

本测试设计采用 contract + source-scan + integration smoke 的组合。先用 package policy 契约测试固定允许发布和禁止发布的文件边界，再用真实 `npm pack` 输出证明 npm 实际产物符合该边界。安装洁净度通过隔离目录安装真实 tarball 并运行 bin、build fallback、doctor 或 manifest smoke 验证。中文用户优先由用户文档保留检查和 i18n surface 回归覆盖；内部 PRD/TSD/TVD/TED/VED、fixtures 和待办文件必须作为开发内容被排除。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | Package policy allowlist 契约 | REQ-001 | contract | 自动化 | VED |
| TC-002 | 真实 pack 开发内容 denylist 扫描 | REQ-002 | source-scan | 自动化 | VED |
| TC-003 | Release security audit 文件清单审计 | REQ-001, REQ-002 | contract | 自动化 | VED |
| TC-004 | 隔离 tarball 安装 smoke | REQ-003 | integration | 自动化 | VED |
| TC-005 | 中文用户文档保留和 skill 表面回归 | REQ-004 | source-scan / contract | 自动化 + 人工审查 | VED |
| TC-006 | Preflight 集成和失败归因 | REQ-001, REQ-002, REQ-003, REQ-004 | integration | 自动化 | VED |

## Package policy allowlist 契约（TC-001 / REQ-001）

### 测试目标

验证正式发布包边界由共享 package policy 固定，`package.json.files`、manifest check 和 package tests 不再各自维护冲突的 allowlist。

### 前置条件

- 已建立或收敛 release package policy。
- `src/lib/release/manifest-checks.ts` 已从 package policy 获取 required runtime files、required user docs 和 allowed package entries。
- `package.json.files` 已准备按策略收窄。

### 测试步骤

1. 在 RED 阶段运行 `node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs`。
2. 确认当前宽泛 `docs/`、`src/` 或未解释目录被 package policy 测试识别为不符合正式发布边界。
3. 完成策略和 `package.json.files` 调整后重跑同一命令。

### 断言

- package policy 明确区分 required runtime files、required user docs、platform integration files 和 denied development files。
- `package.json.files` 不再要求整个 `docs/`、`src/`、`tests/` 这类宽泛目录作为正式发布包必需项。
- manifest-check 和 npm package 测试读取同一组发布包边界，新增目录必须有运行或用户安装理由。

### 测试数据

- 主要数据：`package.json`、`src/lib/release/`、`src/lib/release/manifest-checks.ts`、`tests/ts/npm-package.test.mjs`、`tests/ts/manifest-checks.test.mjs`。
- 覆盖条件：必需运行入口、用户文档、platform manifest、运行必需资源、宽泛目录回归。
- 数据隔离：只读仓库配置和 package dry-run 输出，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 RED 失败、GREEN 通过和 pack 文件清单摘要。

## 真实 pack 开发内容 denylist 扫描（TC-002 / REQ-002）

### 测试目标

验证用户安装包不会包含内部 feature 文档链、测试 fixtures、待办文件、缓存、临时文件或仓库-only 配置。

### 前置条件

- package policy 已定义 denied path patterns。
- npm package 测试可以读取真实 `npm pack --dry-run --json` 或解包后的文件清单。

### 测试步骤

1. 运行 `node --test tests/ts/npm-package.test.mjs`。
2. 检查测试是否扫描真实 pack 文件路径。
3. 构造或利用当前 pack 输出中的开发内容作为 RED 失败。
4. 调整 package allowlist 后重跑命令。

### 断言

- 包内不存在 `docs/coding-plugins/features`、`tests/fixtures`、`todo.md`、工作区缓存、`__pycache__`、`.pyc`、日志或临时证据文件。
- denylist 扫描报告具体违规路径，而不是只报告通用失败。
- denylist 不误伤 `README.md`、`INSTALL.md`、`SECURITY.md`、`RELEASE-NOTES.md`、`skills/` 或 manifest 必需文件。

### 测试数据

- 主要数据：真实 npm pack 文件清单、`docs/coding-plugins/features/`、`tests/fixtures/`、`todo.md`、缓存路径样例。
- 覆盖条件：内部文档、fixtures、待办文件、缓存、临时文件、用户文档保留。
- 数据隔离：使用本地 npm cache 和临时目录，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 denylist RED/GREEN 和最终违规路径数量。

## Release security audit 文件清单审计（TC-003 / REQ-001 / REQ-002）

### 测试目标

验证 `security-audit` 不只扫描 secret 和 env 文件，也会对真实 pack 输出执行 package allowlist / denylist 审计，并输出机器可读结果。

### 前置条件

- `src/cli/release/security-audit.ts` 已接入 package policy。
- 审计 JSON 输出能表达文件清单违规类型。

### 测试步骤

1. 运行 `npm run security-audit:ts -- --root . --format json`。
2. 在 RED 阶段确认当前 pack 中的开发内容或宽泛目录会出现在失败 check 中。
3. 调整 package 内容后重跑同一命令。
4. 检查 JSON 中是否包含 pack 文件清单摘要和违规分类。

### 断言

- 审计检查真实 `npm pack --dry-run --json` 输出。
- 违规类型至少能区分 not_allowed、denied_dev_content、missing_required_runtime、missing_user_doc、secret_like_token 和 env_file。
- 审计失败时 `publish` 仍为 not-executed，且不执行真实发布。

### 测试数据

- 主要数据：`src/cli/release/security-audit.ts`、npm pack 文件清单、secret fixture、env path fixture。
- 覆盖条件：allowlist 违规、denylist 违规、缺必需运行入口、缺用户文档、secret-like token、env 文件。
- 数据隔离：本地命令和临时 fixture，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 security audit JSON 摘要。

## 隔离 tarball 安装 smoke（TC-004 / REQ-003）

### 测试目标

验证真实发布候选 tarball 在新目录安装后可运行，并且不依赖仓库根目录的 `src/`、`tests/`、`tsconfig` 或本地构建缓存。

### 前置条件

- `npm pack --json --pack-destination <tmp>` 可生成真实 tarball。
- `tests/ts/npm-package.test.mjs` 已有隔离安装测试，可扩展 doctor 或 manifest smoke。

### 测试步骤

1. 运行 `node --test tests/ts/npm-package.test.mjs`。
2. 测试创建临时 package root，安装真实 tarball。
3. 在安装包目录运行 `node bin/coding-plugins.js --help`。
4. 运行 `npm run build`，确认 packaged build fallback 不需要仓库 build tooling。
5. 根据实现结果增加 `doctor` 或 `manifest-check` smoke，确认输出面向用户安装状态。

### 断言

- 安装包内没有 `tsconfig.build.json`、仓库测试 fixture 或开发-only 配置依赖。
- bin help 成功输出 `coding-plugins <command>`。
- build fallback 输出 dist 已打包或等价成功信息。
- doctor 或 manifest smoke 不要求用户处理仓库开发文件。

### 测试数据

- 主要数据：真实 tarball、临时安装目录、`bin/coding-plugins.js`、`dist/`、packaged `package.json`。
- 覆盖条件：无源码运行、无仓库配置、bin 可用、build fallback 可用、安装状态可诊断。
- 数据隔离：临时目录和隔离 npm cache，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 tarball 安装命令和 smoke 输出摘要。

## 中文用户文档保留和 skill 表面回归（TC-005 / REQ-004）

### 测试目标

验证发布包瘦身不会删除中文用户安装说明，也不会回退已落地的 English agent-facing skill 表面。

### 前置条件

- `README.md`、`INSTALL.md`、`SECURITY.md`、`RELEASE-NOTES.md` 被 package policy 标记为 required user docs。
- `tests/ts/i18n-surface.test.mjs` 已覆盖 English agent-facing skill surface。

### 测试步骤

1. 运行 `node --test tests/ts/i18n-surface.test.mjs tests/ts/npm-package.test.mjs`。
2. 检查 pack 文件清单中保留 README、INSTALL、SECURITY 和 RELEASE-NOTES。
3. 检查 pack 文件清单中不包含内部 feature docs。
4. 人工抽查 README/INSTALL，确认中文用户可直接完成安装验证。

### 断言

- 用户文档保留中文安装、使用、安全或发布说明。
- `skills/*/SKILL.md` 的 English agent-facing 表面不回退。
- 内部 PRD/TSD/TVD/TED/VED 不作为用户安装说明进入包。

### 测试数据

- 主要数据：README、INSTALL、SECURITY、RELEASE-NOTES、`skills/`、`docs/coding-plugins/features/`、pack 文件清单。
- 覆盖条件：中文用户文档保留、内部文档排除、English skill 表面不回退。
- 数据隔离：本地 source-scan 和 package dry-run，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录 package 和 i18n 回归结果。

## Preflight 集成和失败归因（TC-006 / REQ-001 / REQ-002 / REQ-003 / REQ-004）

### 测试目标

验证正式发布优化相关测试进入仓库门禁，并且最终报告能区分文档链路未完成、实现回归和环境敏感失败。

### 前置条件

- TVD、TED、VED 文档链路补齐后再把 preflight 作为完成门禁。
- release package tests、manifest checks、security audit 和 i18n surface tests 已完成实现。

### 测试步骤

1. 运行 `npm run preflight -- --write-index`。
2. 运行 `npm run preflight`。
3. 如果失败，记录失败来源：文档链状态、package policy、tarball smoke、doctor 环境或其他 productization 回归。
4. 只有当与本需求相关的 package / release / i18n 测试通过，且文档链路处于可完成状态时，才能在 VED 中声明完成。

### 断言

- preflight 执行 npm package、manifest、i18n、productization 和文档索引相关测试。
- 文档链未完成导致的 doctor/schema 失败不能被误报为实现完成。
- 实现完成后，preflight 对本需求新增测试不再失败。

### 测试数据

- 主要数据：preflight 输出、docs index、productization test 输出、package test 输出。
- 覆盖条件：索引刷新、测试发现、失败归因、完成门禁。
- 数据隔离：本地命令，无需网络。

### 证据目标

- VED 记录：同一 `doc_id` 的 VED 证据文档。
- 执行阶段：TED 中对应任务记录最终 preflight 状态和残余风险。

## 边界和错误用例

| Spec ID | 测试用例 ID | 条件 | 期望结果 | 测试类型 |
| --- | --- | --- | --- | --- |
| ERR-001 | TC-001 | 新目录被加入 package allowlist，但没有运行或用户安装理由。 | package policy 契约测试失败，并指出目录。 | contract |
| ERR-002 | TC-004 | 包内缺少 bin、dist、manifest 或用户安装说明。 | tarball install smoke 或 manifest check 失败。 | integration |
| ERR-003 | TC-002 | 包内出现 `docs/coding-plugins/features`、`todo.md`、`tests/fixtures` 或未发布草稿。 | denylist 扫描失败并报告路径。 | source-scan |
| ERR-004 | TC-002, TC-005 | denylist 误伤 README、INSTALL、skills 或 manifest 必需文件。 | package 或 manifest 测试失败。 | contract |
| ERR-005 | TC-004 | 安装后的 bin 依赖仓库 `src/*.ts`、`tsconfig`、测试 fixture 或未打包文件。 | 隔离 tarball 安装 smoke 失败。 | integration |
| ERR-006 | TC-003 | release audit 只检查配置，没有检查真实 pack 输出。 | security audit 契约测试失败。 | contract |
| ERR-007 | TC-005 | 发布包瘦身删除中文用户安装说明。 | 文档/package 验收失败。 | source-scan |
| ERR-008 | TC-005 | 发布包重新引入中文 agent-facing skill 文案或内部中文 feature 文档。 | i18n/package 回归失败。 | source-scan |

## 不需要测试用例的规格

- 无：REQ-001 到 REQ-004 均有对应测试用例。

## 执行提示

- 实现阶段使用 `test-driven-development`，先写或收紧 failing tests，再改 release/package 实现。
- 实际 RED/GREEN/REFACTOR 输出写入 VED，不写入本文档。
- 如果 TED 改变测试顺序，必须回看本文档，确认 Spec ID 覆盖没有丢失。
- 任何真实发布、tag、版本提升或 npm publish 都不属于本 TVD 覆盖范围，需要单独 DP 确认。
