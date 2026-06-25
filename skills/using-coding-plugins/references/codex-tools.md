# Codex 工具映射

| 意图 | Codex 做法 |
| --- | --- |
| 读文件 | `sed -n`, `rg`, `find`, `ls`，可用并行工具并发读取。 |
| 搜索代码 | 优先 `rg`；文件列表优先 `rg --files`。 |
| 编辑文件 | 手工编辑用 `apply_patch`；格式化和机械生成可用项目工具。 |
| 运行测试 | 使用项目已有命令；失败时保留关键错误。 |
| 长命令 | 使用 shell session 并轮询直到完成。 |
| 并行任务 | 使用可用多代理或并行工具；没有时分批明确执行。 |
| 浏览器验证 | 使用浏览器控制或 Playwright，检查截图、像素和交互。 |
| 网络或越权写入 | 按 Codex escalation 流程请求授权。 |

如果 Superpowers 文档提到 Claude Code、Copilot 或 Gemini 工具名，按上表转换为当前 Codex 环境中可用能力。
