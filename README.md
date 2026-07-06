<h1 align="center">Coding Plugins</h1>

<p align="center">
  <strong>面向 Codex、Claude Code、Gemini CLI 和本地 skills 客户端的中文 AI 编码工作流插件</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://github.com/Vincen-dev/coding-plugins/stargazers"><img src="https://img.shields.io/github/stars/Vincen-dev/coding-plugins" alt="GitHub Stars"></a>
  <a href=".codex-plugin/plugin.json"><img src="https://img.shields.io/badge/plugin-coding--plugins-orange" alt="Coding Plugins plugin"></a>
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/security-policy-green" alt="Security Policy"></a>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> |
  <a href="INSTALL.md">安装</a> |
  <a href="#为什么需要它">为什么</a> |
  <a href="#核心-skills">Skills</a> |
  <a href="#工作流">工作流</a> |
  <a href="#平台支持">平台支持</a> |
  <a href="#常见问题">FAQ</a>
</p>

---

中文 AI 编码工作流插件：把“先想清楚要做什么”和“代码真正按计划落地”连成一条可验证链路。

Coding Plugins 支持 Codex、Claude Code、Gemini CLI、GitHub Copilot CLI，以及 OpenCode / Trae / Qoder / Cursor 等可加载本地 `skills/` 的客户端。它提供一组中文 skills、提示词模板、脚本和文档契约，用来约束 AI 编码代理：先收敛需求，再写规格和 TED 任务执行文档，再小步实现、测试、评审、提交和收尾。

## 为什么需要它

用 AI 写代码时，常见失控点不是“模型不会写代码”，而是流程没有边界：

- **需求还没说清楚，代码已经开始改。** 你说“加个权限控制”，代理马上改几十个文件，最后才发现 RBAC、ABAC、页面权限和接口权限根本不是一回事。
- **计划文档写了，但执行阶段仍然跑偏。** PRD、技术设计、测试用例都在，真正实现时却没有人检查任务是否 stale、测试是否先失败、评审是否独立、提交是否安全。
- **长会话和多代理协作容易丢状态。** 会话压缩、子代理上下文过大、重复读取上游文档、任务之间没有稳定 hash，都会让流程成本变高。

Coding Plugins 用一组机器可检查的约束把这些风险收住：

```text
brainstorming
  -> requirements / technicals / test-cases
  -> TED execution plan
  -> workflow state + guard + brief
  -> TDD implementation
  -> spec review + code review
  -> verification
  -> Chinese Conventional Commit
  -> branch finishing
```

| 设计原则 | 说明 |
| --- | --- |
| Spec First | 需求、技术设计、测试用例和 TED 未准备好时，不急着实现 |
| Task Contract | 用户级入口先运行 Coding Plugins CLI 的 `task status`，再选择 skill，避免纯对话判断 |
| TED Contract | 执行阶段以当前任务章节、生成的 execution contract 和 `source_hash` 为准 |
| Guarded Execution | `workflow-state.ts`、`workflow-guard.ts`、`workflow-brief.ts` 负责状态、新鲜度和短上下文 |
| TDD Discipline | 生产代码前先写失败测试，完成后记录 TDD Evidence 或例外 |
| Review Gate | 子代理实现后做规格符合性和代码质量评审 |
| Commit Safety | 按用户选择语言生成 Conventional Commit，检查作者身份、敏感文件和 `Authored-by` footer |
| Multi-platform | 同一套 `skills/` 支持多种 AI 编码客户端 |

## 适用场景

### 推荐使用

| 场景 | 原因 |
| --- | --- |
| 中大型功能开发 | 需要需求、技术设计、测试用例、执行计划和评审门禁 |
| 棕地项目维护 | 先读现有结构，再把变更压到明确任务和验证命令 |
| 安全、数据、权限、同步、支付等高风险变更 | 需要可追踪 Spec ID、测试证据和评审记录 |
| 多代理或多任务执行 | 需要子代理提示词、prompt hash、执行锁定区和主代理复核 |
| 长期维护的插件或工具链 | 需要 metadata、索引、preflight、release 规则保持一致 |
| 需要提交和严格收尾 | 提交前确认语言、检查 diff、作者身份、敏感文件和最新验证 |

### 不推荐直接走完整链路

| 场景 | 建议 |
| --- | --- |
| 一次性脚本、纯问答、代码解释 | 直接分析或小范围编辑即可 |
| 已完全明确的 1 到 2 文件小修 | 走 `test-driven-development`，必要时写 inline spec |
| 纯格式整理 | 保持行为不变，跑针对性验证即可 |

### 经验法则

如果这个改动需要向团队解释超过 5 分钟，或者失败后会影响用户数据、安全、发布、支付、同步、权限和长期维护，就应该进入 Coding Plugins 的正式链路。

