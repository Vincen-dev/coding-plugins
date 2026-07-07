---
title: 正式发布优化需求文档
type: maintenance
status: approved
feature: release-cleanup
doc_id: release-cleanup
created: 2026-07-07
updated: 2026-07-07
tags:
  - release-cleanup
  - release
  - packaging
  - productization
related_code: []
related_docs:
  - docs/coding-plugins/features/release-cleanup/technicals/release-cleanup-TSD.md
  - docs/coding-plugins/features/release-cleanup/test-cases/release-cleanup-TVD.md
  - docs/coding-plugins/features/release-cleanup/plans/release-cleanup-TED.md
  - docs/coding-plugins/features/release-cleanup/evidences/release-cleanup-VED.md
---

# 正式发布优化需求文档

## 阅读摘要

- **本文结论:** Coding Plugins 需要把正式发布包收敛为干净、可运行、中文用户可直接完成安装验证的产物，并用真实打包和安装验证阻止开发内容泄漏。
- **当前状态:** 已批准，进入技术方案设计阶段。
- **先读重点:** 先看非目标、需求总览，再重点阅读 `发布包 allowlist（REQ-001）`、`开发内容排除（REQ-002）` 和 `安装洁净度验证（REQ-003）`。
- **下游同步:** PRD 批准后创建同一 `doc_id` 的 TSD、TVD 和 TED，并回填 frontmatter 的 `related_docs`。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | approved |
| Feature | release-cleanup |
| Doc ID | release-cleanup |
| 文档类型 | PRD |

关联关系以 frontmatter 的 `related_docs` 字段为准；正文只描述需求点、验收和验证口径。

## 目标

交付一套正式发布包洁净度契约：npm package 和插件安装产物只包含运行所需的 `dist`、`bin`、`skills`、manifest、README、LICENSE、INSTALL/SECURITY/RELEASE-NOTES 等用户需要的文件，并通过发布前解包检查和新环境安装验证证明产物干净、整洁、可运行。

## 非目标

- NON-001：本阶段不执行真实 npm publish、GitHub Release 发布、tag 创建或版本号提升；发布动作需要后续单独批准。
- NON-002：本阶段不删除仓库内的 `docs/coding-plugins/features`、测试 fixture、开发脚本或内部规划文档；只约束它们不得进入用户安装包。
- NON-003：本阶段不改变 PRD/TSD/TVD/TED/VED 文档链路和中文模板内容；中文用户为主的产品定位保持不变。
- NON-004：本阶段不重写 skills 的职责边界；skills 专项优化已经由 `skills-optimization` 链路处理。

## 背景

- 当前行为：`package.json.files` 仍包含 `docs/`、`src/`、`skills/`、`hooks/`、`assets/` 等大范围目录，现有 package 测试也要求部分 `src/*.ts` 进入包以支持 release CLI。这让正式发布包容易携带仓库开发文档、feature 链路、测试上下文或未发布规划内容。
- 目标用户或调用方：通过 Codex、Claude Code、Gemini CLI、本地 skills client 或 npm package 安装 Coding Plugins 的中文用户，以及维护正式发布流程的开发者。
- 约束：发布包必须继续支持 Node.js >=22.6、现有 `coding-plugins` bin、doctor/preflight/manifest 检查和 Chinese-first 用户文档；实现前必须先证明哪些源码或资源确实是运行时必需。

## 需求总览

| 需求点 | 标题 | 优先级 | 类型 | 验证方式 |
| --- | --- | --- | --- | --- |
| REQ-001 | 发布包 allowlist | 必须 | maintenance | npm pack 文件清单契约测试 |
| REQ-002 | 开发内容排除 | 必须 | maintenance | package denylist 扫描和 fixture 回归 |
| REQ-003 | 安装洁净度验证 | 必须 | maintenance | tarball 解包安装 smoke test |
| REQ-004 | 中文用户优先的分发体验 | 必须 | maintenance | 安装文档与 doctor 输出验收 |

