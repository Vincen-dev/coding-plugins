# Coding Plugins

Coding Plugins 是中文编码代理方法论插件，支持 Codex 和 Claude Code。它由一组可组合的 skills、提示词模板、参考资料和脚本组成，用来约束编码代理在做软件开发时先写清规格、再计划、再小步实现、再验证和收尾。

本插件以 SDD（Specification-Driven Development）和 TDD（Test-Driven Development）为主链路。默认文档路径使用 `docs/coding-plugins/`；如果项目或用户已有约定，以用户约定为准。

Codex 侧包含 SessionStart hook，新建、恢复或清空会话时会注入 `coding-plugins:using-coding-plugins` 入口提示，降低入口技能漏用概率。Claude Code 侧仍通过 `/coding-plugins:<skill-name>` 命名空间手动或按描述触发。

规格、技术设计、计划和 TDD Evidence 的统一检索入口是 [docs/coding-plugins/INDEX.md](docs/coding-plugins/INDEX.md)。文档按 `docs/coding-plugins/features/<area>/<capability>/` 集中维护；新增或移动相关产物后运行 `python3 scripts/preflight.py --write-index` 重新生成总索引，`python3 scripts/preflight.py` 会校验索引和真实文件树完全一致。文档分层和 metadata-first 读取规则见 [docs/coding-plugins/document-contract.md](docs/coding-plugins/document-contract.md)。

## 工作方式

当代理看到你要构建或修改东西时，它不应该直接写代码。它会先把需求收敛成可追踪、可测试、可评审的规格。规格通过后，它会把技术实现方案写入独立 technical design，再写出足够具体的实现计划：文件、代码、测试、命令、预期结果都要写清楚。

之后进入实现阶段。推荐使用子代理驱动开发：每个任务由新子代理实现，主代理在任务之间做规格符合性和代码质量评审。没有子代理能力时，也可以在当前会话中按批次执行计划并设置人工检查点。

## 基本流程

1. **using-coding-plugins** - 入口技能。先判断直接意图，再判断开发任务类型。
2. **spec-driven-development** - 实现前激活。把需求、接口、schema、状态机和验收标准写成可测试规格。
3. **writing-technical-design** - 基于已批准规格写独立技术设计，保存到 `docs/coding-plugins/features/<area>/<capability>/technical/technical-design.md`。
4. **writing-plans** - 基于已批准规格和技术设计写实现计划。任务拆到 2 到 5 分钟粒度，并建立 Spec ID -> Test -> Task 追踪。
5. **using-git-worktrees** - 执行前使用。创建隔离 worktree 和新分支，避免污染当前工作区。
6. **subagent-driven-development / executing-plans** - 根据计划执行。优先子代理驱动；没有子代理时内联执行。
7. **test-driven-development** - 实现时强制 RED-GREEN-REFACTOR：先从规格写失败测试，再最小实现，再重构，并把 TDD Evidence 写入 `docs/coding-plugins/features/<area>/<capability>/evidence/tdd-evidence.md`。
8. **requesting-code-review** - 任务之间或合并前评审，按严重级别报告问题。
9. **receiving-code-review** - 收到评审后先验证反馈，再决定是否修改。
10. **git-commit** - 用户要求提交或完成阶段需要提交时，生成中文 Conventional Commit，在 footer 添加本人 `Authored-by` 署名，并禁止 AI 作者或 AI 生成声明。
11. **finishing-a-development-branch** - 所有任务完成后验证测试、提示是否提交、提出合并/PR/保留/丢弃选项并清理。

完整链路说明见 [docs/workflow-chain.md](docs/workflow-chain.md)。安装方式见 [docs/installation.md](docs/installation.md)。

## 技能库

**测试**

- `test-driven-development`：RED-GREEN-REFACTOR 循环，包含测试反模式、压力场景和 TDD Evidence 校验脚本。

**调试**

- `systematic-debugging`：四阶段根因定位流程，包含根因追踪、防御式修复、基于条件等待等参考。
- `verification-before-completion`：声明完成前用证据确认真的修好。

**协作**

