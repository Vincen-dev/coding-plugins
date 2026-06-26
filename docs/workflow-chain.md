# Coding Plugins Workflow Chain

本文记录 `coding-plugins` 当前的完整工作链路、各 skill 的职责边界、关键门禁和已知注意点。它是面向维护者和使用者的流程说明，不替代各 skill 内部的执行规则。

## 总览

`coding-plugins` 是一套编码代理方法论插件，支持 Codex 和 Claude Code。它的目标不是提供单个 API 工具，而是约束代理按稳定工程流程推进软件开发：

1. 先判断任务类型。
2. 新需求先进入 SDD，写成可追踪、可测试、可评审的规格。
3. 已批准规格再写计划，并建立 Spec ID -> Test -> Task 追踪。
4. 按计划隔离执行。
5. 实现阶段遵守 TDD，测试必须来自规格、bug 复现或明确验收标准。
6. 每个任务通过规格符合性和代码质量评审。
7. 完成前必须验证规格覆盖和测试证据。
8. 如有未提交变更，在完成阶段提示是否提交。
9. 提交必须使用中文 Conventional Commit，在 footer 添加本人 `Authored-by` 署名，且禁止 AI 作者。
10. 最后做分支收尾和集成选择。

## 主链路

```mermaid
flowchart TD
  A["用户提出任务"] --> B["using-coding-plugins 或 using-superpowers"]
  B --> C{任务类型}
  C -->|新功能/行为变更/契约不清| D["spec-driven-development"]
  C -->|已有规格| E["writing-plans"]
  C -->|已有计划| F["subagent-driven-development 或 executing-plans"]
  C -->|bug/测试失败/异常行为| G["systematic-debugging"]
  D --> H["写可测试规格并等待用户批准"]
  H --> E
  E --> I["写 plans 实现计划和追踪矩阵"]
  I --> J["选择执行方式"]
  J -->|推荐| K["subagent-driven-development"]
  J -->|无子代理能力| L["executing-plans"]
  K --> M["按任务实现"]
  L --> M
  M --> N["test-driven-development"]
  N --> O["spec-reviewer 规格符合性评审"]
  O --> P["code-quality-reviewer 代码质量评审"]
  P --> Q["verification-before-completion"]
  Q --> R["finishing-a-development-branch"]
  R --> S{"是否有未提交变更？"}
  S -->|用户选择提交| T["git-commit"]
  S -->|暂不提交| U["merge/PR/保留/丢弃选项"]
  T --> U
```

## Skill 职责

### 入口层

`using-coding-plugins` 是中文主入口。它负责根据任务类型路由到具体 skill，并建立“先选技能、再行动”的执行习惯。

`using-superpowers` 是旧入口命名兼容。它不表示兼容原插件全部行为；当前规则与中文入口一致，便于已有调用迁移。

### 平台层

Codex 侧使用 `.codex-plugin/plugin.json` 和 `skills/*/agents/openai.yaml` 展示插件与技能元数据。技能中出现其他平台工具名时，按 `skills/using-coding-plugins/references/codex-tools.md` 转换到当前 Codex 能力。

Claude Code 侧使用 `.claude-plugin/plugin.json` 识别插件。技能以 `/coding-plugins:<skill-name>` 命名空间出现，例如 `/coding-plugins:using-coding-plugins` 和 `/coding-plugins:git-commit`。Claude 工具名可直接使用；平台注意事项见 [docs/claude-code-usage.md](claude-code-usage.md)。

### 规格层

`spec-driven-development` 处理新需求、功能构想、行为变更、接口契约、schema、状态机和验收标准。它有硬门禁：规格获批前不得写代码、搭脚手架或调用实现技能。

默认规格路径：

```text
docs/coding-plugins/specs/YYYY-MM-DD-<topic>-spec.md
```

该阶段输出应包括：

- 项目上下文。
- 用户目标、非目标和成功标准。
- 规格类型选择：feature、API contract、schema、state machine、acceptance criteria。
- 稳定 Spec ID：`REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON`。
- 外部契约示例：请求/响应、schema 样例、状态迁移或错误样例。
- Traceability Matrix 初稿。
- `validate_spec.py` 自动校验结果；需要机器读取时使用 `--format json`。
- 规格自审结果。
- 用户确认。

### 计划层

`writing-plans` 把规格转成可执行计划。计划要求精确文件路径、完整代码片段、测试命令、预期输出和 Spec ID -> Test -> Task 追踪矩阵。

默认计划路径：

```text
docs/coding-plugins/plans/YYYY-MM-DD-<feature-name>.md
```

计划文档应说明推荐执行方式：

- `subagent-driven-development`：推荐，适合有子代理能力的环境。
- `executing-plans`：降级方案，适合无子代理能力或需要当前会话内执行。

### 隔离层

`using-git-worktrees` 负责确认或创建隔离工作区。标准顺序应是：

```text
spec-driven-development -> writing-plans -> using-git-worktrees -> subagent-driven-development/executing-plans
```

它会先检测当前是否已经处于 linked worktree，再优先使用平台原生 worktree 能力，最后才回退到 `git worktree`。

### 执行层

`subagent-driven-development` 是推荐执行路径。它要求：

