---
title: Review Findings Subagents VED
status: approved
feature: review-findings-subagents
doc_id: review-findings-subagents
created: 2026-07-04
updated: 2026-07-04
related_docs: []
external_references: []
---
# Review Findings Subagents VED

覆盖 REQ-001。

## TDD 证据

- **规格/缺陷/验收:** bug 复现：整体 review 发现 CI 缺 npm 依赖安装、scenario routing 契约未被 preflight 保护、npm 包缺 `.agents/skills`、external reference 检查为 no-op、`.version-bump.json` 仍引用 Python。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/npm-package.test.mjs`、`tests/ts/no-python-source.test.mjs`、`tests/ts/preflight-cli.test.mjs`
- **RED 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/npm-package.test.mjs tests/ts/no-python-source.test.mjs tests/ts/preflight-cli.test.mjs`
- **RED 失败:** 3 failures：`.version-bump.json` 旧 Python 入口、npm package 缺 `.agents/skills`、preflight 未纳入 `tests/ts/scenario-routing-contract.test.mjs`。CI `npm ci` 和 external reference no-op 断言位于同一测试链路中，由后续 GREEN 验证覆盖。
- **GREEN 变更:** workflows 在 preflight 前执行 `npm ci`；`.agents/skills` 改为可打包文本入口；`.version-bump.json` 改为 npm TypeScript 命令；preflight 新增 scenario routing contract 测试；`--check-external-references` 改为扫描 feature 文档 frontmatter 的本机引用；新增缺失 external reference 行为测试。
- **GREEN 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/no-python-source.test.mjs tests/ts/npm-package.test.mjs tests/ts/preflight-cli.test.mjs tests/ts/scenario-routing-contract.test.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm pack --dry-run --json` PASS 且包内包含 `.agents/skills`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --check-external-references` PASS；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight` PASS。

## 子代理验证记录

- **Worker A:** 负责 CI、npm package 和版本配置。主线程复验发现真实 `npm pack --dry-run --json` 已包含 `.agents/skills`，说明它没有只改 manifest。
- **Worker B:** 负责 preflight、scenario routing 和 external references。主线程补充了缺失 external reference 行为测试，避免只靠源码字符串断言。
- **Observer:** 指出共享 RED 测试会让单 worker 的 GREEN 受其他任务影响，并要求主线程最终复验 `npm pack` 和完整 preflight。
- **潜在问题:** 子代理容易报告局部 green，但无法证明整体集成；共享测试文件会跨任务耦合；package 行为必须用真实 pack 输出验证；external reference no-op 需要行为测试而非只看日志。

## TDD 证据

- **规格/缺陷/验收:** REQ-001；发布前最终审计发现 evidence-only chain 被误判为 ok、package build script 指向未打包的 `scripts/`、库级 schema API 仍暴露完整 sections、`start` 状态偏移只警告不阻断、state YAML 子集不报错、Cursor/Copilot smoke 缺少真实规则头和适用范围、build lock 仍存在脚本级重复实现。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs`、`tests/ts/npm-package.test.mjs`
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`；`node --test tests/ts/npm-package.test.mjs`
- **RED 失败:** productization 6 failures：`start` mismatch 仍输出 workflow-guard、`validate` 不认识 `--strict-chain` 且 evidence-only 返回 0、unsupported YAML 返回 0、Cursor 文件缺 `alwaysApply`、库 API 仍包含 `sections`；npm package 2 failures：`packageJson.scripts.build` 仍引用 `scripts/`，且缺少 `src/cli/release/build-dist.ts`。
- **GREEN 变更:** `validateDocumentSchemas()` 增加 `includeSections` 和 `allowEvidenceOnly` 选项，CLI 默认 strict 且仅显式 `--allow-evidence-only` 放行；`start` 在 project state 与 document chain 偏移时停止输出执行命令并路由回文档链修复；`.coding-plugins.yaml` v2 parser 对 block scalar、tab、anchor/alias 明确报错；Cursor 注入写入 `.mdc` frontmatter，Copilot 注入写明全局适用范围；build 入口迁到已打包的 `src/cli/release/build-dist.ts` 并复用 runtime build lock；补齐 3 条历史 VED 的 PRD/TSD/TVD/TED 链路和 TED `source_hash`。
- **GREEN 命令:** `node --test tests/ts/productization-cli.test.mjs` PASS 22/22；`node --test tests/ts/npm-package.test.mjs` PASS 8/8；`node --test tests/ts/manifest-checks.test.mjs` PASS 5/5；`node --test tests/ts/src-architecture.test.mjs` PASS 4/4。
- **REFACTOR 命令:** `npm run build`；`rg -n "build-lock\\.mjs|scripts/build-dist|scripts/build-lock|node scripts/build-dist" . -g '!node_modules/**' -g '!.git/**'` 仅剩架构测试中的防回归断言。
- **最终验证:** `node bin/coding-plugins.js doctor --root . --format json` PASS；`node bin/coding-plugins.js validate --root . --format json` PASS，15 documents / 3 complete chains。

## TDD 证据

- **规格/缺陷/验收:** REQ-001；复审发现发布 tarball 安装后没有真实运行验证、`npm run build` 在 `node_modules` 下会直接执行 `.ts` 入口、库级 `validateDocumentSchemas(root)` 默认仍返回完整 sections、state YAML parser 会静默忽略 workflow record 中的未知 key。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/npm-package.test.mjs`、`tests/ts/productization-cli.test.mjs`
- **RED 命令:** `node --test tests/ts/npm-package.test.mjs`；`node --test tests/ts/productization-cli.test.mjs`
- **RED 失败:** npm package 新增 tarball install 测试失败，错误为 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`，说明 published package 的 `build` 脚本不能指向 `src/...ts`；productization 新增两个失败：unknown YAML key 返回 0、默认 `validateDocumentSchemas(fixtureRoot)` 仍包含 `sections`。
- **GREEN 变更:** `package.json` 的 `build` 改为运行 `dist/src/cli/release/build-dist.js`；`build-dist` 在源码仓库中执行真实 tsc，在发布包缺少 tsconfig/typescript 时验证 dist 已打包并成功退出；`validateDocumentSchemas()` 默认返回 section summary，只有 `includeSections: true` 返回正文，并补 overload 类型；state YAML v2 parser 对未知 root、active、workflow 和 transition key 报错；build lock 增加 dead PID stale 检测，避免异常退出后等待完整 stale 窗口。
- **GREEN 命令:** `npm run build` PASS；`node --test tests/ts/npm-package.test.mjs` PASS 9/9；`node --test tests/ts/productization-cli.test.mjs` PASS 23/23；`node --test tests/ts/src-architecture.test.mjs tests/ts/manifest-checks.test.mjs` PASS 9/9。
- **REFACTOR 命令:** `npm run build` 重新生成 dist。
- **最终验证:** 待最终发布前完整验证记录。

## TDD 证据

- **规格/缺陷/验收:** bug 复现：重新整体 review 发现当前 `main` 复用已发布版本号、`.agents/skills` 文档把文本 fallback 误写成 symlink、CASE-INDEX 只验证存在性、`external_references` 仍需显式参数才检查，且 agent pressure split case 中存在无效 JSON。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/npm-package.test.mjs`、`tests/ts/preflight-cli.test.mjs`、`tests/ts/scenario-routing-contract.test.mjs`
- **RED 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/npm-package.test.mjs`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/preflight-cli.test.mjs`；`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/scenario-routing-contract.test.mjs`
- **RED 失败:** `INSTALL.md must describe the repository packaged .agents/skills text fallback`；`external reference checks must not be optional only`；`apr-parallel-real-001.json` JSON parse failure。
- **GREEN 变更:** 版本提升到 `1.0.12` 并补 release notes；默认 preflight 执行 `checkExternalReferences()`；`.agents/skills` 文档改为文本入口描述；scenario routing 测试要求 CASE-INDEX 通过关联 scenario 绑定 real-command agent pressure evidence；修复 split case JSON 转义；文档明确 `Node.js >=22.6` 和当前 release workflow 不执行 `npm publish`。
- **GREEN 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache node --test tests/ts/npm-package.test.mjs tests/ts/preflight-cli.test.mjs tests/ts/scenario-routing-contract.test.mjs`
- **REFACTOR 命令:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight`、`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm pack --dry-run --json`、`NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run prepare-release:ts -- --notes-out /private/tmp/coding-plugins-release-notes.md`、`git diff --check`。

