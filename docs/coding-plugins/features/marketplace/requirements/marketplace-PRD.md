---
spec_id: plugin-marketplace-feature
title: 插件 marketplace 安装入口
type: feature
status: approved
feature: marketplace
created: 2026-06-26
updated: 2026-06-29
tags:
  - marketplace
  - installation
  - distribution
  - codex
  - claude-code
related_code:
  - .agents/plugins/marketplace.json
  - README.md
  - docs/installation.md
  - .codex-plugin/plugin.json
  - .claude-plugin/plugin.json
related_specs:
  - docs/coding-plugins/features/preflight/requirements/preflight-PRD.md
related_technical:
  - docs/coding-plugins/features/marketplace/technicals/marketplace-TDD.md
related_plans:
  - docs/coding-plugins/features/marketplace/plans/marketplace-IPD.md
related_evidence:
  - docs/coding-plugins/features/marketplace/evidences/marketplace-TED.md
---

# 插件 marketplace 安装入口规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | marketplace |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/marketplace/technicals/marketplace-TDD.md` |

## 目标

让 `coding-plugins` 可以作为 Codex marketplace 插件安装，并在文档中说明 Codex、个人 marketplace 和 Claude Code 的加载方式。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不负责提交到公开 Codex marketplace 或第三方应用商店。 |
| NON-002 | 不改变任何 skill 的运行语义、路由规则或开发流程。 |
| NON-003 | 不替代 Claude Code 官方插件发布流程；Claude Code 继续使用插件目录加载。 |

## 背景

- 当前行为：仓库可以被 Codex 和 Claude Code 识别，但 README 只说明本地使用，没有可安装的 marketplace 元数据。
- 目标用户或调用方：插件维护者、本机 Codex 环境、希望从 GitHub 或本地路径安装插件的使用者。
- 约束：仓库是单插件布局，marketplace source path 必须指向仓库根目录；个人 marketplace 使用 Codex 默认的 `/Users/vincen/.agents/plugins/marketplace.json` 和 `/Users/vincen/plugins/coding-plugins` 布局。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 仓库必须包含 Codex 可读取的 marketplace 文件，marketplace 名称为 `coding-plugins`。 | `codex plugin marketplace add /Users/vincen/workspace/plugins/coding-plugins` 可注册该 marketplace。 |
| REQ-002 | 必须 | marketplace 中必须暴露名为 `coding-plugins` 的插件，并指向当前单插件仓库根目录。 | 检查 `.agents/plugins/marketplace.json` 中 plugin name 和 source path。 |
| REQ-003 | 必须 | README 必须包含安装入口，并链接到完整安装说明。 | 人工评审 README 安装章节。 |
| REQ-004 | 必须 | 完整安装说明必须覆盖 GitHub 安装、本地安装、个人 marketplace 安装、Claude Code 加载和发布前检查。 | 人工评审 `docs/installation.md`。 |
| REQ-005 | 必须 | Codex 与 Claude manifest 版本必须保持一致。 | `python3 scripts/preflight.py`。 |
| REQ-006 | 应该 | 本机个人 marketplace 应安装 `coding-plugins`，并能被 `codex plugin add coding-plugins@personal` 使用。 | `codex plugin list` 和个人 marketplace 文件检查。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 使用者从单插件仓库注册 marketplace。 | source path 解析到仓库根目录，而不是不存在的 `plugins/coding-plugins` 子目录。 | 检查 marketplace source path 为 `.`。 |
| ERR-002 | 本机尚未存在个人 marketplace 目录。 | 安装步骤创建 `/Users/vincen/.agents/plugins` 和 `/Users/vincen/plugins/coding-plugins`。 | 文件系统检查。 |
| ERR-003 | Claude Code 使用者尝试通过 Codex marketplace 加载。 | 文档明确说明 Claude Code 使用 `claude --plugin-dir`。 | 人工评审 `docs/installation.md`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 仓库 marketplace 文件存在 | 已检出仓库 | 查看 `.agents/plugins/marketplace.json` | 文件声明 marketplace `coding-plugins` 和插件 `coding-plugins`。 |
| AC-002 | 本地 Codex 安装说明可执行 | 已安装 Codex CLI | 运行本地安装命令 | marketplace 可注册，插件可添加。 |
| AC-003 | 个人 marketplace 安装完成 | 本机文件系统可写 | 运行个人安装命令 | `coding-plugins@personal` 出现在插件列表。 |
| AC-004 | Claude Code 使用说明明确 | 已安装 Claude Code | 阅读 `docs/installation.md` | 可以看到 `claude --plugin-dir` 和 `/coding-plugins:using-coding-plugins`。 |
| AC-005 | 发布前检查通过 | 当前仓库改动完成 | 运行发布前检查命令 | preflight、Codex 插件校验和 Claude 插件校验通过。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 文件检查 | `.agents/plugins/marketplace.json` | Task 1 | 已覆盖 |
| REQ-002 | 文件检查 | `.agents/plugins/marketplace.json` | Task 1 | 已覆盖 |
| REQ-003 | 文档评审 | `README.md` | Task 2 | 已覆盖 |
| REQ-004 | 文档评审 | `docs/installation.md` | Task 2 | 已覆盖 |
| REQ-005 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| REQ-006 | 命令验证 | `codex plugin add coding-plugins@personal` | Task 4 | 已覆盖 |
| ERR-001 | 文件检查 | `.agents/plugins/marketplace.json` | Task 1 | 已覆盖 |
| ERR-002 | 文件系统检查 | `/Users/vincen/.agents/plugins/marketplace.json` | Task 4 | 已覆盖 |
| ERR-003 | 文档评审 | `docs/installation.md` | Task 2 | 已覆盖 |
| AC-001 | 文件检查 | `.agents/plugins/marketplace.json` | Task 1 | 已覆盖 |
| AC-002 | 文档评审和命令验证 | `docs/installation.md`、`codex plugin add coding-plugins@personal` | Task 4 | 已覆盖 |
| AC-003 | 命令验证 | `codex plugin list` | Task 4 | 已覆盖 |
| AC-004 | 文档评审 | `docs/installation.md` | Task 2 | 已覆盖 |
| AC-005 | 命令验证 | `python3 scripts/preflight.py`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` | Task 3 | 已覆盖 |