## 发布包 allowlist（REQ-001）

### 用户或系统价值

用户安装 Coding Plugins 后看到的是运行插件所需的清晰文件集合，而不是整个开发仓库。维护者也能从单一 allowlist 判断某个新增文件是否允许进入正式发布包。

### 需求描述

正式发布包必须基于明确 allowlist。默认允许进入包的内容只包括运行入口、构建产物、agent-facing skills、平台 manifest、用户安装/安全/发布说明和运行时必需资源；任何新增目录或文件类型都必须说明用户安装时的必要性，并由 package 文件清单测试覆盖。

### 行为规则

- `bin/`、`dist/`、`skills/`、平台 manifest、`README.md`、`INSTALL.md`、`SECURITY.md`、`LICENSE`、`RELEASE-NOTES.md` 和运行必需资源可以进入正式发布包。
- `src/` 只能在有明确运行时必要性且没有 `dist` 替代时进入包；否则发布包必须依赖已构建的 `dist`。
- `hooks/`、`assets/`、`.agents/skills`、`.codex-plugin/`、`.claude-plugin/`、`.opencode/` 等平台集成文件必须逐项证明安装时可见或运行时必要，不能靠目录级宽泛包含。
- package allowlist 必须同时覆盖 npm package 和插件 artifact 的用户可见边界。

### 输入与输出

- 输入：仓库发布配置、npm pack 输出、plugin manifest、平台安装入口和 release checklist。
- 输出：稳定的正式发布包文件集合，以及能解释每类文件为什么允许发布的验收记录。

### 关联契约

- API / SDK / CLI：涉及 `coding-plugins` bin、doctor、preflight、manifest-check、prepare-release、security-audit 等发布前命令的可用性。
- Schema / 数据：涉及 `package.json.files`、plugin manifest 和 npm pack 文件清单。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：发布包收紧不得破坏现有安装、doctor 或 workflow CLI。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 新增目录被宽泛加入 package allowlist，但没有用户安装必要性说明。 | package 审计失败，要求改为更窄 allowlist 或补充运行必要性。 | npm pack 文件清单契约测试 |
| ERR-002 | 包内缺少 `coding-plugins` bin、`dist` 入口、manifest 或用户安装说明。 | 安装 smoke test 失败，阻止发布。 | tarball 安装 smoke test |

### 验收标准

- AC-001：发布包文件清单可解释。
  - 前置条件：完成 release package 配置调整。
  - 操作：执行真实 `npm pack --dry-run --json` 或等价文件清单审计。
  - 期望结果：清单只包含 allowlist 内容，且每个顶层目录都有运行或用户安装理由。

### 验证方式

- 验证类型：契约测试和人工发布审查。
- 覆盖对象：npm package 文件清单、plugin artifact 文件清单和 manifest 指向的用户可见文件。
- 后续沉淀：具体测试用例写入 TVD，执行任务写入 TED，实际证据写入 VED。

## 开发内容排除（REQ-002）

### 用户或系统价值

正式安装用户不应该看到仓库内部的 feature 文档链、测试 fixture、待办文件、草稿、缓存或本地开发状态。维护者可以放心在仓库继续保留研发资料，同时不把它们发布给用户。

### 需求描述

发布流程必须明确排除开发、测试、临时和规划内容。排除规则必须覆盖 `docs/coding-plugins/features`、测试 fixtures、待办文件、未发布草稿、工作区缓存、构建中间产物、编辑器缓存、Python cache、临时证据文件和任何仅服务仓库开发的文件。

### 行为规则

- `docs/coding-plugins/features`、PRD/TSD/TVD/TED/VED、`todo.md` 和内部规划文档不得进入用户安装包。
- `tests/`、`tests/fixtures/`、测试快照、压力测试原始输入和 fixture manifest 不得进入用户安装包。
- `.git/`、本地缓存、临时文件、`__pycache__`、`.pyc`、日志和 workspace state 不得进入用户安装包。
- 如果某个用户文档必须保留中文内容，例如 `README.md` 或 `INSTALL.md`，不得因为排除中文内部文档而误删。