## TDD 证据

- **规格/缺陷/验收:** bug 复现：最终审计发现 `start` 不读取 active workflow state、`.coding-plugins.yaml` 名为 YAML 但写 JSON、schema/parser 仍缺 required sections、strict audit 与 preflight/build 可能并发重写 `dist/`、doctor 只看 cache 不看 Codex enabled、subagent implementer prompt 未强制 expected source hash、secret scan 覆盖偏窄，且大 JSON CLI 输出会被 `process.exit()` 截断。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs`、`tests/ts/npm-package.test.mjs`
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`；`node --test tests/ts/npm-package.test.mjs`
- **RED 失败:** 6 failures：`.coding-plugins.yaml` 输出为 JSON、`start` 缺省参数时 `state` 为 null、`subagent-prompt-builder` 未传 `--expected-source-hash` 仍返回 0、缺 required sections 的 PRD/TSD/TVD 未失败、security-audit 缺 build/preflight lock 和常见 secret prefix；随后用 spawnSync 复现 `validate --format json` 在 48760 字符处被截断。
- **GREEN 变更:** state v2 改为真实 YAML 并兼容旧 JSON/legacy YAML；`start` 自动读取 active `.coding-plugins.yaml`；schema parser 输出 heading sections 并按 PRD/TSD/TVD/TED/VED 校验 required sections；新增 build/preflight 文件锁并支持同进程树可重入；doctor 优先读取 `codex plugin list --json` 校验 installed/enabled/version，失败时 fallback 到 `config.toml`；implementer/all prompt 必须传 `--expected-source-hash`；secret scanner 扩展 GitHub、Slack、Stripe、Google key 和 generic secret assignment；大 JSON CLI 改为设置 `process.exitCode` 自然退出。
- **GREEN 命令:** `node --test tests/ts/productization-cli.test.mjs`；`node --test tests/ts/npm-package.test.mjs`
- **REFACTOR 命令:** `npm run typecheck`；`npm run build`
- **最终验证:** `node --test tests/ts/productization-cli.test.mjs` PASS 16/16；`node --test tests/ts/npm-package.test.mjs` PASS 7/7；spawnSync 运行 `node bin/coding-plugins.js validate --root tests/fixtures/formal-feature-chain --format json` 可完整 `JSON.parse`。

