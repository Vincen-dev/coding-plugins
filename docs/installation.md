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

规格、技术设计、技术实现、测试用例、IPD 任务执行文档和 TDD 证据的统一检索入口是：

```text
docs/coding-plugins/INDEX.md
```

文档关系以各文件 frontmatter 中的 `related_*` 和 README `tags` 为准，正式规则见：

```text
docs/coding-plugins/document-contract.md
```

文档按 feature-first 结构集中维护：

```text
docs/coding-plugins/features/<feature-name>/
```

新增、移动或删除 feature 文档后，运行以下命令重新生成总索引并执行完整检查：

```bash
python3 scripts/preflight.py --write-index
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
python3 scripts/bump_version.py <version>
```

版本同步目标由 [.version-bump.json](../.version-bump.json) 维护。提升版本后更新 [RELEASE-NOTES.md](../RELEASE-NOTES.md) 中对应版本的变更记录。

提交、push 或分发前运行：

```bash
python3 scripts/preflight.py --write-index
python3 scripts/preflight.py
codex plugin add coding-plugins@personal
claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict
```

旧项目文档升级到当前 metadata 契约时运行：

```bash
python3 scripts/migrate_document_contract.py --dry-run
python3 scripts/migrate_document_contract.py
```

本机需要校验跨仓库 `external_references` 时运行：

```bash
python3 scripts/preflight.py --check-external-references
```

提交并确认工作区干净后，准备 GitHub Release：

```bash
python3 scripts/prepare_release.py --notes-out /tmp/coding-plugins-release-notes.md
git tag -a v<version> -m "coding-plugins <version>"
git push origin v<version>
```

推送 `v*` tag 后，`.github/workflows/release.yml` 会运行 preflight，校验 tag 与 manifest 版本一致，并调用 `gh release create` 使用当前版本 release notes 创建 GitHub Release。

发布后手动审计远程状态：

```bash
python3 scripts/remote_audit.py --owner Vincen-dev --repo coding-plugins --tag v<version> --expected-pusher Vincen-dev
```
