# Release Notes

## 1.0.19 - 2026-07-06

- 修复 `report completion --kind release` 的完成判断，统一复用 release commit、tag、workflow、发布目标和依赖解析五项发布完成标准。
- `doctor` 新增 `--require-env` 阻断模式，可将 GitHub auth、pub.dev auth、SSH host key、FVM、Dart cache 和 build_runner 等环境诊断提升为必需检查。
- 收紧会话锁 fallback：锁定 CLI 路径失效时报告错误并回退到当前 CLI，避免继续指向旧插件缓存。
- 清理已完成 TODO，补充第二次 review 的 TDD evidence 和产品化 CLI 回归测试。
- 提升插件、npm package、lockfile 和版本提升配置到 `1.0.19`。

## 1.0.18 - 2026-07-05

- 将 CLI 命令入口收敛到共享 command registry，避免 `bin` 和帮助文本维护第二套命令映射。
- `doctor` 新增跨平台安装状态汇总，覆盖 Codex、Claude、Gemini、本地 skills、Cursor 和 Copilot。
- 扩展 agent pressure harness 和 fixture，新增长会话压缩、TED stale、平台不可用等真实命令压力样本。
- 增加团队发布 checklist，明确 release branch/PR、preflight、strict audit、tag、remote audit 和本地插件缓存刷新步骤。
- 调整 `using-git-commit` 提交语言策略：用户未明确指定时先沿用历史提交语言，历史缺失或混合时再询问，对话语言只作为最后兜底。
- 提升插件、npm package、lockfile 和版本提升配置到 `1.0.18`。

## 1.0.17 - 2026-07-04

- 强化正式 PRD/TSD/TVD/TED/VED 链路入口，要求先运行 `coding-plugins start`，再按 CLI 状态进入对应 skill 和 `workflow-guard`。
- 为 `coding-plugins` 不在 PATH 的环境补充本地 bin fallback，并同步到 README、INSTALL、TDD evidence 校验和 Cursor/Copilot 注入内容。
- 新增 `npm test` 入口，统一指向完整 `preflight`，并增加回归测试覆盖 CLI fallback、正式链路门禁和提交语言偏好。
- 安装 Cursor/Copilot 项目规则时自动确保 `.gitignore` 忽略 `docs/coding-plugins/`，避免插件沉淀文档默认进入业务仓库提交。
- 提升插件、npm package、lockfile 和版本提升配置到 `1.0.17`。

## 1.0.16 - 2026-07-04

- 修复发布 workflow 在 GitHub Linux runner 上失败的问题：npm pack/install 测试和 release security audit 不再硬编码 macOS `/private/tmp` 缓存路径，改用跨平台临时目录。
- 增加回归测试，防止发布相关源码和测试重新写入 `/private/tmp/codex-npm-cache`。
- 提升插件、npm package、lockfile 和版本提升配置到 `1.0.16`，用于重新发布未完成的 `1.0.15` release。

## 1.0.15 - 2026-07-04

- 调整 `using-git-commit` skill：提交信息语言由用户决定，可使用中文或英文；用户未指定语言时必须先询问。
- 同步 README、workflow 文档、SessionStart hook、子代理提示和完成收尾提示，移除“必须中文提交”的硬性表述。
- 增加 `using-git-commit` 语言契约回归测试，防止核心入口重新强制中文提交信息。
- 提升插件、npm package、lockfile 和版本提升配置到 `1.0.15`。

## 1.0.14 - 2026-07-04

- 提升插件、npm package、lockfile 和版本提升配置到 `1.0.14`，承接发布前审计修复后的远程同步。
- 本次仅提交并推送远程，同时刷新本地插件缓存；不创建 release tag，也不执行 `npm publish`。

## 1.0.13 - 2026-07-04

- 同步插件、npm package、lockfile 和版本提升配置到 `1.0.13`，为远程推送后的下一轮验证保留唯一版本号。
- 本次仅更新版本元数据并推送远程，不创建 release tag，也不执行 `npm publish`。

## 1.0.12 - 2026-07-04

