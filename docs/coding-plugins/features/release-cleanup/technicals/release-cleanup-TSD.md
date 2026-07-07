---
title: 正式发布优化技术方案
status: approved
lifecycle_status: approved
feature: release-cleanup
doc_id: release-cleanup
created: 2026-07-07
updated: 2026-07-07
implemented_commits: []
validated_by: "planned: node ./bin/coding-plugins.js validate-technicals --root . --format json --strict docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md"
related_docs:
  - docs/coding-plugins/features/release-cleanup/requirements/release-cleanup-PRD.md
  - docs/coding-plugins/features/release-cleanup/test-cases/release-cleanup-TVD.md
  - docs/coding-plugins/features/release-cleanup/plans/release-cleanup-TED.md
  - docs/coding-plugins/features/release-cleanup/evidences/release-cleanup-VED.md
---

# 正式发布优化技术方案

## 阅读摘要

- **本文结论:** 采用 package policy 先行的方案：把发布包 allowlist、denylist、真实 pack 解包检查和隔离安装 smoke 统一沉到 release/package 审计能力，再用 `package.json.files`、manifest checks、security audit 和 npm package tests 执行同一套规则。实现阶段不做真实发布、tag 或版本提升，也不删除仓库内部文档和测试资料。
- **当前状态:** 已批准，进入测试用例设计阶段。
- **先读重点:** 先看方案摘要、规格缺口审查、规格到设计映射、关键决策和测试策略。
- **下游同步:** TSD 确认后创建同一 `doc_id` 的 TVD 和 TED，并在 PRD/TSD metadata 中维护关联关系。

## 文档信息

- 状态：approved。
- 生命周期：approved。
- Feature：release-cleanup。
- Doc ID：release-cleanup。
- 文档类型：TSD / 技术方案文档。
- 已实现提交：[]。
- 验证方式：计划运行 `validate-technicals`、`node --test tests/ts/npm-package.test.mjs`、`node --test tests/ts/manifest-checks.test.mjs`、`npm run security-audit:ts -- --root . --format json` 和 `npm run preflight`。

