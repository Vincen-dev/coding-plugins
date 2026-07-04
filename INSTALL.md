# Install

Coding Plugins 是一个本地 AI 编码工作流插件，提供中文构思收敛、SDD/TDD、IPD 执行、系统化调试、代码评审、中文 Git 提交和分支收尾技能。

本插件不依赖远程服务运行。安装后主要暴露 `skills/`、平台 manifest 和可选 SessionStart hook。

## 平台总览

| 平台 | 安装 | 升级 | 卸载 |
| --- | --- | --- | --- |
| OpenAI Codex CLI | marketplace | `codex plugin update` 或重新安装 | `codex plugin remove` |
| OpenAI Codex App | CLI + App 插件面板 | CLI 更新后重启 App | App 面板禁用或 CLI 移除 |
| Claude Code | 插件目录加载 | 更新仓库后 `/reload-plugins` | 移除插件目录 |
| Gemini CLI | `gemini extensions install` | `gemini extensions update` | `gemini extensions uninstall` |
| GitHub Copilot CLI | 通用 `plugin.json` 已准备，安装命令待平台确认 | 跟随仓库更新 | 删除本地插件副本 |
| OpenCode / Trae / Qoder / Trae CN | clone + symlink/copy `skills/` | `git pull`，复制安装需重新复制 | 删除 skills 目录 |
| Cursor | 本地 `skills/` symlink/copy | `git pull`，复制安装需重新复制 | 删除 `.cursor/skills` 中的副本 |

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

仓库根目录提供通用 `plugin.json`，供支持通用插件 manifest 的 Copilot CLI 或兼容客户端读取。

当前不在文档中提供 `copilot plugin ...` 安装、升级或卸载命令，因为尚未用官方文档或本机命令验证该安装接口。发布前如需恢复命令，必须先跑通并记录验证结果。

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

本仓库自身提供 `.agents/skills -> ../skills`，在支持 `.agents/skills` 的客户端中打开仓库根目录即可发现技能。如果当前平台不保留 symlink，可按复制安装方式把 `skills/` 内容复制到目标技能目录。

## Cursor

当前按本地 skills 客户端方式接入：

```bash
mkdir -p your-project/.cursor/skills
ln -s /absolute/path/to/coding-plugins/skills your-project/.cursor/skills/coding-plugins
```

如果客户端只接受扁平目录：

```bash
mkdir -p your-project/.cursor/skills
cp -R /absolute/path/to/coding-plugins/skills/* your-project/.cursor/skills/
```

## 使用

安装完成后，从入口技能开始：

```text
using-coding-plugins
```

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
```

preflight 会检查 `.codex-plugin/plugin.json`、`.claude-plugin/plugin.json`、根 `plugin.json`、`gemini-extension.json` 和 `.version-bump.json` 的版本同步。

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

本机需要校验跨仓库 `external_references` 时运行：

```bash
npm run preflight -- --check-external-references
```

## Agent Pressure 维护

```bash
npm run agent-pressure-harness:ts -- --output artifacts/agent-pressure-harness.json
npm run agent-pressure-ingest:ts -- --input raw-agent-pressure.json --output tests/fixtures/formal-feature-chain/agent-pressure-results.json --split-cases --fixture-manifest --run-id 2026-07-04-agent-pressure-001 --source-contract docs/coding-plugins/scenario-routing.json --prune-stale
```

`src/cli/agent-pressure-harness.ts` 用于生成 command/workspace 层压力证据；`src/cli/agent-pressure-ingest.ts` 用于把真实 agent 压力测试输出规范化为 split case fixture。`--fixture-manifest` 会生成正式分片索引，`--prune-stale` 只在确认要同步删除旧分片时使用。

## 发布前检查

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

推送 `v*` tag 后，`.github/workflows/release.yml` 会运行 preflight，校验 tag 与 manifest 版本一致，并调用 `gh release create` 使用当前版本 release notes 创建 GitHub Release。

发布后手动审计远程状态：

```bash
npm run remote-audit:ts -- --owner Vincen-dev --repo coding-plugins --tag v<version> --expected-pusher Vincen-dev
```