- 提升插件版本，避免当前 `main` 继续复用已发布的 `v1.0.11` 版本号。
- 将 `external_references` 审计纳入默认 preflight，并保留旧参数兼容。
- 增强 scenario routing 契约测试，要求 CASE-INDEX 案例绑定真实 agent pressure command evidence。
- 修正 `.agents/skills` 打包入口文档，明确仓库内使用文本 fallback 指向 `../skills`。
- 修复 agent pressure split case 中无效 JSON 字符串转义。

## 1.0.11 - 2026-07-02

- 同步 Codex 和 Claude manifest 文案，明确插件包含方案讨论和构思收敛入口，提升 `brainstorming` 可发现性。
- 将 Claude Code usage 的推荐入口拆分为默认入口和构思入口，避免误导用户每次启动都直接调用 `brainstorming`。
- 强化 `scenario-routing` 行为测试，要求场景标题唯一，并补齐 PRD、TDD/TID、TCD 到 IPD 的分段链路契约。
- 增加 agent pressure harness 和 ingest 工具，把真实压力测试结果拆成 split case fixture，并在 CI 中保留 command/workspace 层证据。
- 将 `agent-pressure-results.json` 收口为小 manifest，新增正式 fixture manifest、分片 stale 检测和 `--prune-stale` 维护入口。

## 1.0.10 - 2026-07-02

- 新增 `brainstorming` 构思收敛入口，用于方案讨论、头脑风暴、产品方向不清和先分析不落地场景，确认进入落地后再转入 SDD。
- 同步 README、安装文档、Claude Code usage、workflow-chain 和 scenario-routing，明确 `brainstorming` 不创建正式 SDD 产物。
- 扩展行为测试覆盖主要入口场景、Claude usage、Codex 默认提示和 `writing-plans` 的 TED 产物边界。

## 1.0.9 - 2026-07-02

- 增加文档生成决策矩阵，明确不创建文档、轻量例外、计划链路、完整链路和完成链路的适用场景。
- 将 README 轻量例外收口到 `doc_id` 粒度，要求使用 `Doc ID | 规格 ID | 证据` 表避免误豁免同一 feature 下的其他需求链路。
- 按生命周期区分 TED 证据要求：计划链路允许 draft 证据目标，`implemented` 链路必须具备最终验证通过的 TED 覆盖；TID 模板新增 `implementation_mode` 和无代码实现边界。

## 1.0.8 - 2026-07-02

- 新增 `formal-feature-chain` 的 `CASE-INDEX.md` 和 invalid fixture 案例库，把真实维护问题沉淀为可读、可回归的测试案例。
- 增强 traceability closure，要求 PRD 中 `必须` 的 Spec ID 在 TID、TCD、IPD 和 TED 的正式结构中闭环覆盖。
- 新增 `src/cli/scaffold-fixture-case.ts`，用于生成 fixture case 骨架，并在 `writing-skills` 中固定“问题 -> CASE -> RED -> 修复 -> preflight”的插件优化流程。

## 1.0.7 - 2026-07-02

- 扩展 `formal-feature-chain` golden fixture，新增 Creek wrapper API 契约、插件缓存刷新和 metadata 同步三个实战化场景。
- 将 routing fixture 的 TID/TCD 升级到 `IMPL-001`、`TC-001` 章节结构，覆盖最新模板可读性规则。
- 新增多场景 fixture 覆盖测试，确保案例数量和 TID/TCD 章节锚点不会回退。

## 1.0.6 - 2026-07-02

- 收口 `document-metadata`、TDD/TID/TCD/TED 模板的正文 `文档信息`，正文不再重复维护完整路径链路表。
- 将 TID 和 TCD 模板改为“总览 + 独立章节”结构，分别使用 `IMPL-001` 和 `TC-001` 作为稳定阅读锚点。
- 同步入口技能、README、INDEX 和工作链路文档中的 IPD 任务执行文档口径，并新增 preflight 门禁防止旧映射结构回流。

## 1.0.5 - 2026-07-02

- 修正 IPD 英文全称为 `Implementation Procedure Document`，与“任务执行文档”的职责定位保持一致。
- 增加 preflight 模板门禁，防止 IPD 模板继续使用旧的 `Implementation Plan Document`。

## 1.0.4 - 2026-07-02

