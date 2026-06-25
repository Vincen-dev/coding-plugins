---
name: finishing-a-development-branch
description: 实现完成、测试通过且需要决定如何集成工作时使用；提供 merge、PR、保留或清理的结构化选项。
---

# 完成开发分支

## 总览

用清晰选项指导开发工作收尾，并执行用户选择。

**核心原则：**验证测试 -> 检查是否需要提交 -> 检测环境 -> 呈现选项 -> 执行选择 -> 清理。

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

## Step 2：检查是否需要提交

测试通过后，先检查是否存在未提交变更：

```bash
git status --short
```

如果存在未提交变更，先提示用户是否提交，不要直接进入 merge/PR/清理选项：

```text
检测到当前有未提交变更。是否现在创建一次提交？

如果提交，我会使用 git-commit 技能：
- 分析 diff 并按逻辑暂存文件
- 生成中文 Conventional Commit 信息
- 在 footer 添加用户本人作者署名
- 检查作者身份，禁止 AI 作者或 AI 生成声明
```

用户选择提交时，必须使用 `git-commit`。提交完成后重新运行必要验证或至少确认提交没有改变工作树内容，再继续 Step 3。

用户选择暂不提交时，继续 Step 3，但在后续选项中明确当前仍有未提交变更。不要在用户未同意时擅自提交。

## Step 3：检测环境

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

## Step 4：确定 base 分支

尝试常见 base：

```bash
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

不确定时询问用户：`This branch split from main - is that correct?`

## Step 5：呈现选项

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

## Step 6：执行选择

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

## Step 7：清理工作区

只对选项 1 和 4 执行。选项 2 和 3 永远保留 worktree。

普通仓库无需清理。若 worktree 路径位于 `.worktrees/`、`worktrees/` 或 `~/.config/superpowers/worktrees/` 下，视为本流程创建并负责清理：

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune
```

其他路径由宿主环境管理，不要删除。若平台提供退出工作区工具，使用它；否则保留。

## 常见错误

- 跳过测试验证。
- 有未提交变更时不询问是否提交。
- 提交时绕过 `git-commit`，导致英文提交或 AI 作者进入历史。
- 问开放式问题“接下来做什么”，而不是给结构化选项。
- 选项 2 后清理 worktree。
- 删除分支早于移除 worktree，导致 branch delete 失败。