### 输入与输出

- 输入：发布包候选文件清单、仓库开发目录、文档链路、测试 fixture 和待办文件。
- 输出：不包含开发/测试/规划内容的安装包，以及对中文用户文档保留范围的明确说明。

### 关联契约

- API / SDK / CLI：不涉及新增 CLI 契约，但 release audit 必须能报告违规文件。
- Schema / 数据：涉及 package denylist 和文件路径匹配规则。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：排除规则不得误删运行时 skills、用户安装文档或 manifest 引用文件。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-003 | 包内出现 `docs/coding-plugins/features`、`todo.md`、`tests/fixtures` 或未发布草稿。 | 发布审计失败，并报告具体路径。 | package denylist 扫描 |
| ERR-004 | denylist 误伤 `README.md`、`INSTALL.md`、`skills/` 或 manifest 必需文件。 | 安装 smoke test 或 manifest 检查失败。 | tarball 安装 smoke test |

### 验收标准

- AC-002：开发内容不进入安装包。
  - 前置条件：完成 allowlist 和 denylist 配置。
  - 操作：解包正式候选 tarball 并扫描所有路径。
  - 期望结果：用户安装包没有内部 feature 文档、测试 fixture、待办文件、缓存或临时文件。

### 验证方式

- 验证类型：契约测试、路径扫描和人工发布审查。
- 覆盖对象：`docs/coding-plugins/features`、`tests/fixtures`、`todo.md`、缓存和临时文件。
- 后续沉淀：TVD 需列出允许中文用户文档和禁止内部中文文档的边界样例。

## 安装洁净度验证（REQ-003）

### 用户或系统价值

发布前不只看配置，而是用真实打包、解包和全新安装证明用户拿到的插件能运行、能自检，并且安装目录整洁。

### 需求描述

发布流程必须增加安装包洁净度验证。验证应基于真实 npm pack 产物或等价 plugin artifact，创建隔离安装目录，执行安装后的 `coding-plugins` 入口、doctor、manifest 或 preflight smoke，并检查包内没有仓库专用配置依赖。

### 行为规则

- 验证必须检查真实 pack 输出，而不是只读取 `package.json.files`。
- 安装 smoke test 必须在隔离目录中运行，不能依赖仓库根目录的 `src/`、`tests/`、`tsconfig` 或本地构建缓存。
- `coding-plugins doctor` 或等价命令必须能报告安装状态，且输出不应提示用户处理仓库开发文件。
- release audit 必须把文件清单违规、安装失败和 manifest 缺失作为阻断发布的问题。

### 输入与输出

- 输入：候选 tarball、隔离 npm cache、临时安装目录和安装后命令输出。
- 输出：可复现的安装洁净度证据，证明用户安装包干净、整洁、可运行。

### 关联契约

- API / SDK / CLI：涉及 `coding-plugins doctor`、`preflight`、`manifest-check`、`security-audit --strict-release` 或等价发布前命令。
- Schema / 数据：涉及 package 解包文件清单和审计结果 JSON。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：验证命令不得依赖当前开发工作区才能通过。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-005 | 安装后的 bin 需要仓库 `src/*.ts`、`tsconfig`、测试 fixture 或未打包文件才能运行。 | 安装 smoke test 失败，阻止发布。 | tarball 安装 smoke test |
| ERR-006 | release audit 只检查配置，没有解包真实产物。 | 测试设计失败，要求改为真实 pack 检查。 | TVD 契约审查 |

### 验收标准

- AC-003：新环境安装后可运行。
  - 前置条件：构建并生成候选发布包。
  - 操作：在隔离目录安装候选包，运行 `coding-plugins --help`、doctor 或等价 smoke 命令。
  - 期望结果：命令成功，安装目录没有内部开发内容，输出面向普通用户而不是仓库维护者。