- 将 IPD 明确定义为 `Implementation Procedure Document`，中文定位调整为任务执行文档。
- 重写 IPD 模板和 `writing-plans` 规则，改为任务总览、TASK ID、逐任务执行步骤、验证方式和 TED 记录要求。
- 将 IPD 技术引用检查改为读取 frontmatter `related_technical`，并新增 preflight 门禁防止 IPD 模板回退到技术方案快照结构。

## 1.0.3 - 2026-07-02

- 将 PRD 模板调整为“需求总览 + 需求点章节”结构，需求点标题统一为 `## 标题（REQ-001）`。
- 收口 PRD 正文中的文档关系和计划任务映射，追踪矩阵只保留验证方式和验证证据。
- 同步 scaffold、SDD 路由说明、章节参考模板和 golden fixture，确保新生成文档不再回到旧的大表结构。

## 1.0.2 - 2026-07-02

- 收口 PRD、TDD、TID、TCD、IPD 和 TED 模板的首屏阅读摘要，提升沉淀文档的人工可读性。
- 修正模板 metadata 漂移，补齐 TDD/TID/TCD 的 `doc_id`，并让 TED 关联 TID 和 TCD。
- 新增 IPD 独立模板和模板契约 preflight，防止模板再次偏离 metadata 链路规则。

## 1.0.1 - 2026-07-02

- 增强 preflight，正式链路闭包要求 approved PRD 同时具备 TDD、TID、TCD 和 IPD。
- 取消 `docs/coding-plugins/features/` 的旧残留扫描排除，避免新 feature 文档继续混入旧契约占位符。
- 新增非生产 golden fixture 和结构化场景路由契约，验证新文档链路而不污染正式 feature 目录。

## 1.0.0 - 2026-07-02

- 发布 1.0.0，确保 Codex personal 插件缓存可刷新到当前仓库的新主链路。
- 收口入口路由为 `writing-requirements`、`writing-technicals`、`writing-test-cases` 和 `writing-plans`，避免继续触发旧 `writing-technical-design` 链路。
- 将 approved PRD 正式链路固定为 PRD、TDD、TID、IPD 和 TED，并通过 metadata、INDEX 和 preflight 保持一致。

## 0.6.29 - 2026-06-29

- 新增 `docs/coding-plugins/document-contract.md`，明确 metadata-first 文档读取顺序、README 边界和生成式索引职责。
- 增强 preflight，校验 feature README frontmatter、禁止 README 手写链路章节，并校验 TDD Evidence metadata 与 related 路径。
- 将 feature README 标签和 TDD Evidence 关联关系迁移到 frontmatter，索引改为从 README `tags` 生成。

## 0.6.28 - 2026-06-29

- 增强行为级测试，固定新需求、Bug、提交、收尾、插件维护和并行任务的场景链路顺序。
- 增加 approved 轻量 feature 的 README 例外契约，并由 preflight 校验。
- 新增 `src/cli/remote-audit.ts` 手动审计 GitHub Release 和直接 push 协作者权限。
- 补充 Claude Code 会话启动提示，以及 SDD/TDD validator 的真实 fixture 回归样例。

## 0.6.27 - 2026-06-29

- 拆出 `scripts/manifest_checks.test.ts`，统一承接 manifest 文件、版本、Codex hook 和资源路径校验。
- 将 `scripts/test_manifest_checks.test.ts` 纳入 preflight 验证链路，防止 manifest 检查职责回流到 `src/cli/preflight.ts`。
- 补充 release tag 发布与只有 `Vincen-dev` 直接 push 的治理计划和验证口径。

## 0.6.26 - 2026-06-29

- 回填 marketplace 规格中已完成验收项的追踪状态和验证证据。
- 更新 artifact-index 技术设计，明确文档索引职责已迁移到 `src/lib/docs-index.ts`。
- 清理过期的 `preflight.ts` 膨胀风险描述，改为固定 docs index 模块边界。

## 0.6.25 - 2026-06-29

- 拆出 `src/lib/docs-index.ts`，统一承接 feature-first 文档索引生成、写入和一致性校验。
- 将 `scripts/test_docs_index.test.ts` 纳入 preflight 验证链路，防止索引职责回流到 `src/cli/preflight.ts`。
- 回填 active specs 的完成状态，并记录 preflight 模块拆分的 TDD Evidence。

## 0.6.24 - 2026-06-29

