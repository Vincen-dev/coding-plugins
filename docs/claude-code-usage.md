# Claude Code Usage

本文记录 `coding-plugins` 在 Claude Code 中的本地加载、调用、更新和校验方式。

## 支持范围

Claude Code 通过 `.claude-plugin/plugin.json` 识别本插件。插件根目录下的 `skills/<name>/SKILL.md` 会作为命名空间技能加载，调用形式为：

```text
/coding-plugins:<skill-name>
```

例如：

```text
/coding-plugins:using-coding-plugins
/coding-plugins:spec-driven-development
/coding-plugins:git-commit
```

## 本地加载

在包含 `plugins/coding-plugins` 的仓库根目录运行：

```bash
claude --plugin-dir ./plugins/coding-plugins
```

如果当前目录就是插件目录的父级，也可以运行：

```bash
claude --plugin-dir ./coding-plugins
```

启动后可用 `/help` 或 `/skills` 检查技能是否出现。修改 `SKILL.md` 后通常会自动生效；修改 manifest、插件组件或非技能配置后，在 Claude Code 中运行：

```text
/reload-plugins
```

## 推荐入口

首次使用时调用：

```text
/coding-plugins:using-coding-plugins
```

兼容旧入口命名时调用：

```text
/coding-plugins:using-superpowers
```

之后 Claude 会根据技能 description 自动选择相关技能；也可以手动调用具体技能。

## 工具映射

技能中出现的 Claude 工具名可以直接按 Claude Code 能力执行。只有在技能文本明确提到 Codex、Copilot 或 Gemini 专用工具时，才需要转换到 Claude Code 等价能力。

常见对应关系见：

```text
skills/using-coding-plugins/references/claude-tools.md
skills/using-superpowers/references/claude-tools.md
```

## 校验

本地提交前建议运行：

```bash
claude plugin validate ./plugins/coding-plugins --strict
```

如果在插件目录中运行：

```bash
claude plugin validate . --strict
```

同时保留 Codex 侧校验：

```bash
PYTHONPATH=/private/tmp/codex-yaml-shim python3 /Users/vincen/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/vincen/workspace/plugins/coding-plugins
```

## 注意事项

- Claude Code 插件组件必须位于插件根目录，不能放进 `.claude-plugin/` 内；`.claude-plugin/` 只放 `plugin.json`。
- Claude Code 插件技能会被命名空间隔离，避免和个人或项目技能冲突。
- 本插件设置了显式版本号；发布给他人使用时，每次需要用户收到更新都要提升 `.claude-plugin/plugin.json` 的 `version`。
- `skills/*/agents/openai.yaml` 是 Codex/OpenAI 侧展示元数据，Claude Code 会把它们视为普通支持文件，不作为 Claude subagent 定义。
