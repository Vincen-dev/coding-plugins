---
name: finishing-a-development-branch
description: 实现完成、测试通过且需要决定如何集成工作时使用；提供 merge、PR、保留或清理的结构化选项。
---

# 完成开发分支

## 总览

用清晰选项指导开发工作收尾，并执行用户选择。

**核心原则：**验证测试 -> 检测环境 -> 呈现选项 -> 执行选择 -> 清理。

开始时声明：“我正在使用 finishing-a-development-branch 技能来完成这项工作。”

## Step 1：验证测试

展示选项前先验证测试通过：

```bash
npm test / cargo test / pytest / go test ./...
```

如果测试失败：

```text
Tests failing (<N> failures). Must fix before completing:

[show failures]

Cannot proceed with merge/PR until tests pass.
```

停止，不进入 Step 2。

## Step 2：检测环境

呈现选项前确定工作区状态：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

| 状态 | 菜单 | 清理 |
| --- | --- | --- |
| `GIT_DIR == GIT_COMMON` 普通仓库 | 标准 4 选项 | 无 worktree 清理 |
| `GIT_DIR != GIT_COMMON` 命名分支 | 标准 4 选项 | 按来源清理 |
| `GIT_DIR != GIT_COMMON` detached HEAD | 精简 3 选项，无 merge | 不清理，外部管理 |

## Step 3：确定 base 分支

尝试常见 base：

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

不确定时询问用户：`This branch split from main - is that correct?`

## Step 4：呈现选项

普通仓库和命名分支 worktree，准确呈现 4 个选项：

```text
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

detached HEAD，准确呈现 3 个选项：

```text
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request
2. Keep as-is (I'll handle it later)
3. Discard this work

Which option?
```

不要附加解释，保持选项简洁。

## Step 5：执行选择

### 选项 1：本地 merge

切回主仓库根目录，checkout base，pull，merge feature。merge 成功后在合并结果上重跑测试。只有 merge 和测试成功后，才清理 worktree 并删除分支。

### 选项 2：push 并创建 PR

push 分支并创建 PR。不要清理 worktree，用户还需要它处理 PR 反馈。

### 选项 3：保留

报告：`Keeping branch <name>. Worktree preserved at <path>.`

不要清理。

### 选项 4：丢弃

必须先确认：

```text
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

等待用户精确输入 `discard`。确认后清理 worktree，再强制删除分支。

## Step 6：清理工作区

只对选项 1 和 4 执行。选项 2 和 3 永远保留 worktree。

普通仓库无需清理。若 worktree 路径位于 `.worktrees/`、`worktrees/` 或 `~/.config/superpowers/worktrees/` 下，视为本流程创建并负责清理：

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune
```

其他路径由宿主环境管理，不要删除。若平台提供退出工作区工具，使用它；否则保留。

## 常见错误

- 跳过测试验证。
- 问开放式问题“接下来做什么”，而不是给结构化选项。
- 选项 2 后清理 worktree。
- 删除分支早于移除 worktree，导致 branch delete 失败。
