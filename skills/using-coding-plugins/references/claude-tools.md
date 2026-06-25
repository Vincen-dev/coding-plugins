# Claude Code 工具映射

Claude Code 是 Superpowers 风格技能的原生目标环境之一。技能文本中出现 Claude Code 工具名时，直接使用当前 Claude Code 提供的能力，不需要转换。

| 意图 | Claude Code 做法 |
| --- | --- |
| 读取文件 | 使用 Read；批量定位用 Glob/Grep；必要时用 Bash 运行只读命令。 |
| 搜索代码 | 使用 Grep/Glob；复杂组合可用 Bash 中的 `rg`。 |
| 编辑文件 | 使用 Edit、MultiEdit 或 Write；遵守当前权限模式。 |
| 运行测试或脚本 | 使用 Bash，并保留关键输出作为验证证据。 |
| 任务清单 | 使用 TodoWrite。 |
| 子代理或并行任务 | 使用 Task/subagent 能力；不可用时在当前会话分批执行并说明降级。 |
| 浏览器或 UI 验证 | 使用 Claude Code 可用的浏览器、Chrome、MCP 或项目测试工具；不可用时说明限制。 |
| 插件重载 | 修改插件组件后运行 `/reload-plugins`。 |
| 插件校验 | 运行 `claude plugin validate <plugin-path> --strict`。 |

如果技能提到 Codex、Copilot 或 Gemini 专用工具名，按上表选择 Claude Code 等价能力，不机械照搬工具名。
