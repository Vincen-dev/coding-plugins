# Coding Plugins

Coding Plugins 是 Superpowers 风格的中文编码代理方法论插件，支持 Codex 和 Claude Code。它由一组可组合的 skills、提示词模板、参考资料和脚本组成，用来约束编码代理在做软件开发时先澄清、再计划、再小步实现、再验证和收尾。

本插件是中文本地版本：插件名称为 `coding-plugins`，但保留了 Superpowers 的核心流程、支持文件和 prompts。默认文档路径使用 `docs/coding-plugins/`；如果项目或用户已有约定，以用户约定为准。

## 工作方式

当代理看到你要构建或修改东西时，它不应该直接写代码。它会先退一步问清楚你真正要解决的问题，逐步形成规格说明。规格通过后，它会写出足够具体的实现计划：文件、代码、测试、命令、预期结果都要写清楚。

之后进入实现阶段。推荐使用子代理驱动开发：每个任务由新子代理实现，主代理在任务之间做规格符合性和代码质量评审。没有子代理能力时，也可以在当前会话中按批次执行计划并设置人工检查点。

## 基本流程

1. **using-coding-plugins / using-superpowers** - 入口技能。判断应该使用哪个工作流技能。
2. **brainstorming** - 写代码前激活。通过问题、取舍和分段确认把粗略想法变成设计。
3. **using-git-worktrees** - 设计通过后使用。创建隔离 worktree 和新分支，避免污染当前工作区。
4. **writing-plans** - 基于已批准设计写实现计划。任务拆到 2 到 5 分钟粒度，包含代码和验证命令。
5. **subagent-driven-development / executing-plans** - 根据计划执行。优先子代理驱动；没有子代理时内联执行。
6. **test-driven-development** - 实现时强制 RED-GREEN-REFACTOR：先失败测试，再最小实现，再重构。
7. **requesting-code-review** - 任务之间或合并前评审，按严重级别报告问题。
8. **receiving-code-review** - 收到评审后先验证反馈，再决定是否修改。
9. **git-commit** - 用户要求提交或完成阶段需要提交时，生成中文 Conventional Commit，在 footer 添加本人 `Authored-by` 署名，并禁止 AI 作者或 AI 生成声明。
10. **finishing-a-development-branch** - 所有任务完成后验证测试、提示是否提交、提出合并/PR/保留/丢弃选项并清理。

完整链路说明见 [docs/workflow-chain.md](docs/workflow-chain.md)。

## 技能库

**测试**

- `test-driven-development`：RED-GREEN-REFACTOR 循环，包含测试反模式参考。

**调试**

- `systematic-debugging`：四阶段根因定位流程，包含根因追踪、防御式修复、基于条件等待等参考。
- `verification-before-completion`：声明完成前用证据确认真的修好。

**协作**

- `brainstorming`：苏格拉底式需求澄清和设计确认。
- `writing-plans`：详细实现计划。
- `executing-plans`：带检查点的批次执行。
- `dispatching-parallel-agents`：并行子代理工作流。
- `requesting-code-review`：代码评审请求模板。
- `receiving-code-review`：处理评审反馈。
- `git-commit`：中文 Conventional Commit，检查作者身份，在 footer 添加本人 `Authored-by` 署名，禁止 AI 作者。
- `using-git-worktrees`：并行开发分支和隔离工作区。
- `finishing-a-development-branch`：分支收尾和集成决策。
- `subagent-driven-development`：每任务子代理实现，两阶段评审。

**元技能**

- `writing-skills`：按照可复用技能最佳实践创建和测试新技能。
- `using-coding-plugins`：中文入口技能。
- `using-superpowers`：兼容原 Superpowers 入口命名的中文入口技能。

## 哲学

- **测试驱动开发**：永远先写测试。
- **系统化优先**：流程胜过猜测。
- **降低复杂度**：简单性是首要设计目标。
- **证据胜过声明**：完成前必须验证。

## 本地使用说明

当前目录是插件源码目录，不会自动注册到 marketplace。需要在 Codex App 中展示时，再把它加入个人 marketplace。

### Codex

Codex 侧通过 `.codex-plugin/plugin.json` 识别插件，并使用 `skills/*/agents/openai.yaml` 提供展示元数据。插件结构校验：

```bash
PYTHONPATH=/private/tmp/codex-yaml-shim python3 /Users/vincen/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/vincen/workspace/plugins/coding-plugins
```

### Claude Code

Claude Code 侧通过 `.claude-plugin/plugin.json` 识别插件，技能会以 `/coding-plugins:<skill-name>` 形式出现。本地加载：

```bash
claude --plugin-dir ./plugins/coding-plugins
```

常用入口：

```text
/coding-plugins:using-coding-plugins
/coding-plugins:using-superpowers
```

修改插件组件后运行 `/reload-plugins`。更多说明见 [docs/claude-code-usage.md](docs/claude-code-usage.md)。
