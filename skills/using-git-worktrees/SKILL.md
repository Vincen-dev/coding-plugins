---
name: using-git-worktrees
description: 开始需要隔离当前工作区的功能工作，或执行 IPD 任务执行文档前使用；优先使用平台原生工具，没有时回退到 git worktree。
---

# 使用 Git Worktrees

## 总览

确保工作在隔离工作区中进行。优先使用平台原生 worktree 工具；没有原生工具时才手动使用 git worktree。

**核心原则：**先检测是否已隔离，再用原生工具，最后才回退到 git。不要和宿主环境对抗。

开始时声明：“我正在使用 using-git-worktrees 技能来设置隔离工作区。”

## Step 0：检测现有隔离

创建任何东西前，先检查是否已经在隔离工作区：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

子模块保护：子模块中 `GIT_DIR != GIT_COMMON` 也可能成立。先检查：

```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

如果有输出，你在子模块中，按普通仓库处理。

如果 `GIT_DIR != GIT_COMMON` 且不是子模块，说明已在 linked worktree 中，跳到项目设置。不要再创建 worktree。

报告：

- 有分支：`Already in isolated workspace at <path> on branch <name>.`
- detached HEAD：`Already in isolated workspace at <path> (detached HEAD, externally managed).`

如果是普通 checkout，且用户没有预先声明偏好，先询问是否需要隔离 worktree。用户拒绝则在当前目录工作并跳到项目设置。

## Step 1：创建隔离工作区

### 1a. 原生 Worktree 工具（优先）

如果当前平台有原生 worktree 创建能力，例如 `EnterWorktree`、`WorktreeCreate`、`/worktree` 命令或 `--worktree` 标志，优先使用它，然后跳到项目设置。

原生工具会处理目录、分支和清理。已有原生工具时手写 `git worktree add` 会制造宿主环境看不到的状态。

### 1b. Git Worktree 回退

只有没有原生工具时使用。

目录优先级：

1. 用户或指令中声明的 worktree 目录。
2. 项目本地 `.worktrees/`，其次 `worktrees/`。
3. 默认项目根目录下 `.worktrees/`。

项目本地目录必须确认被忽略：

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

未忽略时，把目录加入 `.gitignore` 并提交后再继续，避免把 worktree 内容提交进仓库。

创建：

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

如果 sandbox 权限导致失败，告诉用户 worktree 创建被阻止，并在当前目录继续，随后执行项目设置和基线测试。

## Step 3：项目设置

自动检测并运行合适设置：

```bash
if [ -f package.json ]; then npm install; fi
if [ -f Cargo.toml ]; then cargo build; fi
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi
if [ -f go.mod ]; then go mod download; fi
```

## Step 4：验证干净基线

运行项目测试：

```bash
npm test / cargo test / npm test / go test ./...
```

测试失败时，报告失败并询问是否继续或先调查。测试通过时报告 ready。

报告格式：

```text
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## 快速参考

| 情况 | 操作 |
| --- | --- |
| 已在 linked worktree | 跳过创建 |
| 在子模块中 | 按普通仓库处理 |
| 有原生 worktree 工具 | 使用原生工具 |
| 无原生工具 | git worktree 回退 |
| `.worktrees/` 存在 | 使用它并验证 ignore |
| `worktrees/` 存在 | 使用它并验证 ignore |
| 两者都存在 | 优先 `.worktrees/` |
| 本地目录未忽略 | 加入 `.gitignore` 并提交 |
| 创建权限失败 | sandbox 回退，在当前目录工作 |
| 基线测试失败 | 报告并询问 |

## 禁止

- 检测到已有隔离后再创建 worktree。
- 有原生工具时直接 `git worktree add`。
- 跳过 ignore 验证。
- 跳过基线测试。
- 测试失败还未经确认继续。
