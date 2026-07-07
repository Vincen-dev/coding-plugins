---
title: 正式发布优化 Task Execution Document
status: approved
feature: release-cleanup
doc_id: release-cleanup
created: 2026-07-07
updated: 2026-07-07
related_docs:
  - docs/coding-plugins/features/release-cleanup/requirements/release-cleanup-PRD.md
  - docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md
  - docs/coding-plugins/features/release-cleanup/test-cases/release-cleanup-TVD.md
  - docs/coding-plugins/features/release-cleanup/evidences/release-cleanup-VED.md
source_hash: sha256:ea2f6c3fc2176c883ec90e7af7119b01378271d97d7cd834f3ad7a0fc2b68797
---

# 正式发布优化任务执行文档（TED）

## 阅读摘要

- **本文结论:** 本 TED 将正式发布优化拆成 5 个顺序任务：先建立 package policy 和 RED 契约测试，再接入真实 pack denylist / security audit，随后修正 tarball 安装 smoke 和运行时依赖，最后收紧 `package.json.files` 并完成总体验证与 VED。
- **当前状态:** 已批准，等待执行门禁通过后进入实现。
- **先读重点:** 先看执行锁定区、执行简报、任务总览，再按 `## 任务标题（TASK-001 / REQ-001）` 逐项执行。
- **执行入口:** DP-4 批准后使用 `executing-plans` 按任务执行；每个行为、配置或契约变更任务必须记录 VED 证据。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | release-cleanup |
| Doc ID | release-cleanup |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只保留执行任务需要的上下文、步骤和验证口径。

## 目标

按已批准 PRD/TSD/TVD 落地正式发布优化：将发布包边界集中到 package policy，以真实 npm pack 输出和隔离 tarball 安装证明用户安装包干净、整洁、可运行，同时保留中文用户文档和 English agent-facing skill 表面。

## 执行入口

- 推荐方式：`executing-plans`，在当前会话按任务顺序执行。
- 可选方式：任务拆分明确后再使用 `subagent-driven-development` 派发独立实现，但主线程必须复验 package、audit、install smoke 和 preflight。
- 执行约束：不得跳过 RED/GREEN/REFACTOR；无法自动测试时必须在 VED 写 TDD 例外记录。
- 新鲜度检查：执行前运行 `node ./bin/coding-plugins.js workflow-state inspect --feature release-cleanup --doc-id release-cleanup --json`；如果状态是 `plan-draft`、`plan-unlocked` 或 `plan-stale`，先回到 `writing-plans` 批准 TED、补齐 `source_hash`，或刷新 TED。

## 执行锁定区

- **Intent Lock:** 只执行正式发布优化，交付 package allowlist、开发内容排除、安装洁净度验证和中文用户优先分发体验。
- **Scope Fence:** 包含 release package policy、manifest/package/security audit 检查、npm package 测试、`package.json.files`、必要 runtime entrypoint 调整、README/INSTALL 等用户文档保留检查、docs index 和 VED；不包含真实 npm publish、GitHub Release、tag、版本提升、commit、push 或 skills 专项边界重构。
- **Required Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-004
- **Required Tests:** `node --test tests/ts/npm-package.test.mjs`; `node --test tests/ts/manifest-checks.test.mjs`; `npm run security-audit:ts -- --root . --format json`; `node --test tests/ts/i18n-surface.test.mjs`; PRD/TSD validators; `npm run preflight -- --write-index`; `npm run preflight`
- **Review Gates:** 每个任务后检查 diff 是否只触碰任务范围；收紧 package files 后必须复验真实 tarball 安装；进入提交、tag、发布或合并前必须另走 DP-6/DP-7。
- **Rewind Triggers:** 上游 PRD/TSD/TVD 变更、source_hash 不匹配、新增公开 CLI/API/schema 行为、真实发布动作被纳入范围、中文用户文档被删除、安装 smoke 依赖仓库源码、package policy 误伤必要 manifest 或 skills、preflight 失败且不能归因。

## 执行简报

- **执行来源:** 只按本 TED 的任务章节执行；技术细节以 TSD 为准，测试边界以 TVD 为准。
- **上下文预算:** 执行阶段优先读取执行简报、执行锁定区、任务总览和当前任务章节。
- **可跳过内容:** PRD/TSD/TVD 已由 `source_hash` 锁定，除非触发 Rewind Triggers 或 guard 失败，否则不重复读取完整上游文档。
- **新计划策略:** 每次新计划新建 TED，不向旧 TED 追加任务。

## 上游约束摘要