## 推荐使用方式

入口永远从 Coding Plugins CLI 的 `task start|continue|status` 开始。Codex 插件安装后，SessionStart 会注入本次可用的 `CP_CLI` fallback；用户不需要先把 `coding-plugins` 安装到全局 PATH。

安装后告诉 Agent：

```bash
${CP_CLI} task start --intent "我要实现 <功能>" --root .
```

如果已经安装终端快捷命令，也可以直接运行：

```bash
coding-plugins task start --intent "我要实现 <功能>" --root .
```

如果想在普通终端长期使用 `coding-plugins` 命令，先检查再显式安装 shim：

```bash
${CP_CLI} cli status --format json
${CP_CLI} cli install --scope user
```

已有正式文档链时：

```bash
${CP_CLI} task status --root . --feature <feature> --doc-id <doc-id> --intent "开始执行"
```

`using-coding-plugins` 仍是 skill 层入口，但不再替代用户级 CLI 判断。正式 PRD/TSD/TVD/TED/VED 工作必须先让 `task status`、`state`、`validate`、`workflow-guard` 或 `execution-contract` 给出状态和下一命令，再进入对应 skill。

## 工作流

```text
你说：“帮我做一个权限控制”
        |
        v
${CP_CLI} task start
  检查 intent、state、schema 和文档链，输出下一命令和 skill
        |
        v
brainstorming
  先问清目标、边界、方案和是否值得做
        |
        v
spec-driven-development
  编排 README / PRD / TSD / TVD / TED / VED
        |
        v
writing-requirements -> writing-technicals -> writing-test-cases -> writing-plans
  需求、技术设计、测试用例和 TED 任务执行文档落盘
        |
        v
state + validate + workflow-guard + execution-contract
  检查 .coding-plugins.yaml、schema、source_hash、新鲜度和执行契约
        |
        v
subagent-driven-development 或 executing-plans
  每个任务小步实现，优先用 subagent-prompt-builder.ts 生成稳定提示词
        |
        v
test-driven-development
  RED -> GREEN -> REFACTOR，记录 TDD Evidence
        |
        v
requesting-code-review -> receiving-code-review
  规格符合性和代码质量评审，重要问题先修再继续
        |
        v
verification-before-completion
  新鲜验证通过后才声明完成
        |
        v
git-commit -> finishing-a-development-branch
  用户选择语言、Authored-by footer、分支收尾
```

关键约束：

- TED 未批准、缺 `source_hash` 或 stale 时，不进入执行。
- 执行阶段默认只读当前 TED 任务章节、执行锁定区和必要短上下文。
- 子代理不得自己吞完整计划和上游 PRD/TSD/TVD。
- 评审提示词必须使用真实实现报告，代码质量评审必须使用真实 `base/head` SHA。
- 没有新鲜测试、构建、preflight 或人工验收证据，不能声明完成。

完整链路见 [docs/workflow-chain.md](docs/workflow-chain.md)。

## 核心能力

| 能力 | 对应文件或脚本 |
| --- | --- |
| 统一入口和用户级状态 | `src/cli/workflow/task.ts`, `src/lib/workflow/task-status.ts`, `src/cli/workflow/start.ts` |
| 工作流状态和 stale detection | `src/cli/workflow/workflow-state.ts`, `src/lib/workflow/workflow-state.ts` |
| 执行门禁 | `src/cli/workflow/workflow-guard.ts`, `src/lib/workflow/workflow-guard.ts` |
| 执行契约生成 | `src/cli/workflow/execution-contract.ts`, `src/lib/workflow/execution-contract.ts` |
| 文档 schema/parser | `src/cli/documents/validate.ts`, `src/lib/documents/document-schema.ts` |
| 用户级检查和注入 | `src/cli/documents/doctor.ts`, `src/cli/documents/list.ts`, `src/cli/platform/inject.ts` |
| 插件版本漂移诊断 | `coding-plugins doctor --root <repo> --codex-home ~/.codex --format json`，检查 cache manifest 和 `codex plugin list --json` 的 installed/enabled/version |
| Cursor/Copilot 安装 | `src/cli/platform/install-cursor.ts`, `src/cli/platform/install-copilot.ts` |
| 短上下文生成 | `src/cli/workflow/workflow-brief.ts` |
| 工作流轻重模式判断 | `skills/using-coding-plugins/scripts/workflow-mode.ts` |
| 子代理提示词生成 | `skills/subagent-driven-development/scripts/subagent-prompt-builder.ts`，`implementer/all` 必须传 `--expected-source-hash` 防止 TED 漂移 |
| 文档 metadata 和索引 | `src/lib/documents/document-metadata.ts`, `src/lib/documents/docs-index.ts` |
| 真实 agent 压力证据 | `src/cli/agents/agent-pressure-harness.ts`, `src/cli/agents/agent-pressure-ingest.ts` |
| 发布前检查 | `src/cli/release/preflight.ts` |
| 版本同步 | `src/cli/release/bump-version.ts`, `.version-bump.json` |
| Release 准备和远程审计 | `src/cli/release/prepare-release.ts`, `src/cli/release/remote-audit.ts` |

