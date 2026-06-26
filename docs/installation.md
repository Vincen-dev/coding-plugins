# Coding Plugins 安装说明

本文记录 `coding-plugins` 的安装入口。Codex 使用 marketplace 安装，Claude Code 使用插件目录加载。

## Codex Marketplace 安装

本仓库已经包含 marketplace 元数据：

```text
.agents/plugins/marketplace.json
.codex-plugin/plugin.json
hooks/hooks-codex.json
```

该 marketplace 是单插件仓库布局，`coding-plugins` 的 source path 指向仓库根目录 `.`。因此可以把本仓库根目录直接注册为 marketplace。

### 从 GitHub 安装

```bash
codex plugin marketplace add https://github.com/Vincen-dev/coding-plugins.git
codex plugin add coding-plugins@coding-plugins
```

### 从本地仓库安装

```bash
codex plugin marketplace add /Users/vincen/workspace/plugins/coding-plugins
codex plugin add coding-plugins@coding-plugins
```

安装后查看：

```bash
codex plugin list
codex plugin marketplace list
```

新建或重开 Codex 会话后，技能会以 `coding-plugins:<skill-name>` 形式出现在可用技能列表中。Codex 会在 `startup`、`resume` 和 `clear` 的 SessionStart 阶段运行 `hooks/run-hook.cmd session-start-codex`，自动注入 `coding-plugins:using-coding-plugins` 入口提示。

规格、计划和 TDD Evidence 的统一检索入口是：

```text
docs/coding-plugins/INDEX.md
```

## 个人 Marketplace 安装

个人 marketplace 文件位于：

```text
/Users/vincen/.agents/plugins/marketplace.json
```

本机个人安装使用 Codex 约定布局：

```text
/Users/vincen/plugins/coding-plugins
```

个人 marketplace 中的插件 source path 使用：

```json
{
  "source": "local",
  "path": "./plugins/coding-plugins"
}
```

这表示路径相对于个人 marketplace 根目录 `/Users/vincen` 解析。

安装命令：

```bash
codex plugin add coding-plugins@personal
```

## Claude Code 加载

Claude Code 不使用 Codex marketplace。直接通过插件目录加载：

```bash
claude --plugin-dir /Users/vincen/workspace/plugins/coding-plugins
```

常用入口：

```text
/coding-plugins:using-coding-plugins
```

修改插件组件后，在 Claude Code 中运行：

```text
/reload-plugins
```

更多 Claude Code 说明见 [claude-code-usage.md](claude-code-usage.md)。

## 发布前检查

提升版本时运行：

```bash
python3 scripts/bump_version.py 0.6.16
```

版本同步目标由 [.version-bump.json](../.version-bump.json) 维护。提升版本后更新 [RELEASE-NOTES.md](../RELEASE-NOTES.md) 中对应版本的变更记录。

提交、push 或分发前运行：

```bash
python3 scripts/preflight.py
codex plugin add coding-plugins@personal
claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict
```