- 需求约束：正式发布包只包含运行入口、构建产物、agent-facing skills、平台 manifest、用户安装/安全/发布说明和运行时必需资源；内部 feature 文档、fixtures、待办文件、缓存和临时文件不得进入用户安装包。
- 技术约束：先建立共享 package policy，再让 `manifest-checks`、`security-audit` 和 npm package tests 复用；收紧 `src/` 和 `docs/` 前必须证明运行时依赖已由 `dist` 覆盖。
- 测试约束：每个 MUST 规格都有 TVD 测试用例，实际 RED/GREEN/REFACTOR 或 TDD 例外写入同一 `doc_id` 的 VED。

## 任务总览

| 任务 | 标题 | 覆盖规格 | 验证方式 | VED 记录 |
| --- | --- | --- | --- | --- |
| TASK-001 | 建立 package policy 和 allowlist RED 契约 | REQ-001 | npm package + manifest tests | 同一 `doc_id` 的 VED |
| TASK-002 | 接入真实 pack denylist 和 security audit | REQ-001, REQ-002 | package tests + security audit | 同一 `doc_id` 的 VED |
| TASK-003 | 强化隔离 tarball 安装 smoke 和 runtime 独立性 | REQ-003 | npm package tarball install test | 同一 `doc_id` 的 VED |
| TASK-004 | 收紧发布包内容并保护中文用户文档 | REQ-001, REQ-002, REQ-004 | package + i18n tests | 同一 `doc_id` 的 VED |
| TASK-005 | 更新索引、VED 和完成总体验证 | REQ-001, REQ-002, REQ-003, REQ-004 | validators + preflight | 同一 `doc_id` 的 VED |

## 建立 package policy 和 allowlist RED 契约（TASK-001 / REQ-001）

### 任务目标

新增共享 package policy，并先用 failing tests 固定正式发布包 allowlist 边界，暴露当前 `package.json.files`、manifest checks 和 npm package tests 中的规则漂移。

### 执行前提

- 已确认需求：REQ-001。
- 已确认设计：TD-001、TD-003。
- 已确认测试：TC-001。

### 修改范围

- 创建或修改：`src/lib/release/` 中的 package policy 模块。
- 修改：`src/lib/release/manifest-checks.ts`，从 policy 读取 package 边界。
- 修改：`tests/ts/npm-package.test.mjs` 和 `tests/ts/manifest-checks.test.mjs`，加入 allowlist 契约断言。
- 暂不修改：真实发布 workflow、tag、version。

### 执行步骤

- [ ] **步骤 1：写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`tests/ts/npm-package.test.mjs`、`tests/ts/manifest-checks.test.mjs`
  - 预期失败：当前宽泛 `docs/`、`src/` 或未解释目录被识别为不符合正式发布边界。
- [ ] **步骤 2：运行 RED**
  - 命令：`node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs`
  - 预期：FAIL，失败来自 package allowlist 契约，不是语法或环境问题。
- [ ] **步骤 3：实现 package policy**
  - 修改：集中定义 required runtime files、required user docs、platform integration files、allowed package entries 和 denied development files。
  - 边界：只定义策略和测试，不在本任务收紧所有 package files。
- [ ] **步骤 4：接入 manifest checks**
  - 修改：`src/lib/release/manifest-checks.ts`
  - 预期：manifest checks 与 npm package tests 使用同一策略或显式对齐。
- [ ] **步骤 5：记录 RED/GREEN 证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-001
- 测试类型：contract
- 命令：`node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs`
- 预期结果：GREEN 阶段 package policy 契约通过，且失败信息能指出不允许或缺失的文件类别。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 1：建立 package policy 和 allowlist RED 契约`
- 必须记录：RED 失败、GREEN 命令、policy 覆盖的文件类别。

## 接入真实 pack denylist 和 security audit（TASK-002 / REQ-001, REQ-002）

### 任务目标

让 npm package 测试和 `security-audit` 对真实 `npm pack --dry-run --json` 输出执行 allowlist / denylist 扫描，阻止内部开发内容进入用户安装包。

### 执行前提

- 已确认需求：REQ-001、REQ-002。
- 已确认设计：TD-001、TD-002。
- 已确认测试：TC-002、TC-003。
- TASK-001 已建立 package policy。

### 修改范围

- 修改：`tests/ts/npm-package.test.mjs`，扫描真实 pack 文件路径。
- 修改：`src/cli/release/security-audit.ts`，接入 package policy 和文件清单审计。
- 可能修改：`src/lib/release/` policy helper，输出违规分类和摘要。

### 执行步骤

- [ ] **步骤 1：写 denylist RED**
  - 规格 ID：REQ-002
  - 测试位置：`tests/ts/npm-package.test.mjs`
  - 预期失败：包内出现 `docs/coding-plugins/features`、`todo.md`、fixtures、缓存或临时文件时失败。
- [ ] **步骤 2：写 security audit RED**
  - 规格 ID：REQ-001, REQ-002
  - 测试位置：`tests/ts/npm-package.test.mjs` 或 security audit 专项断言。
  - 预期失败：`security-audit` 缺少真实 pack 文件清单审计或违规分类。
- [ ] **步骤 3：实现审计逻辑**
  - 修改：`src/cli/release/security-audit.ts`
  - 输出：至少区分 `not_allowed`、`denied_dev_content`、`missing_required_runtime`、`missing_user_doc`、`secret_like_token`、`env_file`。
- [ ] **步骤 4：运行 GREEN**
  - 命令：`node --test tests/ts/npm-package.test.mjs`
  - 命令：`npm run security-audit:ts -- --root . --format json`
- [ ] **步骤 5：记录证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-001, REQ-002
- 测试类型：source-scan / contract
- 命令：`node --test tests/ts/npm-package.test.mjs`
- 命令：`npm run security-audit:ts -- --root . --format json`
- 预期结果：真实 pack 输出被扫描，开发内容违规能报告具体路径。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 2：接入真实 pack denylist 和 security audit`
- 必须记录：denylist RED/GREEN、security audit JSON 摘要、违规路径数量。