顶层 `src/cli/*.ts` 和 `src/lib/*.ts` 保留为兼容入口；新增实现应优先放入对应领域目录。

## 核心 Skills

| # | Skill | 阶段 | 职责 |
| --- | --- | --- | --- |
| 1 | `using-coding-plugins` | 入口 | 判断任务类型，选择正确 skill 和平台工具映射 |
| 2 | `brainstorming` | 构思 | 方案讨论、价值判断、边界收敛，不创建正式文档 |
| 3 | `spec-driven-development` | 编排 | 决定需要哪些正式规格、技术、测试、计划和证据产物 |
| 4 | `document-metadata` | 文档关系 | 维护 frontmatter、README、INDEX 和 `related_docs` 链路 |
| 5 | `writing-requirements` | 需求 | 编写 PRD、API contract、schema、state machine、acceptance 或 maintenance 规格 |
| 6 | `writing-technicals` | 技术 | 编写 TSD 技术方案文档 |
| 7 | `writing-test-cases` | 测试设计 | 编写 TVD 测试用例文档 |
| 8 | `writing-plans` | 执行计划 | 编写 TED 任务执行文档和执行锁定区 |
| 9 | `using-git-worktrees` | 隔离 | 创建或确认隔离工作区 |
| 10 | `subagent-driven-development` | 执行 | 每任务子代理实现，两阶段评审 |
| 11 | `executing-plans` | 执行 | 无子代理时按 TED 检查点内联执行 |
| 12 | `test-driven-development` | 实现 | RED-GREEN-REFACTOR 和 TDD Evidence |
| 13 | `systematic-debugging` | 调试 | 根因定位、假设验证、防御式修复 |
| 14 | `dispatching-parallel-agents` | 并行 | 拆分多个独立任务或调查方向 |
| 15 | `requesting-code-review` | 评审 | 代码评审请求和严重级别报告 |
| 16 | `receiving-code-review` | 修复反馈 | 验证评审反馈，再决定是否修改 |
| 17 | `verification-before-completion` | 验证 | 声明完成前运行并阅读验证输出 |
| 18 | `git-commit` | 提交 | 用户选择语言的 Conventional Commit、作者身份和敏感文件检查 |
| 19 | `finishing-a-development-branch` | 收尾 | merge、PR、保留或清理分支 |
| 20 | `writing-skills` | 插件维护 | 创建、优化和测试技能 |

## 快速开始

### 安装

完整安装说明见 [INSTALL.md](INSTALL.md)。

| 平台 | 推荐方式 |
| --- | --- |
| Codex CLI | `codex plugin marketplace add https://github.com/Vincen-dev/coding-plugins.git` 后 `codex plugin add coding-plugins@coding-plugins` |
| Codex App | 先用 CLI 添加 marketplace，再在 App 插件面板启用 |
| Claude Code | `claude --plugin-dir /absolute/path/to/coding-plugins` |
| Gemini CLI | `gemini extensions install https://github.com/Vincen-dev/coding-plugins` |
| GitHub Copilot CLI | `${CP_CLI} install-copilot --root <project>` 写入 `.github/copilot-instructions.md`，并确保 `.gitignore` 忽略 `docs/coding-plugins/` |
| OpenCode / Trae / Qoder / Trae CN | clone 仓库，把 `skills/` symlink 或复制到客户端技能目录 |
| Cursor | `${CP_CLI} install-cursor --root <project>` 写入 `.cursor/rules/coding-plugins.mdc`，并确保 `.gitignore` 忽略 `docs/coding-plugins/` |

### 使用

新需求：

```text
${CP_CLI} task start --intent "我要实现 <功能>" --root .
```

已有 TED：

```bash
${CP_CLI} task status --root . --feature <feature> --doc-id <doc-id> --intent "继续执行"
coding-plugins execution-contract generate --root . --feature <feature> --doc-id <doc-id> --write
```

小修：

```text
这是一个小型明确变更，按 test-driven-development 修复。
```

提交：

```text
提交代码。
```

### 验证插件仓库

本仓库 CLI 直接运行 TypeScript 文件，需要 `Node.js >=22.6`。

```bash
npm run preflight
git diff --check
```

修改 Codex hook 时额外运行：

```bash
bash tests/hooks/test-session-start.sh
```

