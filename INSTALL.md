# Coding Plugins 2.0.0 安装

2.0.0 是纯工作流插件。安装目标只是让客户端发现 `skills/`；没有 Coding Plugins CLI、runtime、hook 状态或业务仓库初始化步骤。

## Codex

通过 Codex marketplace 添加本 Git 仓库并启用 `coding-plugins`。插件 manifest 直接指向 `./skills/`。

## Claude Code

把仓库作为本地 plugin directory 加载，或把 `skills/` 链接到 Claude Code 可发现的技能目录。

## Gemini CLI

安装本 Git 仓库扩展；`gemini-extension.json` 使用 `GEMINI.md` 提供静态上下文，Skills 仍是工作流来源。

## Local Skills Clients

将 `skills/` 复制或链接到客户端的 Skills 目录。`.agents/skills` 提供仓库内相对入口。

## 验证安装

在新会话中明确请求 `using-coding-plugins`，然后描述一个分析、小修或高风险变更。Agent 应返回 Inspect、Quick、Standard、Governed 或 Critical profile，并且不要求额外运行时。

## 升级提示

从 1.x 升级到 2.0.0 前请阅读 [docs/migration-guide.md](docs/migration-guide.md)。旧项目中的 `.coding-plugins*` 状态文件不再使用，可在确认无团队依赖后删除。
