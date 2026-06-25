# Gemini CLI 工具映射

本插件主要面向 Codex。本文件保留原版参考位置，供需要把工作流迁移到 Gemini CLI 时使用。

| Superpowers 意图 | Gemini CLI 中的处理 |
| --- | --- |
| 激活技能 | 使用 Gemini 的 `activate_skill` 或当前环境提供的技能机制。 |
| 读取/搜索文件 | 使用 shell、`rg`、`find` 或 Gemini 文件工具。 |
| 编辑文件 | 使用 Gemini 编辑能力或 patch。 |
| 派发子代理 | 若无子代理支持，改用当前会话执行和显式评审检查点。 |
| 执行命令 | 使用 Gemini shell/terminal 能力。 |

工作流规则保持不变，只有工具名称按平台替换。