## 强化隔离 tarball 安装 smoke 和 runtime 独立性（TASK-003 / REQ-003）

### 任务目标

证明正式发布候选 tarball 在隔离目录安装后可运行，并且不依赖仓库根目录的 `src/`、`tests/`、`tsconfig` 或本地构建缓存。

### 执行前提

- 已确认需求：REQ-003。
- 已确认设计：TD-003。
- 已确认测试：TC-004。
- TASK-001 和 TASK-002 已建立 package 文件清单边界。

### 修改范围

- 修改：`tests/ts/npm-package.test.mjs` 的 tarball install test。
- 可能修改：`bin/coding-plugins.js`、`src/cli/release/build-dist.ts`、runtime registry 或 dist 入口，前提是 install smoke 证明需要。
- 不修改：真实发布 workflow、npm publish、tag。

### 执行步骤

- [ ] **步骤 1：扩展 tarball smoke RED**
  - 规格 ID：REQ-003
  - 测试位置：`tests/ts/npm-package.test.mjs`
  - 预期失败：安装包依赖仓库-only 文件、缺 manifest smoke 或 doctor 输出仍指向开发工作区。
- [ ] **步骤 2：运行 RED**
  - 命令：`node --test tests/ts/npm-package.test.mjs`
  - 预期：FAIL，失败原因来自安装包运行时依赖或 smoke 缺口。
- [ ] **步骤 3：修正 runtime 依赖**
  - 修改：优先让安装包使用 `dist` entrypoints；只有必要资源才进入 allowlist。
  - 边界：若某个源码或资源仍必需，记录必要性并尽量改为构建产物。
- [ ] **步骤 4：运行 GREEN**
  - 命令：`node --test tests/ts/npm-package.test.mjs`
  - 预期：真实 tarball install、bin help、build fallback、doctor 或 manifest smoke 通过。
- [ ] **步骤 5：记录证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-003
- 测试类型：integration
- 命令：`node --test tests/ts/npm-package.test.mjs`
- 预期结果：隔离目录安装真实 tarball 后可运行，不依赖仓库源码或测试文件。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 3：强化隔离 tarball 安装 smoke 和 runtime 独立性`
- 必须记录：tarball install 命令、bin/build/doctor 或 manifest smoke 输出摘要。

## 收紧发布包内容并保护中文用户文档（TASK-004 / REQ-001, REQ-002, REQ-004）

### 任务目标

按 package policy 收紧 `package.json.files`，排除开发内容，同时保留中文用户文档和 English agent-facing skill 表面。

### 执行前提

- 已确认需求：REQ-001、REQ-002、REQ-004。
- 已确认设计：TD-001、TD-004。
- 已确认测试：TC-001、TC-002、TC-005。
- TASK-001 到 TASK-003 已证明运行时依赖边界。

### 修改范围

- 修改：`package.json::files`
- 可能修改：README、INSTALL、SECURITY、RELEASE-NOTES，仅用于保持用户安装说明可发现。
- 测试：`tests/ts/npm-package.test.mjs`、`tests/ts/i18n-surface.test.mjs`

### 执行步骤

- [ ] **步骤 1：收紧 `package.json.files`**
  - 规格 ID：REQ-001, REQ-002
  - 边界：移除宽泛 `docs/`、`src/`、`tests/` 类包含；保留运行必需入口、manifest、skills 和用户文档。
- [ ] **步骤 2：运行 package GREEN**
  - 命令：`node --test tests/ts/npm-package.test.mjs`
  - 预期：PASS。
- [ ] **步骤 3：运行 i18n / 用户文档回归**
  - 命令：`node --test tests/ts/i18n-surface.test.mjs tests/ts/npm-package.test.mjs`
  - 预期：PASS，中文用户文档保留，agent-facing skill 表面不回退。
- [ ] **步骤 4：人工抽查安装文档**
  - 检查：README/INSTALL 仍能让中文用户完成安装验证。
- [ ] **步骤 5：记录证据**
  - 写入：同一 `doc_id` 的 VED 证据文档。

### 验证方式

- 覆盖规格：REQ-001, REQ-002, REQ-004
- 测试类型：config / source-scan / contract
- 命令：`node --test tests/ts/i18n-surface.test.mjs tests/ts/npm-package.test.mjs`
- 预期结果：发布包内容收紧，中文用户文档保留，内部 feature 文档不进入包。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 4：收紧发布包内容并保护中文用户文档`
- 必须记录：package 文件清单摘要、中文用户文档抽查结论、i18n 回归结果。

