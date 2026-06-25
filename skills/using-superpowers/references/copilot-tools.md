# Copilot CLI 工具映射

本插件主要面向 Codex。本文件保留原版参考位置，供需要把工作流迁移到 Copilot CLI 时使用。

| Superpowers 意图 | Copilot CLI 中的处理 |
| --- | --- |
| 读取技能 | 使用 Copilot CLI 的 skill 工具或插件技能加载机制。 |
| 搜索文件 | 使用 shell 中的 `rg` / `find`。 |
| 编辑文件 | 使用 Copilot CLI 提供的编辑能力，或生成 patch。 |
| 派发子代理 | 如果 Copilot CLI 不支持子代理，则在当前会话中串行执行并保留检查点。 |
| 浏览器视觉伴侣 | 只有在宿主环境支持本地浏览器控制时使用，否则回退到文本和图表。 |

不要把 Codex 专用工具名直接照搬到 Copilot CLI；按意图映射。