维护真实 agent pressure 证据时运行：

```bash
npm run agent-pressure-harness:ts -- --output artifacts/agent-pressure-harness.json
npm run agent-pressure-ingest:ts -- --input raw-agent-pressure.json --output tests/fixtures/formal-feature-chain/agent-pressure-results.json --split-cases --fixture-manifest --run-id 2026-07-04-agent-pressure-001 --source-contract docs/coding-plugins/scenario-routing.json --prune-stale
```

`--fixture-manifest` 会生成正式分片索引，`--prune-stale` 只在确认要同步删除旧分片时使用。

## 文档目录约定

默认文档路径：

```text
docs/coding-plugins/
└── features/
    └── <feature-name>/
        ├── README.md
        ├── requirements/<doc-id>-PRD.md
        ├── technicals/<doc-id>-TSD.md
        ├── test-cases/<doc-id>-TVD.md
        ├── plans/<doc-id>-TED.md
        └── evidences/<doc-id>-VED.md
```

实际 feature 根目录是 `docs/coding-plugins/features/<feature-name>/`。

统一索引：

```text
docs/coding-plugins/INDEX.md
```

新增、移动或删除 feature 文档后运行：

```bash
npm run preflight -- --write-index
npm run preflight
```

文档 metadata 规则见 [docs/coding-plugins/document-contract.md](docs/coding-plugins/document-contract.md)。

## 平台支持

| 平台 | 支持方式 | 入口 | 备注 |
| --- | --- | --- | --- |
| OpenAI Codex CLI | `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json` | `coding-plugins:using-coding-plugins` | 包含 `hooks/hooks-codex.json` SessionStart hook |
| OpenAI Codex App | CLI 添加 marketplace 后在 App 启用 | `coding-plugins:using-coding-plugins` | 更新后重启 App |
| Claude Code | `.claude-plugin/plugin.json` | `/coding-plugins:using-coding-plugins` | 修改插件后运行 `/reload-plugins` |
| Gemini CLI | `gemini-extension.json` + `GEMINI.md` | `using-coding-plugins` | 安装后读取 Gemini 上下文 |
| GitHub Copilot CLI | 根 `plugin.json` | `using-coding-plugins` | 通用插件 manifest 已准备，安装命令待平台确认 |
| OpenCode / Trae / Qoder / Trae CN | `.agents/skills` 文本入口指向 `../skills`，或复制 `skills/` | `using-coding-plugins` | 本地 skills 客户端 |
| Cursor | 本地 `skills/` symlink/copy | `using-coding-plugins` | 后续可补一键安装脚本 |

## 安全与发布

- 安全策略见 [SECURITY.md](SECURITY.md)。
- 安装和发布细节见 [INSTALL.md](INSTALL.md)。
- 版本同步由 [.version-bump.json](.version-bump.json) 管理。
- 发布前运行 `npm run preflight`。
- 推送 tag 后由 `.github/workflows/release.yml` 创建 GitHub Release。

## 常见问题

### Coding Plugins 和普通 prompt 有什么区别？

普通 prompt 依赖本次会话的临时记忆。Coding Plugins 把流程拆成可复用 skills、模板、脚本和文档契约，并用 preflight、workflow guard、VED 证据文档、agent pressure fixture 等机制做回归。

### 一定要写完整 PRD/TSD/TVD/TED/VED 吗？

不一定。小型明确变更可以走 `test-driven-development` 或 workflow mode 的轻量路径。影响外部行为、数据、安全、发布或长期维护的变更，才应该进入完整链路。

### 子代理会不会消耗更多 token？

会增加调度成本，但通过 `workflow-brief.ts`、`subagent-prompt-builder.ts`、按 `--kind` 过滤 JSON 输出、prompt hash 和执行锁定区，可以减少重复上下文。复杂任务中，子代理成本换来的是更低跑偏率和更强评审隔离。

### 为什么要保留 TED？

TED 是执行阶段的合约。它把 Spec ID、任务、文件范围、验证命令、VED 记录要求和完成检查放在同一份文档里，让代理知道每一步该改什么、怎么证明完成、什么时候必须回退。

### 能和项目已有文档体系共存吗？

可以。默认路径是 `docs/coding-plugins/`，但用户或团队已有约定时优先使用已有约定。跨仓库或本机绝对路径引用应写入 `external_references`，本仓库 feature 文档中的本地引用会在 `npm run preflight` 中默认审计。

### 为什么提交规则这么严格？

提交是工作流边界。`git-commit` 会检查 diff、作者身份、敏感文件和 `Authored-by` footer，避免把 AI 作者、秘密信息或多个无关变更混进一次提交。

## 版本历史

变更记录见 [RELEASE-NOTES.md](RELEASE-NOTES.md)。
