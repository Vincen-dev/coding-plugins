---
title: 插件 marketplace 安装入口实现计划
status: completed
feature: marketplace
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/marketplace/requirements/marketplace-PRD.md
related_technical:
  - docs/coding-plugins/features/marketplace/technicals/marketplace-Technical-Design.md
related_evidence:
  - docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md
---

# 插件 marketplace 安装入口实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已完成 |
| Feature | marketplace |
| 需求文档 | `docs/coding-plugins/features/marketplace/requirements/marketplace-PRD.md` |
| 技术设计 | `docs/coding-plugins/features/marketplace/technicals/marketplace-Technical-Design.md` |
| TDD 证据 | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` |

**目标:** 记录并固化 `coding-plugins` 的 Codex marketplace、personal marketplace 和 Claude Code 安装入口。

**架构:** `.agents/plugins/marketplace.json` 提供 Codex marketplace 元数据，两个 manifest 分别服务 Codex 和 Claude Code，安装说明把本地、GitHub、personal marketplace 和 Claude Code 加载方式拆开说明。

**技术栈:** JSON manifest、Markdown 文档、Codex CLI、Claude Code CLI。

**规格来源:** `docs/coding-plugins/features/marketplace/requirements/marketplace-PRD.md`

**技术设计来源:** `docs/coding-plugins/features/marketplace/technicals/marketplace-Technical-Design.md`

## 技术设计快照

**设计摘要:** marketplace 使用仓库根目录作为单插件 source path。Codex 通过 marketplace 注册或 personal marketplace 安装，Claude Code 通过插件目录加载，两条链路共享同一仓库文件但使用不同 manifest。

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| source path 为 `.` | 当前仓库根目录就是插件根目录 | 不支持同仓多插件 |
| README 只保留入口，细节放 installation | 降低首页噪音并保留完整步骤 | 两份文档需要同步关键命令 |
| personal marketplace 作为本机安装方式 | 满足本机 Codex 使用和版本缓存 | 路径是本机约定 |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `.agents/plugins/marketplace.json` | 声明 marketplace 和插件 source path | REQ-001, REQ-002, ERR-001, AC-001 |
| `README.md` | 展示安装入口并链接完整说明 | REQ-003 |
| `docs/installation.md` | 覆盖所有安装和发布前检查步骤 | REQ-004, REQ-006, ERR-002, ERR-003, AC-002, AC-003, AC-004 |
| `.codex-plugin/plugin.json` / `.claude-plugin/plugin.json` | 保持版本一致 | REQ-005, AC-005 |

**数据流 / 控制流:** 使用者选择 Codex 或 Claude Code；Codex 读取 marketplace 后解析仓库根目录并加载 `.codex-plugin/plugin.json`；Claude Code 直接读取 `.claude-plugin/plugin.json`；发布前统一运行 preflight 和平台校验。

**接口和契约:** marketplace JSON 必须包含 `name: coding-plugins`、插件名 `coding-plugins`、`source.path: "."` 和 `installation: AVAILABLE`。Claude Code 命令必须使用 `claude --plugin-dir`。

**迁移 / 兼容性:** 不迁移历史安装方式；本机 personal marketplace 继续可用，公开用户可以通过 GitHub clone 后注册仓库 marketplace。

**测试策略:** 文件检查 `.agents/plugins/marketplace.json`，文档评审 README 和 installation，运行 `python3 scripts/preflight.py`、`codex plugin add coding-plugins@personal` 和 `claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`。

**TDD 证据目标:** `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| marketplace path 被误读 | spec、technical design 和 installation 都记录 source path 为 `.` |
| Claude Code 路径混淆 | 安装说明明确 Claude Code 不走 Codex marketplace |
| 版本缓存未刷新 | 完成阶段运行 `codex plugin add coding-plugins@personal` |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `.agents/plugins/marketplace.json` | marketplace name is `coding-plugins` | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 1 |
| REQ-002 | `.agents/plugins/marketplace.json` | plugin source path is `.` | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 1 |
| REQ-003 | `README.md` | installation entry links full docs | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 2 |
| REQ-004 | `docs/installation.md` | covers GitHub, local, personal, Claude Code and preflight | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 2 |
| REQ-005 | `python3 scripts/preflight.py` | manifest version consistency check | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 3 |
| REQ-006 | `codex plugin add coding-plugins@personal` | installs personal plugin cache | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 4 |
| ERR-001 | `.agents/plugins/marketplace.json` | source path remains `.` | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 1 |
| ERR-002 | `docs/installation.md` | personal marketplace path creation is documented | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 2 |
| ERR-003 | `docs/installation.md` | Claude Code uses `claude --plugin-dir` | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 2 |
| AC-001 | `.agents/plugins/marketplace.json` | file declares marketplace and plugin | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 1 |
| AC-002 | `docs/installation.md` | local install command is documented | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 2 |
| AC-003 | `codex plugin add coding-plugins@personal` | personal install succeeds | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 4 |
| AC-004 | `docs/installation.md` | Claude Code command and skill namespace are documented | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 2 |
| AC-005 | `python3 scripts/preflight.py` | release gate passes | `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md` / 替代验证 | 任务 3 |

## 任务 1： Marketplace 文档闭环回填

**规格 ID:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, ERR-001, ERR-002, ERR-003, AC-001, AC-002, AC-003, AC-004, AC-005

**文件:**

- 创建: `docs/coding-plugins/features/marketplace/technicals/marketplace-Technical-Design.md`
- 创建: `docs/coding-plugins/features/marketplace/plans/marketplace-Implementation-Plan.md`
- 创建: `docs/coding-plugins/features/marketplace/evidences/marketplace-TDD-Evidence.md`
- 修改: `docs/coding-plugins/features/marketplace/requirements/marketplace-PRD.md`
- 修改: `docs/coding-plugins/features/marketplace/README.md`

- [x] **步骤 1：Read approved spec and current implementation files**

Read `.agents/plugins/marketplace.json`, `README.md`, `docs/installation.md`, `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json`.

- [x] **步骤 2：Create technical design**

Document source path contract, platform split, install commands, compatibility and validation strategy.

- [x] **步骤 3：Create implementation plan**

Map every marketplace Spec ID to existing files and validation commands.

- [x] **步骤 4：Record 证据**

Use TDD 例外记录 because this task backfills documentation for existing behavior and does not change runtime logic.