关联关系只维护在 frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md`。正文只说明技术方案、设计决策、影响范围和测试交接。

## 方案摘要

本方案把正式发布优化定义为“发布包策略 + 真实 artifact 验证”的维护改造。为满足 REQ-001、REQ-002 和 REQ-004，先在 release 层建立可复用 package policy，集中描述允许发布的文件、禁止发布的开发内容、用户中文文档保留范围和平台 manifest 必需资源；再让 `manifest-checks`、`security-audit` 和 npm package 测试复用该策略，避免 `package.json.files`、测试断言和审计脚本各自维护不同规则。最后为满足 REQ-001 和 REQ-003 收紧 `package.json.files`，并用真实 `npm pack`、解包路径扫描和隔离安装 smoke 证明安装包干净、整洁、可运行。

## 规格缺口审查

- 未覆盖需求：无。REQ-001 到 REQ-004 都有技术落点和验证目标。
- 验收标准不清：无。每条需求都能映射到 package 文件清单、denylist 扫描、隔离安装 smoke 或文档/i18n 回归。
- 新增外部行为：无新增 CLI 用户命令；会增强现有 release audit、manifest check 和 package 测试的检查内容。
- 错误边界 / 兼容要求：无缺口。PRD 已明确不执行真实发布、不删除仓库开发资料、保留中文用户文档和 English agent-facing skill 表面。
- 处理状态：通过，未发现需要回写 PRD 的缺口。

## 规格到设计映射

| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | 正式发布包必须基于明确 allowlist。 | 新增或收敛 release package policy，作为 `package.json.files`、manifest check 和 package tests 的共同规则。 | TD-001 | `src/lib/release/`; `src/lib/release/manifest-checks.ts`; `package.json`; `tests/ts/npm-package.test.mjs` | `node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs` | VED 记录 pack 文件清单摘要和测试结果。 |
| REQ-002 | 开发、测试、临时和规划内容不得进入用户安装包。 | package policy 增加 denylist；`security-audit` 或 package tests 对真实 pack 输出做路径扫描。 | TD-002 | `src/cli/release/security-audit.ts`; `tests/ts/npm-package.test.mjs`; `todo.md`; `docs/coding-plugins/features/` | `npm run security-audit:ts -- --root . --format json`; `node --test tests/ts/npm-package.test.mjs` | VED 记录 denylist 违规样例和最终扫描结果。 |
| REQ-003 | 发布前必须解包并在新环境安装 smoke。 | 扩展现有 tarball install 测试，增加解包路径断言和安装后 doctor/manifest smoke。 | TD-003 | `tests/ts/npm-package.test.mjs`; `bin/coding-plugins.js`; `dist/`; `src/cli/release/build-dist.ts` | `node --test tests/ts/npm-package.test.mjs` | VED 记录隔离安装命令和输出摘要。 |
| REQ-004 | 中文用户文档保留，agent-facing skill 表面不回退。 | package policy 把 README/INSTALL/SECURITY/RELEASE-NOTES 标为用户文档 allowlist，并复用 i18n/package 回归测试保护 skills 表面。 | TD-004 | `README.md`; `INSTALL.md`; `SECURITY.md`; `RELEASE-NOTES.md`; `skills/`; `tests/ts/i18n-surface.test.mjs` | `node --test tests/ts/i18n-surface.test.mjs tests/ts/npm-package.test.mjs` | VED 记录中文用户文档保留和内部文档排除结果。 |

## 无需技术方案的规格

- 无：REQ-001 到 REQ-004 都涉及发布配置、审计逻辑、测试策略或兼容边界，需要技术落点。

## 关键决策

| 决策 ID | 决策 | 原因 | 取舍 |
| --- | --- | --- | --- |
| TD-001 | 建立共享 package policy，由 manifest check、security audit 和 package tests 复用。 | 当前规则分散在 `package.json.files`、`REQUIRED_PACKAGE_FILES` 和测试断言中，容易出现包内容与审计口径漂移。 | 需要新增一层 release 规则模块，但可以减少后续重复维护。 |
| TD-002 | 对真实 npm pack 输出执行 denylist 扫描，而不是只校验 `package.json.files`。 | npm pack 会受 ignore 规则、files glob 和自动包含文件影响，真实输出才是用户会拿到的内容。 | 测试会稍慢，但能发现配置层看不到的泄漏。 |
| TD-003 | 收紧 `src/` 和 `docs/` 前，先证明安装包运行时依赖已由 `dist` 覆盖。 | 现有测试仍要求部分 `src/*.ts` 在包内，直接删除会导致 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` 或 release CLI 断裂。 | 实现需要先调整 bin/registry/build 脚本引用，再改 allowlist。 |
| TD-004 | 中文用户文档作为用户安装面保留，内部中文 feature 文档作为开发面排除。 | 用户以中文为主，但 PRD/TSD/TVD/TED/VED 是维护链路，不应进入安装包。 | 需要在 package policy 中表达“中文不是排除条件，文档用途才是边界”。 |

## 实现方案

- 实现模式：code + configuration + tests。
- 关联决策：TD-001、TD-002、TD-003、TD-004。
- 实现点：
  - 在 `src/lib/release/` 中集中定义 package policy，包括 allowed top-level entries、required runtime files、required user docs、denied path patterns 和 artifact summary helper。
  - 调整 `src/lib/release/manifest-checks.ts`，用 package policy 代替内联 `REQUIRED_PACKAGE_FILES`，并把 `docs/`、`src/`、`tests/` 这类宽泛包含从正式 package required list 中移除或降级为“仅在证明必要时允许”。
  - 扩展 `src/cli/release/security-audit.ts`，对 `npm pack --dry-run --json` 的真实文件清单执行 allowlist/denylist/secret/env 扫描，并在 JSON 输出中报告违规路径。
  - 扩展 `tests/ts/npm-package.test.mjs`，按 REQ-002 覆盖包内不得包含 `docs/coding-plugins/features`、`tests/fixtures`、`todo.md`、缓存、临时文件和仓库-only 配置；保留并加强已有 tarball install smoke。
  - 按 REQ-001 和 REQ-003 的验证结果收紧 `package.json.files`。若某个 `src/*.ts` 或资源仍是运行时必需，其必要性记录到 TVD/TED 的测试和任务交接，并优先改为 `dist` 入口。
  - 检查 README/INSTALL/SECURITY/RELEASE-NOTES 在包内保留，skills 的 English agent-facing 表面继续由 i18n surface 测试保护。
- 不写入本文的内容：具体任务拆分、RED/GREEN 输出、真实 pack 文件清单全文、版本提升、tag 或 publish 操作。

## 影响组件

- `package.json::files`：从宽泛目录发布改为策略驱动的最小可运行 allowlist，覆盖 REQ-001 和 REQ-002。
- `src/lib/release/manifest-checks.ts`：从内联 required package files 迁移到共享 package policy，覆盖 REQ-001。
- `src/cli/release/security-audit.ts`：增加真实 pack 文件清单的 allowlist/denylist 扫描，覆盖 REQ-002。
- `tests/ts/npm-package.test.mjs`：作为主要 RED/GREEN 契约测试，覆盖 REQ-001、REQ-002 和 REQ-003。
- `tests/ts/i18n-surface.test.mjs`：保护中文用户文档和 English skill 表面边界，覆盖 REQ-004。
- `bin/coding-plugins.js`、`dist/`、`src/cli/release/build-dist.ts`：用于证明安装包在缺少仓库源码和构建配置时仍可运行，覆盖 REQ-003。
- `README.md`、`INSTALL.md`、`SECURITY.md`、`RELEASE-NOTES.md`：作为用户文档 allowlist，覆盖 REQ-004。

## 数据流 / 控制流

发布验证控制流如下：

```text
package policy
  -> package.json.files review
  -> npm pack --dry-run --json
  -> allowlist / denylist / secret / env scan
  -> npm pack tarball
  -> isolated npm install
  -> bin / doctor / manifest smoke
  -> VED records summary evidence
```

本需求不涉及业务运行时数据流、数据库 schema 或用户数据迁移。

## 接口和契约

- 设计约束 TD-001：package policy 是正式发布包边界的权威来源；`package.json.files`、manifest checks、security audit 和 package tests 必须从同一规则派生或显式对齐。
- 设计约束 TD-002：release audit 必须报告违规路径，至少区分 `not_allowed`, `denied_dev_content`, `missing_required_runtime`, `missing_user_doc`, `secret_like_token` 和 `env_file` 这类结果。
- 设计约束 TD-003：安装 smoke 必须使用真实 tarball 和隔离目录，不得依赖仓库根目录的 `src/`、`tests/`、`tsconfig` 或本地构建缓存。
- 设计约束 TD-004：README/INSTALL/SECURITY/RELEASE-NOTES 是用户安装面，`docs/coding-plugins/features` 是开发文档面；发布规则按用途区分，不按中文内容本身区分。
- 不新增外部 API、SDK、状态机或持久化 schema。

## 迁移 / 兼容性

迁移策略是先加策略和测试，再收紧发布包。第一步让现有 package 输出在新审计下暴露违规项；第二步调整 runtime entrypoints 和 `dist` 依赖，确保 package 不再需要仓库源码；第三步收窄 `package.json.files` 并复验真实 tarball 安装。回滚方式是恢复 `package.json.files` 中被移除的必要入口，同时保留 package policy 测试报告具体违规，避免静默回到无边界发布。

兼容性重点：

- `coding-plugins` bin、doctor、preflight、manifest-check 和 prepare/security release 命令保持可用。
- Node.js >=22.6、`dist/index.js`、`dist/index.d.ts` 和 packaged build fallback 保持可用。
- Codex、Claude Code、Gemini、本地 skills client 的 manifest 和 skills 入口保持可安装。
- 中文 README/INSTALL 保留，内部 feature 文档不发布。

## 测试策略

- REQ-001：`node --test tests/ts/npm-package.test.mjs tests/ts/manifest-checks.test.mjs`。RED 断言当前宽泛 `docs/`、`src/` 或未解释的目录会被 package policy 拒绝；GREEN 断言真实 pack 文件清单只包含 allowlist 内容。
- REQ-002：`npm run security-audit:ts -- --root . --format json` 和 `node --test tests/ts/npm-package.test.mjs`。RED 使用真实 pack 输出中现有开发内容或 fixture 夹带作为失败证据；GREEN 断言 denylist 路径不存在。
- REQ-003：`node --test tests/ts/npm-package.test.mjs`。RED 覆盖安装包依赖仓库-only 文件的失败；GREEN 在隔离目录安装 tarball，运行 `bin/coding-plugins.js --help`、build fallback，并按实现结果增加 doctor 或 manifest smoke。
- REQ-004：`node --test tests/ts/i18n-surface.test.mjs tests/ts/npm-package.test.mjs`。RED/GREEN 覆盖中文用户文档保留、内部 feature 文档排除和 English agent-facing skill 表面不回退。
- 集成验证：文档链路完成且实现落地后运行 `npm run preflight -- --write-index` 和 `npm run preflight`。若 preflight 因当前文档链尚未补齐而失败，VED 必须区分链路门禁失败和实现回归失败。

## 风险和缓解

- 误删运行时必需源码或资源：先通过 tarball install smoke 定位依赖，再改为 `dist` 入口或将资源列入带理由的 allowlist。
- package policy 与 npm 自动包含规则不一致：始终以真实 `npm pack --dry-run --json` 和 tarball 解包结果为准。
- 发布包瘦身误删中文用户说明：把 README/INSTALL/SECURITY/RELEASE-NOTES 纳入 required user docs，并用 package 测试验证。
- 现有 tests 仍要求 `src/` 或 `docs/` 入包：先更新测试为 PRD 边界，再按 RED/GREEN 修实现，避免测试继续保护旧行为。
- 回滚 / 降级：如果收紧后安装 smoke 失败，临时恢复最小缺失入口并保留 denylist 扫描；按 REQ-001 和 REQ-002，回滚方案不能恢复整个 `docs/` 或 `src/` 宽泛发布。