- `spec-driven-development`：规格驱动开发，把需求收敛为可测试契约，并提供支持 JSON 输出和多文件校验的规格质量脚本。
- `writing-technical-design`：把批准规格转成独立 technical design，维护技术方案索引。
- `writing-plans`：详细实现计划。
- `executing-plans`：带检查点的批次执行。
- `dispatching-parallel-agents`：并行子代理工作流。
- `requesting-code-review`：代码评审请求模板。
- `receiving-code-review`：处理评审反馈。
- `git-commit`：中文 Conventional Commit，检查作者身份，在 footer 添加本人 `Authored-by` 署名，禁止 AI 作者。
- `using-git-worktrees`：并行开发分支和隔离工作区。
- `finishing-a-development-branch`：分支收尾和集成决策。
- `subagent-driven-development`：每任务子代理实现，两阶段评审。

**元技能**

- `writing-skills`：按照可复用技能最佳实践创建和测试新技能。
- `using-coding-plugins`：中文入口技能。

## 哲学

- **测试驱动开发**：永远先写测试。
- **规格驱动开发**：永远先写清楚可验证契约。
- **系统化优先**：流程胜过猜测。
- **降低复杂度**：简单性是首要设计目标。
- **证据胜过声明**：完成前必须验证。

## 安装说明

本仓库已经包含 Codex marketplace 元数据：

```text
.agents/plugins/marketplace.json
.codex-plugin/plugin.json
hooks/hooks-codex.json
```

从 GitHub 安装：

```bash
codex plugin marketplace add https://github.com/Vincen-dev/coding-plugins.git
codex plugin add coding-plugins@coding-plugins
```

从本地仓库安装：

```bash
codex plugin marketplace add /Users/vincen/workspace/plugins/coding-plugins
codex plugin add coding-plugins@coding-plugins
```

本机个人安装使用 `/Users/vincen/.agents/plugins/marketplace.json` 和 `/Users/vincen/plugins/coding-plugins`，安装命令：

```bash
codex plugin add coding-plugins@personal
```

Claude Code 不使用 Codex marketplace，直接加载插件目录：

```bash
claude --plugin-dir /Users/vincen/workspace/plugins/coding-plugins
```

详细步骤见 [docs/installation.md](docs/installation.md)。

### 发布前检查

提升版本时运行：

```bash
python3 scripts/bump_version.py <version>
```

版本同步目标由 [.version-bump.json](.version-bump.json) 维护。然后更新 [RELEASE-NOTES.md](RELEASE-NOTES.md) 中对应版本的变更记录。

提交、push 或发布前运行：

```bash
python3 scripts/preflight.py --write-index
python3 scripts/preflight.py
```

该命令会运行 SDD/TDD 校验器单测、真实规格样例校验、manifest 版本一致性检查和旧入口残留扫描。GitHub Actions 会在 push 和 pull request 时运行同一命令。

提交并确认工作区干净后，准备公开 release metadata：

```bash
python3 scripts/prepare_release.py --notes-out /tmp/coding-plugins-release-notes.md
```

确认输出 `Release ready: v<version>` 后创建并推送 tag：

```bash
git tag -a v<version> -m "coding-plugins <version>"
git push origin v<version>
```

`.github/workflows/release.yml` 会在 `v*` tag push 后运行 preflight、校验 tag 与 manifest 版本一致，并用当前版本 release notes 创建 GitHub Release。

发布后可手动审计远程 tag、GitHub Release 和直接 push 权限：

```bash
python3 scripts/remote_audit.py --owner Vincen-dev --repo coding-plugins --tag v<version> --expected-pusher Vincen-dev
```

### Codex

Codex 侧通过 `.codex-plugin/plugin.json` 识别插件，并使用 `skills/*/agents/openai.yaml` 提供展示元数据。插件结构校验：

```bash
codex plugin add coding-plugins@personal
bash tests/hooks/test-session-start.sh
```

### Claude Code

Claude Code 侧通过 `.claude-plugin/plugin.json` 识别插件，技能会以 `/coding-plugins:<skill-name>` 形式出现。本地加载：

```bash
claude --plugin-dir ./plugins/coding-plugins
```

常用入口：

```text
/coding-plugins:using-coding-plugins
```

修改插件组件后运行 `/reload-plugins`。更多说明见 [docs/claude-code-usage.md](docs/claude-code-usage.md)。