### 验证方式

- 验证类型：集成测试、契约校验和人工发布审查。
- 覆盖对象：真实 tarball、安装目录、bin 入口、doctor/preflight smoke 和审计输出。
- 后续沉淀：VED 必须记录最终 pack 文件清单摘要和安装 smoke 命令结果。

## 中文用户优先的分发体验（REQ-004）

### 用户或系统价值

中文用户是主要使用者。发布包瘦身不能把必要中文安装说明、团队 release checklist 或用户定位文案误删，也不能把 agent-facing skill 英文化工作和用户文档中文可读性混为一谈。

### 需求描述

正式发布包必须保留面向中文用户的安装、使用、安全和发布说明，同时保持 skills 的 agent-facing 英文表面。用户安装后应能通过 README/INSTALL/doctor 直接完成启用和验证插件；内部 PRD/TSD/TVD/TED/VED 不应作为用户安装说明被发布。

### 行为规则

- `README.md`、`INSTALL.md`、`SECURITY.md`、`RELEASE-NOTES.md` 可以保留中文内容，并应继续说明 Chinese-first 用户定位。
- `skills/*/SKILL.md` 继续遵循已落地的 English agent-facing 表面，不在本链路重新翻译。
- 用户安装包不得把内部 feature 文档当作安装说明，也不得要求用户阅读 PRD/TSD/TVD/TED/VED 才能完成安装。
- doctor 或安装说明中的错误提示必须指向用户可执行动作，而不是仓库维护流程。

### 输入与输出

- 输入：README、INSTALL、SECURITY、RELEASE-NOTES、skills 和 doctor 输出。
- 输出：中文用户可直接使用的安装体验，以及 agent-facing skill 表面不回退的分发结果。

### 关联契约

- API / SDK / CLI：涉及 `doctor` 输出和安装验证命令的用户可读性。
- Schema / 数据：不涉及新增 schema。
- 状态机 / 生命周期：不涉及。
- 维护 / 迁移 / 回归：必须兼容 `skill-internationalization` 链路已确认的中文用户优先和 English skill 表面边界。

### 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-007 | 发布包瘦身删除中文用户安装说明。 | 文档验收失败，要求恢复用户文档。 | 安装文档审查 |
| ERR-008 | 发布包重新引入中文 agent-facing skill 文案或内部中文 feature 文档。 | i18n/package 回归失败。 | i18n 和 package 契约测试 |

### 验收标准

- AC-004：安装体验面向中文用户保持清晰。
  - 前置条件：完成发布包收紧。
  - 操作：检查发布包内用户文档和安装后 doctor 输出。
  - 期望结果：用户能通过中文 README/INSTALL 完成安装验证，且不会看到内部 feature 文档或待办文件。

### 验证方式

- 验证类型：文档验收、i18n 回归和 package 契约测试。
- 覆盖对象：README、INSTALL、SECURITY、RELEASE-NOTES、skills 和 doctor 输出。
- 后续沉淀：TVD 需覆盖中文用户文档保留与内部文档排除的组合场景。

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | 契约测试 / 人工发布审查 | npm pack 文件清单只包含 allowlist 内容；TVD/VED 创建后回填命令。 | 计划中 |
| REQ-002 | 路径扫描 / 契约测试 | 解包扫描拒绝 feature docs、fixtures、待办文件、缓存和临时文件；TVD/VED 创建后回填命令。 | 计划中 |
| REQ-003 | 集成测试 / 安装 smoke | 隔离目录安装候选包并运行 bin、doctor 或 preflight smoke；TVD/VED 创建后回填命令。 | 计划中 |
| REQ-004 | 文档验收 / i18n 回归 | 中文用户文档保留、agent-facing skill 表面不回退；TVD/VED 创建后回填命令。 | 计划中 |
