# Install

Coding Plugins 是一个本地 AI 编码工作流插件，提供中文构思收敛、SDD/TDD、IPD 执行、系统化调试、代码评审、中文 Git 提交和分支收尾技能。

本插件不依赖远程服务运行。安装后主要暴露 `skills/`、平台 manifest 和可选 SessionStart hook。

本仓库的 CLI 和验证脚本直接运行 TypeScript 文件，要求 `Node.js >=22.6`。CI 和 release workflow 当前使用 Node 22。

Codex 插件安装后，SessionStart 会注入本次可用的 `CP_CLI` fallback。即使 `coding-plugins` 不在 PATH，也可以直接调用插件内 CLI：

```bash
${CP_CLI} task start --intent "我要实现 <功能>" --root .
```

如果希望在普通终端长期输入 `coding-plugins`，先检查再显式安装 shim：

```bash
${CP_CLI} cli status --format json
${CP_CLI} cli install --scope user
```

## 平台总览

| 平台 | 安装 | 升级 | 卸载 |
| --- | --- | --- | --- |
| OpenAI Codex CLI | marketplace | `codex plugin update` 或重新安装 | `codex plugin remove` |
| OpenAI Codex App | CLI + App 插件面板 | CLI 更新后重启 App | App 面板禁用或 CLI 移除 |
| Claude Code | 插件目录加载 | 更新仓库后 `/reload-plugins` | 移除插件目录 |
| Gemini CLI | `gemini extensions install` | `gemini extensions update` | `gemini extensions uninstall` |
| GitHub Copilot CLI | `${CP_CLI} install-copilot --root <project>` 或已安装 PATH 后运行 `coding-plugins install-copilot --root <project>` | 重新运行安装命令 | 删除 `.github/copilot-instructions.md`，按需移除 `.gitignore` 中的 `docs/coding-plugins/` |
| OpenCode / Trae / Qoder / Trae CN | clone + symlink/copy `skills/` | `git pull`，复制安装需重新复制 | 删除 skills 目录 |
| Cursor | `${CP_CLI} install-cursor --root <project>` 或已安装 PATH 后运行 `coding-plugins install-cursor --root <project>` | 重新运行安装命令 | 删除 `.cursor/rules/coding-plugins.mdc`，按需移除 `.gitignore` 中的 `docs/coding-plugins/` |

## OpenAI Codex CLI

从 GitHub marketplace 安装：

```bash
codex plugin marketplace add https://github.com/Vincen-dev/coding-plugins.git
codex plugin add coding-plugins@coding-plugins
```

从本地仓库安装：

```bash
codex plugin marketplace add /absolute/path/to/coding-plugins
codex plugin add coding-plugins@coding-plugins
```

验证：

```bash
codex plugin list
codex plugin marketplace list
```

Codex 会读取 `.codex-plugin/plugin.json`，并在 SessionStart 阶段运行 `hooks/run-hook.cmd session-start-codex` 注入入口提示。

## OpenAI Codex App

先用 Codex CLI 添加 marketplace 和插件：

```bash
codex plugin marketplace add https://github.com/Vincen-dev/coding-plugins.git
codex plugin add coding-plugins@coding-plugins
```

然后重启 Codex App，在插件面板启用 `coding-plugins`。

## Claude Code

本地加载：

```bash
claude --plugin-dir /absolute/path/to/coding-plugins
```

常用入口：

```text
/coding-plugins:using-coding-plugins
/coding-plugins:brainstorming
```

修改插件后在 Claude Code 中运行：

```text
/reload-plugins
```

## Gemini CLI

仓库提供 `gemini-extension.json` 和 `GEMINI.md`：

```bash
gemini extensions install https://github.com/Vincen-dev/coding-plugins
```

升级和卸载：

```bash
gemini extensions update coding-plugins
gemini extensions uninstall coding-plugins
```

## GitHub Copilot CLI

仓库根目录提供通用 `plugin.json`，并提供用户项目注入命令：

```bash
${CP_CLI} install-copilot --root /absolute/path/to/your-project
```

