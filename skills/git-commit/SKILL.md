---
name: git-commit
description: 用户要求提交、更改已完成需要询问是否提交、或提到 commit、提交、/commit 时使用；用于分析 diff、分组暂存并按用户选择语言创建 Conventional Commit。
---

# Git Commit

## 总览

创建标准化、语义化的 git commit。提交前必须分析真实 diff，判断提交语言、类型、scope、变更范围和风险。

本技能参考 Conventional Commits 思路：类型和可选 scope 保持英文规范，description、body 和 footer 说明使用确定后的中文或英文。每次提交必须在 footer 中添加用户本人的 `Authored-by` 署名。

## 提交语言

提交信息可以使用中文或英文，不得硬编码为单一语言。语言解析顺序必须稳定：

- `type` 和 `scope` 保持英文 Conventional Commit 标识，例如 `feat(commit)`、`docs`、`fix(auth)`。
- description、body、footer 中给人阅读的说明文字必须和确定后的语言一致。
- `Authored-by`、`BREAKING CHANGE`、issue key 这类机器或规范字段名可保留英文，字段内容按用户选择的语言说明。
- 如果用户已经明确要求中文或英文，直接使用该语言；用户明确选择优先于历史默认。
- 用户未明确指定时，检查最近提交信息，优先沿用历史提交中占主导且一致的语言作为默认值。
- 历史提交缺失、语言混合或无法判断时，先询问用户确认中文还是英文。
- 当前对话持续使用中文或英文，只能作为最后兜底：仅当没有可用历史、用户也未明确选择但对话语言稳定时使用；不确定就问。
- 不得把中文或英文写成硬性默认值；语言选择不影响作者身份、敏感文件、逻辑分组和提交后验证规则。

## 硬性规则

1. **提交信息语言必须遵循语言解析结果和用户可推翻选择。**
   - `type` 和 `scope` 使用英文规范，例如 `feat(auth): 增加登录校验` 或 `feat(auth): add login validation`。
   - description、body、footer 的说明文字使用确定后的中文或英文。
   - 用户明确指定语言时，按用户指定；用户未指定时，先看最近提交历史，再询问，最后才参考稳定对话语言。
   - 历史语言混合、样本太少或对话语言也不能明确判断时，先询问再提交。

2. **禁止携带 AI 作者或 AI 生成声明。**
   - 不得添加 `Co-authored-by` AI、Codex、Claude、ChatGPT、OpenAI、assistant、bot 等作者。
   - 不得添加 `Generated with ...`、`AI generated`、`Created by Codex` 等声明。
   - 不得把提交 author 或 committer 设置成 AI 身份。

3. **只能使用用户自己的 Git 作者身份。**
   - 提交前检查当前作者身份。
   - 若作者身份缺失或像 AI/机器人身份，停止并询问用户。
   - 不要擅自修改全局 git config。
   - 只有在用户明确同意时，才可设置仓库局部 `user.name` / `user.email`。

4. **footer 必须包含 `Authored-by` 署名。**
   - 每次提交信息 footer 必须包含：`Authored-by: <user.name> <user.email>`。
   - 署名必须来自当前 Git 作者身份，且必须和 `git log -1 --pretty=fuller` 中的 Author 保持一致。
   - 不得使用 AI、Codex、Claude、ChatGPT、OpenAI、assistant、bot 等身份作为署名。

5. **不做破坏性 git 操作。**
   - 不运行 `git reset --hard`、强制 push、删除分支等，除非用户明确要求。
   - 不跳过 hooks：不要使用 `--no-verify`，除非用户明确要求。
   - commit hook 失败时，修复问题后创建新提交；不要默认 amend。

## Conventional Commit 格式

```text
<type>[optional scope]: <description in the user-selected language>

[optional body in the user-selected language]

Authored-by: <user.name> <user.email>

[optional additional footer in the user-selected language]
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

Authored-by: Vincen <hx001007@gmail.com>

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

### 5. 确认语言并生成提交信息

如果用户已经明确要求中文或英文，直接使用该语言。否则先读取最近提交信息判断默认语言：

```bash
git log -20 --pretty=format:%s%n%b
```

判断规则：

- 最近提交的 description/body 明显以中文为主，就默认使用中文。
- 最近提交的 description/body 明显以英文为主，就默认使用英文。
- 忽略 `type(scope):`、`Authored-by`、issue key、`BREAKING CHANGE` 等机器字段对语言判断的影响。
- 历史提交缺失、语言混合或无法判断时，先询问用户确认中文还是英文：

```text
这次提交信息使用中文还是英文？
```

- 只有当历史不可用、用户也没有明确选择、且当前对话语言持续稳定时，才使用对话语言作为最后兜底；如果仍不确定，必须询问。

根据 diff 判断：

- **type**：变更类型。
- **scope**：受影响模块，可省略。
- **description**：使用确定后语言的一句话，祈使/动宾结构，尽量不超过 72 字符。
- **body**：使用确定后语言，必要时说明原因、设计取舍和影响。
- **footer**：必须包含 `Authored-by` 署名，可追加 issue、BREAKING CHANGE 等。

`Authored-by` 署名格式：

```text
Authored-by: <git config user.name> <git config user.email>
```

该署名必须和 Git 实际 Author 一致，不是 co-author，也不是 AI 生成声明。

示例：

中文：

```text
docs: 记录插件工作链路

Authored-by: Vincen <hx001007@gmail.com>
```

英文：

```text
feat(commit): support user-selected commit language

Check commit author identity, block AI co-authors, and ask for the commit language when needed.

Authored-by: Vincen <hx001007@gmail.com>
```

### 6. 执行提交

单行：

```bash
git commit -m "docs: 记录插件工作链路"
```

多行：

```bash
git commit -m "$(cat <<'EOF'
feat(commit): support user-selected commit language

Check commit author identity, block AI co-authors, and ask for the commit language when needed.

Authored-by: Vincen <hx001007@gmail.com>
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
- 提交信息语言与用户选择一致。
- footer 包含 `Authored-by: <user.name> <user.email>`。
- footer `Authored-by` 署名与 Git Author 一致。
- 没有 AI co-author 或生成声明。
- 工作区状态符合预期。

## 完成阶段使用

`finishing-a-development-branch` 在验证通过后，如果存在未提交变更，应提示用户是否提交。用户选择提交时，必须转入本技能。

提示模板：

```text
检测到当前有未提交变更。是否现在创建一次提交？

如果提交，我会使用 git-commit 技能：
- 分析 diff 并按逻辑暂存文件
- 按历史默认或你选择的中文/英文生成 Conventional Commit 信息
- 在 footer 添加 `Authored-by` 署名
- 检查作者身份，禁止 AI 作者或 AI 生成声明
```

## 常见错误

- 未询问语言偏好就自行选择提交语言。
- 未检查最近提交历史，就直接按对话语言生成提交信息。
- 用户要求英文却写成中文，或用户要求中文却写成英文。
- 缺少 `Authored-by: <user.name> <user.email>` footer。
- footer `Authored-by` 署名和 Git Author 不一致。
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
- 提交信息为 Conventional Commit，且语言与解析结果或用户选择一致。
- 提交 footer 包含用户本人 `Authored-by` 署名。
- 提交中没有 AI 作者、AI co-author 或 AI 生成声明。
- 提交后验证 `git log -1 --pretty=fuller`。