## TDD 证据

- **规格/缺陷/验收:** REQ-001；整体项目复审发现命令入口由 `bin` 手写 map 维护、doctor 缺跨平台汇总、agent pressure 缺长会话压缩 / TED stale / 平台不可用真实命令样本、release 流程仍偏个人本地记忆。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/src-architecture.test.mjs`、`tests/ts/productization-cli.test.mjs`、`tests/ts/agent-pressure-harness.test.mjs`、`tests/ts/npm-package.test.mjs`
- **RED 命令:** `node --test tests/ts/src-architecture.test.mjs`；`node --test tests/ts/productization-cli.test.mjs`；`node --test tests/ts/agent-pressure-harness.test.mjs`；`node --test --test-name-pattern "published docs include a team release checklist" tests/ts/npm-package.test.mjs`
- **RED 失败:** command registry 模块缺失；doctor 缺 `platform-summary`；agent-pressure harness 仍只有 4 条 case 且缺指定 observed behaviors；INSTALL 缺“团队发布 checklist”。随后 package 测试又复现 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`，证明 bin 不能在发布包中直接 import `src/*.ts`。
- **GREEN 变更:** 新增 `src/lib/runtime/command-registry.ts` 和 `src/cli/command-registry.ts`，bin/help/dispatch 改为读共享 registry 且发布包内优先加载 `dist` registry；doctor 新增 `platform-summary` 汇总 Codex/Claude/Gemini/local skills/Cursor/Copilot；agent pressure harness 新增长会话压缩、上游变更导致 TED stale、Codex 不可用三类真实命令样本，并让 ingest 接受 `real_command_negative`；INSTALL 增加团队 release checklist；fixture 合并到 27 条 case 并补齐 execution evidence。
- **GREEN 命令:** `node --test tests/ts/src-architecture.test.mjs` PASS 5/5；`node --test tests/ts/productization-cli.test.mjs` PASS 24/24；`node --test tests/ts/agent-pressure-harness.test.mjs` PASS 1/1；`node --test tests/ts/npm-package.test.mjs` PASS 13/13。
- **REFACTOR 命令:** `node src/cli/agent-pressure-harness.ts --root . --json --output /tmp/coding-plugins-agent-pressure-harness.json`；`node src/cli/agent-pressure-ingest.ts --input /tmp/coding-plugins-agent-pressure-combined.json --output tests/fixtures/formal-feature-chain/agent-pressure-results.json --split-cases --cases-dir agent-pressure-cases --fixture-manifest --run-id 2026-07-04-agent-pressure-002 --source-contract docs/coding-plugins/scenario-routing.json`。
- **最终验证:** `npm test` PASS，preflight 完整通过；`node bin/coding-plugins.js doctor --root . --codex-home /Users/vincen/.codex --format json` PASS，`platform-summary` 为 `codex=ok; claude=ok; gemini=ok; local-skills=ok; cursor=dry-run-ok; copilot=dry-run-ok`；`git diff --check` PASS。