该命令会写入 `.github/copilot-instructions.md`，让 Copilot 在项目内优先使用 Coding Plugins CLI 的 `start`、`state`、`validate` 和 `execution-contract`。同时会确保目标项目 `.gitignore` 包含 `docs/coding-plugins/`，避免默认沉淀文档进入业务仓库提交。默认不会覆盖已有文件；确认替换时使用 `--force`。它不会调用未验证的 `copilot plugin ...` 命令。

## OpenCode / Trae / Qoder / Trae CN

Symlink 安装：

```bash
git clone https://github.com/Vincen-dev/coding-plugins.git
mkdir -p your-project/.agents
ln -s /absolute/path/to/coding-plugins/skills your-project/.agents/skills
```

复制安装：

```bash
mkdir -p your-project/.agents/skills
cp -R /absolute/path/to/coding-plugins/skills/* your-project/.agents/skills/
```

本仓库自身提供 `.agents/skills` 文本入口，内容为 `../skills`，用于在 npm 包和不保留 symlink 的平台中表达同一目标目录。在支持 `.agents/skills` 的客户端中打开仓库根目录即可发现技能；如果当前平台只接受真实目录，可按复制安装方式把 `skills/` 内容复制到目标技能目录。

## Cursor

推荐用安装命令写入项目规则：

```bash
${CP_CLI} install-cursor --root /absolute/path/to/your-project
```

该命令会写入 `.cursor/rules/coding-plugins.mdc`，并确保目标项目 `.gitignore` 包含 `docs/coding-plugins/`，避免默认沉淀文档进入业务仓库提交。默认不会覆盖已有文件；确认替换时使用 `--force`。如需先看变更：

```bash
coding-plugins inject --platform cursor --root /absolute/path/to/your-project --dry-run --format json
```

## 使用

安装完成后，从入口技能开始：

```bash
${CP_CLI} task start --intent "我要实现 <功能>" --root .
```

正式文档链执行前：

```bash
${CP_CLI} task status --root . --feature <feature> --doc-id <doc-id> --intent "继续执行"
coding-plugins validate --root . --format json
coding-plugins state check --root . --json
coding-plugins execution-contract generate --root . --feature <feature> --doc-id <doc-id> --write
${CP_CLI} workflow-guard check --root . --feature <feature> --doc-id <doc-id> --target execute
```

`validate --format json` 默认只输出 section 名称和 hash；需要调试完整正文时再加 `--include-sections`。

常见请求：

- 方案讨论、价值判断或产品方向还不清楚：`brainstorming`
- 新功能或行为变更：`spec-driven-development`
- 小型明确变更：`test-driven-development`
- bug 或 CI 失败：`systematic-debugging`
- 已有 IPD 执行文档：`subagent-driven-development` 或 `executing-plans`
- 完成前验证：`verification-before-completion`
- 提交代码：`git-commit`

## 验证安装

确认客户端能发现 `using-coding-plugins`，并在仓库根目录运行：

```bash
npm run preflight
npm run build
npm run security-audit:ts -- --strict-release --format json
```

如果只验证 Codex hook：

```bash
bash tests/hooks/test-session-start.sh
```

## 故障排查

### Agent 找不到技能

- 检查目标目录下是否存在 `skills/<skill-name>/SKILL.md`。
- 检查插件 manifest 是否指向 `skills/`。
- 本地 skills 客户端使用 symlink 时，确认 symlink 指向真实目录。

### Codex 没有注入入口提示

- 确认 `.codex-plugin/plugin.json` 中声明了 `hooks: ./hooks/hooks-codex.json`。
- 运行 `bash tests/hooks/test-session-start.sh`。
- 重启 Codex 会话或 Codex App。

### 版本不一致

运行：

```bash
npm run preflight
coding-plugins doctor --root /absolute/path/to/coding-plugins --codex-home ~/.codex --format json
```

preflight 会检查 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、根 `plugin.json`、`gemini-extension.json` 和 `.version-bump.json` 的版本同步。
doctor 会额外检查 npm lockfile、dist 入口、Codex hook、`.agents/skills` 入口、Cursor/Copilot 注入 dry-run、Codex 插件缓存版本，以及 `codex plugin list --json` 中的 installed/enabled/version；无法调用 Codex CLI 时会退回解析 `~/.codex/config.toml` 的 enabled 配置。

## NPM 发布边界