## 更新索引、VED 和完成总体验证（TASK-005 / REQ-001, REQ-002, REQ-003, REQ-004）

### 任务目标

补齐正式发布优化的执行证据、索引和总体验证，确保完成声明不混淆实现回归、文档链路门禁和环境敏感失败。

### 执行前提

- 已确认需求：REQ-001、REQ-002、REQ-003、REQ-004。
- 已确认测试：TC-006。
- TASK-001 到 TASK-004 已完成并记录阶段证据。

### 修改范围

- 创建或修改：`docs/coding-plugins/features/release-cleanup/evidences/release-cleanup-VED.md`
- 修改：PRD/TSD/TVD/TED `related_docs`，在 VED 创建后回填。
- 修改：`docs/coding-plugins/INDEX.md`
- 可能修改：`todo.md`，仅在实现全部完成后移除或勾选正式发布优化待办项。

### 执行步骤

- [ ] **步骤 1：创建 VED**
  - 内容：按任务记录 RED/GREEN/REFACTOR、最终验证和残余风险。
- [ ] **步骤 2：刷新文档关系和索引**
  - 命令：`npm run preflight -- --write-index`
  - 预期：索引包含 PRD/TSD/TVD/TED/VED。
- [ ] **步骤 3：运行专项 validators**
  - 命令：`node ./bin/coding-plugins.js validate-spec docs/coding-plugins/features/release-cleanup/requirements/release-cleanup-PRD.md --format json`
  - 命令：`node ./bin/coding-plugins.js validate-technicals --root . --format json --strict docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md`
- [ ] **步骤 4：运行最终验证**
  - 命令：`npm run preflight`
  - 命令：`npm run security-audit:ts -- --root . --format json`
  - 命令：`git diff --check`
- [ ] **步骤 5：完成状态回报**
  - 如果仍有失败，按来源分类：package/release 实现失败、文档链门禁、doctor 环境敏感、既有无关失败。
  - 进入提交前另走 DP-6/DP-7。

### 验证方式

- 覆盖规格：REQ-001, REQ-002, REQ-003, REQ-004
- 测试类型：integration / documentation
- 命令：`npm run preflight -- --write-index`
- 命令：`npm run preflight`
- 命令：`npm run security-audit:ts -- --root . --format json`
- 预期结果：与正式发布优化相关的 package、release、i18n、document 验证通过；残余失败有明确归因。

### VED 记录要求

- 证据文件：同一 `doc_id` 的 VED 证据文档。
- 证据章节：`## 任务 5：更新索引、VED 和完成总体验证`
- 必须记录：最终验证命令、结果摘要、残余风险和未执行真实发布的说明。

## 规格到任务映射

| 规格 ID | 任务 | 测试用例 | 主要验证 |
| --- | --- | --- | --- |
| REQ-001 | TASK-001, TASK-002, TASK-004, TASK-005 | TC-001, TC-003, TC-006 | package policy、manifest/package tests、security audit、preflight |
| REQ-002 | TASK-002, TASK-004, TASK-005 | TC-002, TC-003, TC-006 | real pack denylist、security audit、package tests |
| REQ-003 | TASK-003, TASK-005 | TC-004, TC-006 | tarball install smoke、bin/build/doctor 或 manifest smoke |
| REQ-004 | TASK-004, TASK-005 | TC-005, TC-006 | i18n surface、用户文档保留、package 文件清单 |

## 执行后检查清单

- [ ] 每个任务都有 RED/GREEN/REFACTOR 或 TDD 例外记录。
- [ ] `package.json.files` 与 package policy 对齐。
- [ ] 真实 `npm pack` 输出没有内部 feature 文档、fixtures、待办文件或缓存。
- [ ] 隔离 tarball 安装 smoke 通过。
- [ ] 中文 README/INSTALL 等用户文档仍在包内。
- [ ] 未执行真实 npm publish、GitHub Release、tag 或版本提升。
- [ ] DP-6/DP-7 未批准前不提交、不发布、不声称 release 完成。
