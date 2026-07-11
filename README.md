# Coding Plugins 2.1.0

面向 Codex、Claude Code、Gemini CLI 和本地 Skills 客户端的纯工作流插件。

2.0.0 不安装可执行工作流服务，不创建隐藏项目状态，也不维护第二套文档层级。插件只提供 manifests、Skills、prompts/templates、静态说明和风险递进的 Change Capsule。

## 五项不变量

所有 Profile 都必须遵守：

1. **测试先行：** 行为变更先观察失败测试或可复现失败检查；重构先运行足够的特征测试基线。
2. **可验证契约：** 实现前写清 `Outcome`、`Boundary`、`Verification`。持久化变更使用编号 `VC-*`。
3. **系统化执行：** 按契约、失败证据、最小实现、最新验证的顺序推进；证据不足时停止调查，不猜测。
4. **简单优先：** 选择最低但诚实的风险 Profile，只创建该 Profile 必需的产物，并保持单一状态源。
5. **证据先于声明：** 只有运行并读取最新验证后，才能声明修复、完成、通过或可交付。

## 核心模型

| Profile | 场景 | 产物 |
| --- | --- | --- |
| Inspect | 分析、解释、审查、状态查询 | 无 |
| Quick Change | 边界明确的小修 | 无，直接 TDD 与验证 |
| Standard Change | 多轮或多文件但风险有限 | `change.md` |
| Governed Change | API、兼容、迁移、安全、发布或重要架构变更 | `change.md`、`plan.md`、`evidence.md` |
| Critical Change | 支付、身份、不可逆数据、合规或高风险外部影响 | Governed 产物，可选 `design.md`、`tests.md` |

工作从 `using-coding-plugins` 开始。它选择最小安全 profile，并交给 `brainstorming`、`change-capsule`、`test-driven-development`、`systematic-debugging` 或其他对应 Skill。

## 执行前硬门禁

- 同一个 checkout 同一时间只允许一个写任务；并发写任务使用独立 worktree 或等待。
- Governed/Critical 缺少必需 Skill、产物或批准时停止，不得降级为 Quick Change 继续。
- 会改变范围、公共行为、schema、migration、兼容、回滚或验证的条件性假设必须转成明确 Decision Point，未解决前不得实现。
- 公共 API、schema、migration、兼容、安全和发布类变更默认运行完整相关测试套件；无法运行时必须收窄完成声明并记录剩余风险。

## 为什么改成纯工作流

早期版本同时维护命令入口、状态文件、批准记录、文档层级和 Skills，产生了重复事实来源。2.0.0 删除这些运行时层，把复杂度收敛到三条原则：

- 风险决定流程，不是文档数量决定流程。
- `change.md` 是有状态变更的唯一事实来源。
- TDD、评审、最新验证和提交安全继续由 owning Skill 负责。

## Change Capsule

默认目录：

```text
docs/coding-plugins/changes/<change-id>/
```

- Standard 只使用 `change.md`。
- Governed 使用 `change.md`、`plan.md`、`evidence.md`。
- Critical 按需增加设计、测试或外部合规附件。

模板位于 `skills/change-capsule/templates/`。如果团队已有 Wiki、工单或设计系统，可把它作为外部 artifact location，但不要同时维护第二份状态。

所有生成文档的标题、章节、说明、决策、批准、证据和风险叙述必须使用简体中文。frontmatter 键、文件名、`change_id`、`VC-*`、代码标识、命令、路径和 API 名称保持英文。

## 保留的工程纪律

- 行为实现前 RED；重构前先建立并运行特征测试基线。
- 每个实现任务先写 Verifiable Contract，再建立 test-first evidence。
- bug 先稳定复现和定位根因。
- 重要实现经过规格和质量两个角度的评审。
- 完成前运行并读取最新验证输出。
- commit 前检查 diff、敏感文件、作者身份和用户授权。
- 范围或风险上升时升级 profile 并重新确认相应边界。

## 安装

见 [INSTALL.md](INSTALL.md)。2.0.0 的安装只让平台发现 `skills/`，没有额外运行时、锁文件或全局命令。

## 从 1.x 迁移

见 [docs/migration-guide.md](docs/migration-guide.md)。旧自动化需要改为 Skill invocation；退役设计仅保留在 Git 历史和迁移记录中，新变更统一使用 Change Capsule。

## 仓库维护验证

仓库维护者可运行：

```bash
npm test
```

这只执行静态 `.mjs` contract tests，不是插件用户工作流的一部分。

## License

[MIT](LICENSE)