包内已输出 `dist/index.js` 和 `dist/index.d.ts`，`package.json` 声明了 `main` 与 `types`。当前 release workflow 仍不执行 `npm publish`；npm 正式发布只允许在 `npm run security-audit:ts -- --strict-release --format json` 通过后手动执行，该严格审计会先运行 build 和 preflight，再检查 npm pack 内容。

## 文档和索引维护

正式文档集中在：

```text
docs/coding-plugins/features/<feature-name>/
```

统一索引是：

```text
docs/coding-plugins/INDEX.md
```

新增、移动或删除 feature 文档后运行：

```bash
npm run preflight -- --write-index
npm run preflight
```

旧项目文档升级到当前 metadata 契约时运行：

```bash
npm run document-contract-migration:ts -- --dry-run
npm run document-contract-migration:ts --
```

`preflight` 默认会校验本仓库 feature 文档中的本地 `external_references`。旧命令仍可显式运行：

```bash
npm run preflight -- --check-external-references
```

## Agent Pressure 维护

```bash
npm run agent-pressure-harness:ts -- --output artifacts/agent-pressure-harness.json
npm run agent-pressure-ingest:ts -- --input raw-agent-pressure.json --output tests/fixtures/formal-feature-chain/agent-pressure-results.json --split-cases --fixture-manifest --run-id 2026-07-04-agent-pressure-001 --source-contract docs/coding-plugins/scenario-routing.json --prune-stale
```

`src/cli/agents/agent-pressure-harness.ts` 用于生成 command/workspace 层压力证据；`src/cli/agents/agent-pressure-ingest.ts` 用于把真实 agent 压力测试输出规范化为 split case fixture。顶层 `src/cli/agent-pressure-*.ts` 保留为兼容入口。`--fixture-manifest` 会生成正式分片索引，`--prune-stale` 只在确认要同步删除旧分片时使用。

## 发布前检查

### 团队发布 checklist

发布默认从 release branch 或 PR 开始；只有紧急修复或仓库维护者明确确认时，才直接在 `main` 上完成提交和 tag。每次发布都按下面顺序记录证据，避免只依赖本地记忆：

1. 确认版本号和 release notes：

   ```bash
   npm run bump-version:ts -- <version>
   ```

2. 在 release branch 或 PR 上完成预检和严格发布审计：

   ```bash
   npm run preflight -- --write-index
   npm run preflight
   npm run security-audit:ts -- --root . --strict-release --format json
   ```

3. 合并或确认 `main` 已包含发布提交后创建 tag：

   ```bash
   npm run prepare-release:ts -- --notes-out /tmp/coding-plugins-release-notes.md
   git tag -a v<version> -m "coding-plugins <version>"
   git push origin v<version>
   ```

4. GitHub Release workflow 完成后审计远程状态：

   ```bash
   npm run remote-audit:ts -- --owner Vincen-dev --repo coding-plugins --tag v<version> --expected-pusher Vincen-dev
   ```

5. 刷新本机 Codex personal 插件缓存，并确认 active 版本：

   ```bash
   codex plugin add coding-plugins@personal
   coding-plugins doctor --root . --codex-home ~/.codex --format json
   ```

提升版本时运行：

```bash
npm run bump-version:ts -- <version>
```

版本同步目标由 [.version-bump.json](.version-bump.json) 维护。提升版本后更新 [RELEASE-NOTES.md](RELEASE-NOTES.md) 中对应版本的变更记录。

提交、push 或分发前运行：

```bash
npm run preflight -- --write-index
npm run preflight
codex plugin add coding-plugins@personal
claude plugin validate /absolute/path/to/coding-plugins --strict
```

提交并确认工作区干净后，准备 GitHub Release：

```bash
npm run prepare-release:ts -- --notes-out /tmp/coding-plugins-release-notes.md
git tag -a v<version> -m "coding-plugins <version>"
git push origin v<version>
```

推送 `v*` tag 后，`.github/workflows/release.yml` 会运行 preflight，校验 tag 与 manifest 版本一致，并调用 `gh release create` 使用当前版本 release notes 创建 GitHub Release。当前 workflow 不执行 `npm publish`；npm package 配置用于打包验证和可选手动分发。

发布后手动审计远程状态：

```bash
npm run remote-audit:ts -- --owner Vincen-dev --repo coding-plugins --tag v<version> --expected-pusher Vincen-dev
```
