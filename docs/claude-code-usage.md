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
/coding-plugins:brainstorming
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

默认入口：

```text
/coding-plugins:using-coding-plugins
```

构思入口：

```text
/coding-plugins:brainstorming
```

方案讨论、头脑风暴、产品方向不清或先分析不落地时，使用 `/coding-plugins:brainstorming`。确认进入正式落地后，再转入 `/coding-plugins:spec-driven-development`。

之后 Claude 可能会根据技能 description 进行 best-effort 自动选择；关键链路不要依赖自动匹配。需要稳定进入插件流程时，手动调用 `/coding-plugins:using-coding-plugins`；已经明确场景时，手动调用具体技能。

## 会话启动提示

Claude Code 当前没有 Codex SessionStart hook 的等价自动注入入口。为了让新会话稳定进入同一条工作链路，把下面提示作为 Claude Code 会话开始消息：

```text
/coding-plugins:using-coding-plugins

请先读取并遵守 Coding Plugins 入口规则，再判断我的请求属于只读分析、方案讨论、规格驱动开发、技术设计、TED 任务执行、TDD、调试、评审、验证、提交或分支收尾中的哪一种。
```

如果会话中执行过 `/reload-plugins`，再次发送上面的启动提示，确保 Claude 使用最新插件内容。

## 工具映射

技能中出现的 Claude 工具名可以直接按 Claude Code 能力执行。只有在技能文本明确提到 Codex、Copilot 或 Gemini 专用工具时，才需要转换到 Claude Code 等价能力。

常见对应关系见：

```text
skills/using-coding-plugins/references/claude-tools.md
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
npm run preflight
```

## 注意事项

- Claude Code 插件组件必须位于插件根目录，不能放进 `.claude-plugin/` 内；`.claude-plugin/` 只放 `plugin.json`。
- Claude Code 插件技能会被命名空间隔离，避免和个人或项目技能冲突。
- 本插件设置了显式版本号；发布给他人使用时，每次需要用户收到更新都要提升 `.claude-plugin/plugin.json` 的 `version`。
- `skills/*/agents/openai.yaml` 是 Codex/OpenAI 侧展示元数据，Claude Code 会把它们视为普通支持文件，不作为 Claude subagent 定义。