## TDD 证据

- **规格/缺陷/验收:** bug 复现：最终剩余审计发现 validate JSON 默认输出完整 section 正文、state 文件缺少锁和原子写、`start` 未显式报告 project state 与文档链状态不一致、`doctor` 外部 Codex CLI 无 timeout、security audit secret scan 缺真实 pack fixture 行为测试、build lock 逻辑在 build 脚本中重复。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs`、`tests/ts/npm-package.test.mjs`
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`；`node --test tests/ts/npm-package.test.mjs`
- **RED 失败:** 4 failures：`state_mismatch` 未输出、validate JSON 缺 `section_names/section_hashes` 且仍带 `sections`、挂起的 fake `codex` 让 doctor 等待 5457ms、`project-state.ts` 缺 `withStateFileLock` 和 `renameSync`；secret pack fixture 测试已通过，证明当前 scanner 行为已能拦截 `sk_live_...`。
- **GREEN 变更:** `start` 输出 `state_mismatch` 和 warnings；`validate --format json` 默认只输出 section 名称和 sha256，新增 `--include-sections` 调试开关；state 写入使用 per-root lock、临时文件和 `renameSync` 原子替换；doctor 调用 `codex plugin list --json` 增加 timeout 并 fallback 到 `config.toml`；build/preflight lock 统一收敛到 runtime 共享实现；security audit 增加真实 npm pack secret fixture 测试。
- **GREEN 命令:** `node --test tests/ts/productization-cli.test.mjs` PASS 19/19；`node --test tests/ts/npm-package.test.mjs` PASS 8/8。
- **REFACTOR 命令:** `npm run typecheck`；`npm run build`
- **最终验证:** `npm run preflight` PASS；`npm run security-audit:ts -- --root . --strict-release --format json` PASS；`node bin/coding-plugins.js doctor --root . --codex-home /Users/vincen/.codex --format json` PASS；`git diff --check` PASS；并发 `npm run build` + `npm run preflight` 复验两个进程 exit code 均为 0。

## TDD 证据

- **规格/缺陷/验收:** bug 复现：真实会话复盘发现 `coding-plugins` 不在 PATH 时代理会放弃 CLI 校验，skill 读取会硬编码旧 cache 版本，正式 PRD/TSD/TVD/TED/VED 链路能绕过 `start/workflow-guard`，`npm test` 缺少仓库默认验证入口，提交语言规则和中文对话习惯存在冲突。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/productization-cli.test.mjs`、`tests/ts/scenario-routing-contract.test.mjs`、`tests/ts/using-git-commit-skill.test.mjs`
- **RED 命令:** `node --test tests/ts/productization-cli.test.mjs`；`node --test tests/ts/scenario-routing-contract.test.mjs`；`node --test tests/ts/using-git-commit-skill.test.mjs`
- **RED 失败:** productization 失败于 `packageJson.scripts.test` 缺失；scenario routing 失败于 `using-coding-plugins` 未强制正式链路先运行 `coding-plugins start` 且缺 CLI fallback；using-git-commit skill 失败于未声明当前对话语言可作为提交语言偏好。
- **GREEN 变更:** 新增 `npm test -> npm run preflight`；README、INSTALL、平台注入内容和相关 skill 统一写入 `node /absolute/path/to/coding-plugins/bin/coding-plugins.js` fallback；`using-coding-plugins` 强制正式链路先走 `start` 并禁止硬编码旧 cache 版本；TDD evidence 校验补 npm/bin fallback；using-git-commit 允许当前持续对话语言作为提交语言偏好；CASE-INDEX 增加 cache/path/gate 风险描述。
- **GREEN 命令:** `node --test tests/ts/productization-cli.test.mjs` PASS 24/24；`node --test tests/ts/scenario-routing-contract.test.mjs` PASS 7/7；`node --test tests/ts/using-git-commit-skill.test.mjs` PASS 2/2。
- **REFACTOR 命令:** `npm run build`，同步 dist runtime。
- **最终验证:** `npm run preflight` PASS，包含 typecheck、全部 `tests/ts/*.test.mjs`、external reference checks 和 SessionStart hook tests。