- 将 feature-first 技术设计和实现计划从 feature root 裸文件迁移到 `technical/technical-design-document.md` 与 `plans/<feature-name>-IPD.md`。
- 增强 preflight，拒绝 feature root 下裸露的 `technical-design-document.md` 和 `implementation.md`，并更新总索引生成规则。
- 同步更新规格、技术设计、实现计划、TDD Evidence、技能模板和链路文档中的新路径契约。

## 0.6.23 - 2026-06-29

- 补齐 `marketplace` feature 的技术设计、实现计划和 TDD Exception Evidence。
- 补齐 `preflight` feature 的技术设计、实现计划和 TDD Exception Evidence。
- 刷新 feature-first 总索引，使 marketplace 和 preflight 都进入完整文档闭环。

## 0.6.22 - 2026-06-29

- 增加 `src/cli/prepare-release.ts`，用于校验 release metadata、生成类似 `v0.6.22` 的 tag 名并提取当前版本 release notes。
- 增加 `.github/workflows/release.yml`，在 `v*` tag push 后运行 preflight、校验 tag 与 manifest 版本一致，并创建 GitHub Release。
- 补齐 `release-management` 的技术设计、实现计划和 TDD Evidence，并让 preflight 校验 release automation 文件。

## 0.6.21 - 2026-06-29

- 修正 Codex SessionStart hook 中的 TDD Evidence 路径，统一为 feature-first 路径。
- 移除 worktree 和分支收尾技能中的旧品牌兼容路径说明。
- 增强 preflight，拦截活跃入口、hooks、skills 和文档中的旧路径、旧入口和旧品牌残留。

## 0.6.20 - 2026-06-29

- 增加生成式 `docs/coding-plugins/INDEX.md`，通过 `npm run preflight -- --write-index` 根据 feature-first 文件树刷新总索引。
- 增强 preflight，校验当前总索引和生成器输出完全一致，防止人工编辑造成索引漂移。
- 补齐 `artifact-index` 的技术设计、实现计划和 TDD Evidence，记录 RED/GREEN/REFACTOR 证据。

## 0.6.19 - 2026-06-26

- 将 `docs/coding-plugins` 迁移为 feature-first 结构，按 `features/<feature-name>` 集中维护规格、技术设计、计划和 TDD Evidence。
- 重建总索引，删除旧分类索引，并为每个 feature root 增加 README 入口。
- 增强 preflight，校验 feature root、README、metadata、旧路径残留和 feature-first Evidence。

## 0.6.18 - 2026-06-26

- 为 Plan 文档增加 frontmatter 和中文 `文档信息` 摘要。
- 更新 Spec、Technical Design 和 Plan 模板，明确机器 metadata key 保持英文、中文摘要用于阅读。
- 增强 preflight，校验 Plan metadata、路径一致性和中文摘要。

## 0.6.17 - 2026-06-26

- 增加 `writing-technicals` skill，将技术实现方案独立维护到 `docs/coding-plugins/technical/`。
- 总索引增加 `Technical` 列，并新增 `docs/coding-plugins/technical/INDEX.md` 专用索引。
- 增强 preflight，校验 technical 文档路径、metadata、Spec/Plan 引用和 Spec ID 追踪。

## 0.6.16 - 2026-06-26

- 增强 preflight，校验 skill metadata、manifest 资源、文档路径、Evidence Spec ID、release notes 和版本配置一致性。
- 增加 `RELEASE-NOTES.md`、`.version-bump.json` 和 `src/cli/bump-version.ts`，支持可重复的版本提升流程。
- 增加入口路由、显式 skill 请求、Claude 命名空间和 SessionStart hook 输出的行为级测试。

## 0.6.15 - 2026-06-26

- 增加 Codex SessionStart hook，在新建、恢复和清空会话时注入 `coding-plugins:using-coding-plugins` 入口规则。
- 增加 `docs/coding-plugins/INDEX.md` 产物总索引，统一检索规格、计划和 TDD Evidence。

## 0.6.14 - 2026-06-26

- 为 Codex 接入 SessionStart hook 基础链路。
- 同步 Claude manifest 版本。

## 0.6.13 - 2026-06-26

- 固定 TDD Evidence 默认落地路径为 `docs/coding-plugins/evidence/<feature-name>/tdd-evidence.md`。
- preflight 自动严格校验 TDD Evidence 文件。