- 每个任务派发一个新的实现子代理。
- 子代理不能自己读取完整计划，主代理应提供完整任务文本和必要上下文。
- 每个任务后先做规格符合性评审。
- 规格通过后再做代码质量评审。
- 两个评审都通过后才进入下个任务。
- 所有任务完成后做最终整体代码评审。

`executing-plans` 是当前会话执行路径。它要求先审阅计划，有关键问题时停止并询问；没有问题时按任务逐步执行，并在全部任务完成后进入分支收尾。

### 测试与调试层

`test-driven-development` 适用于功能、bugfix、重构和行为变更。测试必须来自已批准规格、bug 复现或明确验收标准。铁律是：

```text
没有先失败的测试，就不能写生产代码。
```

`systematic-debugging` 适用于 bug、测试失败、构建失败、性能问题和异常行为。铁律是：

```text
没有根因调查，就不能修复。
```

调试链路中，如修复需要写测试，应转入 `test-driven-development`。

### 评审层

`requesting-code-review` 提供通用代码评审模板，适用于任务完成后、重要功能完成后和合并前。

`receiving-code-review` 约束评审反馈的处理方式：先理解和验证，再决定采纳、反驳或澄清。外部评审是建议，不是命令。

`subagent-driven-development` 内置两个专门评审模板：

- `spec-reviewer-prompt.md`：检查实现是否符合任务规格。
- `code-quality-reviewer-prompt.md`：检查实现是否构建良好、测试充分、可维护。

### 提交层

`git-commit` 负责创建提交。它参考 Conventional Commits 的类型体系，但要求提交说明使用中文：

```text
docs: 记录插件工作链路
feat(commit): 增加中文提交工作流
```

硬性规则：

- `type` 和可选 `scope` 使用 Conventional Commit 英文规范。
- description、body、footer 的说明文字必须中文。
- footer 必须包含用户本人 `Authored-by` 署名：`Authored-by: <user.name> <user.email>`。
- 禁止 AI 作者、AI co-author 或 AI 生成声明。
- 提交 author/committer 必须是用户自己的 Git 身份。
- 不擅自修改全局 git config。
- 不使用 `--no-verify`、强推或其他破坏性操作，除非用户明确要求。

### 验证与收尾层

`verification-before-completion` 要求完成声明必须有新鲜验证证据。没有在当前上下文运行验证命令，就不能声称测试通过、构建成功或 bug 已修复。有 SDD 规格时，还必须核对 Traceability Matrix 是否覆盖所有 MUST 规格。

`finishing-a-development-branch` 负责：

1. 验证测试。
2. 检查是否有未提交变更。
3. 如有未提交变更，提示用户是否使用 `git-commit` 创建提交。
4. 检测普通仓库、worktree 或 detached HEAD。
5. 判断 base branch。
6. 给出 merge、PR、保留、丢弃选项。
7. 按用户选择执行。
8. 对本流程创建的 worktree 做清理。

## 文档和产物路径

默认路径：

```text
docs/coding-plugins/specs/
docs/coding-plugins/plans/
```

规格模板和参考：

```text
skills/spec-driven-development/scripts/
skills/spec-driven-development/templates/
skills/spec-driven-development/references/
```

用户、仓库或团队已有约定时，优先使用已有约定。

## 降级路径

如果没有子代理能力：

```text
writing-plans -> executing-plans -> requesting-code-review -> verification-before-completion -> finishing-a-development-branch
```

如果不能创建 worktree：

```text
using-git-worktrees 检测失败 -> 说明原因 -> 在当前目录执行基线测试 -> 用户确认后继续
```

如果无法运行自动化测试：

```text
说明阻塞原因 -> 使用最接近的手工验证、脚本、日志或截图 -> 在最终回复中标注风险
```

如果用户要求提交：

```text
用户要求提交或完成阶段选择提交 -> git-commit -> 检查 diff/status/作者身份/敏感文件 -> 中文提交并添加 Authored-by 署名 footer -> 验证最新提交
```

## 当前注意点

当前流程以 SDD + TDD 为主线，在跨 Codex/Claude Code 环境中有几个点需要维护者特别注意：

1. **提交动作需要用户或仓库流程允许。** 完成阶段只提示是否提交；用户同意后才进入 `git-commit`。
2. **worktree 顺序应明确。** 推荐维护为统一顺序：先规格，再计划，再创建或确认隔离工作区，再执行。
3. **提交身份必须保持用户本人。** 如果 Git 配置缺失或疑似 AI/机器人身份，必须停止并询问用户；提交 footer 中的 `Authored-by` 署名也必须和 Git Author 一致。
4. **Claude Code 使用命名空间技能。** 手动调用时使用 `/coding-plugins:<skill-name>`；修改 manifest、hooks、agents 或其他插件组件后运行 `/reload-plugins`。

## 推荐后续改进

1. 将 `spec-driven-development/scripts/validate_spec.py` 接入 CI 或插件发布前检查。
2. 继续补充真实项目规格样例，用于回归测试 SDD 校验器的误报和漏报。
3. 若准备作为个人 marketplace 插件安装，再补 Codex marketplace 或 Claude marketplace 注册说明。
