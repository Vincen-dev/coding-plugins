---
name: git-commit
description: 用户要求提交、更改已完成需要询问是否提交、或提到 commit、提交、/commit 时使用；用于分析 diff、分组暂存并创建中文 Conventional Commit。
---

# Git Commit

## 总览

创建标准化、语义化、中文描述的 git commit。提交前必须分析真实 diff，判断提交类型、scope、变更范围和风险。

本技能参考 Conventional Commits 思路：类型和可选 scope 保持英文规范，提交描述、正文和 footer 说明使用中文。每次提交必须在 footer 中添加用户本人的作者署名。

## 硬性规则

1. **提交信息必须中文。**
   - `type` 和 `scope` 可使用英文规范，例如 `feat(auth): 增加登录校验`。
   - description、body、footer 的说明文字必须中文。

2. **禁止携带 AI 作者或 AI 生成声明。**
   - 不得添加 `Co-authored-by` AI、Codex、Claude、ChatGPT、OpenAI、assistant、bot 等作者。
   - 不得添加 `Generated with ...`、`AI generated`、`Created by Codex` 等声明。
   - 不得把提交 author 或 committer 设置成 AI 身份。

3. **只能使用用户自己的 Git 作者身份。**
   - 提交前检查当前作者身份。
   - 若作者身份缺失或像 AI/机器人身份，停止并询问用户。
   - 不要擅自修改全局 git config。
   - 只有在用户明确同意时，才可设置仓库局部 `user.name` / `user.email`。

4. **footer 必须包含作者署名。**
   - 每次提交信息 footer 必须包含：`作者: <user.name> <user.email>`。
   - 署名必须来自当前 Git 作者身份，且必须和 `git log -1 --pretty=fuller` 中的 Author 保持一致。
   - 不得使用 AI、Codex、Claude、ChatGPT、OpenAI、assistant、bot 等身份作为署名。

5. **不做破坏性 git 操作。**
   - 不运行 `git reset --hard`、强制 push、删除分支等，除非用户明确要求。
   - 不跳过 hooks：不要使用 `--no-verify`，除非用户明确要求。
   - commit hook 失败时，修复问题后创建新提交；不要默认 amend。

## Conventional Commit 格式

```text
<type>[optional scope]: <中文描述>

[可选中文正文]

作者: <user.name> <user.email>

[可选其他中文 footer]
```

常用类型：

| Type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `docs` | 文档 |
| `style` | 格式或样式，不改逻辑 |
| `refactor` | 重构，不新增功能也不修 bug |
| `perf` | 性能优化 |
| `test` | 测试 |
| `build` | 构建系统或依赖 |
| `ci` | CI 配置 |
| `chore` | 维护杂项 |
| `revert` | 回滚 |

破坏性变更：

```text
feat!: 移除旧版配置入口

作者: Vincen <hx001007@gmail.com>

BREAKING CHANGE: 旧版 `legacyConfig` 字段不再支持。
```

## 工作流

### 1. 检查仓库状态

```bash
git status --porcelain
git diff --stat
git diff
git diff --staged --stat
git diff --staged
```

如果已有 staged 文件，优先分析 staged diff。若没有 staged 文件，分析工作区 diff。

### 2. 检查作者身份

```bash
git config user.name
git config user.email
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
```

停止条件：

- `user.name` 或 `user.email` 缺失。
- author/committer 包含 AI、Codex、Claude、ChatGPT、OpenAI、assistant、bot 等非用户身份。
- 提交模板或环境变量会注入 AI co-author。

处理方式：

- 说明当前检测到的作者身份。
- 询问用户应使用哪个个人 name/email。
- 只在用户明确同意时设置仓库局部配置：

```bash
git config user.name "<用户姓名>"
git config user.email "<用户邮箱>"
```

### 3. 检查敏感文件

提交前必须确认没有秘密信息：

- `.env`
- `*.pem`
- `*.key`
- `credentials.json`
- token、password、secret、private key

发现疑似秘密时，停止并让用户确认处理方式。

### 4. 逻辑分组和暂存

一个提交只包含一个逻辑变更。若当前 diff 包含多个逻辑变更，先向用户说明分组建议。

可用方式：

```bash
git add path/to/file1 path/to/file2
git add -p
```

不要为了省事 `git add .`，除非确认所有变更属于同一逻辑提交且没有敏感文件。

### 5. 生成中文提交信息

根据 diff 判断：

- **type**：变更类型。
- **scope**：受影响模块，可省略。
- **description**：中文一句话，祈使/动宾结构，尽量不超过 72 字符。
- **body**：必要时说明原因、设计取舍和影响。
- **footer**：必须包含作者署名，可追加 issue、BREAKING CHANGE 等。

作者署名格式：

```text
作者: <git config user.name> <git config user.email>
```

该署名必须和 Git 实际 Author 一致，不是 co-author，也不是 AI 生成声明。

示例：

```text
docs: 记录插件工作链路

作者: Vincen <hx001007@gmail.com>
```

```text
feat(commit): 增加中文提交工作流

检查提交作者身份，禁止 AI co-author，并在完成阶段提示用户是否提交。

作者: Vincen <hx001007@gmail.com>
```

### 6. 执行提交

单行：

```bash
git commit -m "docs: 记录插件工作链路"
```

多行：

```bash
git commit -m "$(cat <<'EOF'
feat(commit): 增加中文提交工作流

检查提交作者身份，禁止 AI co-author，并在完成阶段提示用户是否提交。

作者: Vincen <hx001007@gmail.com>
EOF
)"
```

提交后检查：

```bash
git log -1 --pretty=fuller
git status --short
```

确认：

- Author 是用户自己的身份。
- Committer 是用户自己的身份或本机 Git 身份，不是 AI。
- 提交信息中文。
- footer 包含 `作者: <user.name> <user.email>`。
- footer 作者署名与 Git Author 一致。
- 没有 AI co-author 或生成声明。
- 工作区状态符合预期。

## 完成阶段使用

`finishing-a-development-branch` 在验证通过后，如果存在未提交变更，应提示用户是否提交。用户选择提交时，必须转入本技能。

提示模板：

```text
检测到当前有未提交变更。是否现在创建一次提交？

如果提交，我会使用 git-commit 技能：
- 分析 diff 并按逻辑暂存文件
- 生成中文 Conventional Commit 信息
- 在 footer 添加作者署名
- 检查作者身份，禁止 AI 作者或 AI 生成声明
```

## 常见错误

- 英文提交描述：`docs: update workflow docs`。
- 缺少 `作者: <user.name> <user.email>` footer。
- footer 作者署名和 Git Author 不一致。
- 自动添加 `Co-authored-by: Claude ...`。
- 使用 AI 或 bot 作为 author。
- 未检查 diff 就生成提交信息。
- 把多个无关变更放进一个提交。
- 提交 `.env`、token 或私钥。
- hook 失败后直接 `--no-verify`。

## 完成标准

- 已检查 diff 和 status。
- 已检查作者身份。
- 已检查敏感文件。
- 暂存内容是一个逻辑变更。
- 提交信息为中文 Conventional Commit。
- 提交 footer 包含用户本人作者署名。
- 提交中没有 AI 作者、AI co-author 或 AI 生成声明。
- 提交后验证 `git log -1 --pretty=fuller`。
