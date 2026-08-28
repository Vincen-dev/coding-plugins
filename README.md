# Coding Plugins 2.1.0

面向 Codex、Claude Code、Gemini CLI 和本地 Skills 客户端的纯工作流插件。

2.0.0 不安装可执行工作流服务，不创建隐藏项目状态，也不维护第二套文档层级。插件只提供 manifests、Skills、prompts/templates、静态说明和风险递进的 Change Capsule。

## 五项不变量

所有 Profile 都必须遵守：

1. **测试先行：** 行为变更先观察真实 RED；重构先运行特征测试基线；静态契约使用 focused contract check；设备、签名、后端和性能保留明确的外部验收门禁。
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
| Governed Change | 外部公共 API、兼容、迁移、安全、发布或重要架构变更 | `change.md`、`plan.md`、`evidence.md` |
| Critical Change | 支付、凭证/Session 授权、不可逆数据、合规或高风险外部影响 | Governed 产物，可选 `design.md`、`tests.md` |

工作从 `using-coding-plugins` 开始。它选择最小安全 profile，并交给 `brainstorming`、`change-capsule`、`test-driven-development`、`systematic-debugging` 或其他对应 Skill。

## 执行前硬门禁

- 同一个 checkout 同一时间只允许一个写任务；先区分 clean、已知无关静态修改、重叠/未知修改和 active writer。已知无关且文件与生成资源不重叠时可保留在当前 checkout；重叠、未知或真实并发写入必须停止。独立 worktree 始终需要用户明确同意。
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

Governed 在方案已完整展示后，用户一条明确“接受该方案并立即执行”的指令可以同时满足范围/计划和执行记录；Critical 仍分别记录范围、技术与执行批准。批准依据真实指令，不按文档数量制造仪式。

模板位于 `skills/change-capsule/templates/`。如果团队已有 Wiki、工单或设计系统，可把它作为外部 artifact location，但不要同时维护第二份状态。

完成 Capsule 时压缩重复过程记录，只保留最终决策、当前 VC、关键 RED、最终验证、交付引用和剩余风险；`complete` 只表示当前切片完成。

所有生成文档的标题、章节、说明、决策、批准、证据和风险叙述必须使用简体中文。frontmatter 键、文件名、`change_id`、`VC-*`、代码标识、命令、路径和 API 名称保持英文。

## 功能模块文档交付

每个实施型任务在实现前执行 `Documentation Impact Check`：

- `none`：维护中的模块文档不受影响。
- `update-existing`：最终实现会让既有产品、功能、模块或架构文档过期，需要同步更新。
- `create-module-doc`：新增模块，或实质改变模块边界、生命周期、数据所有权、公共契约或外部集成，需要创建长期模块文档。
- `external-doc`：更新团队批准的 Wiki 或其他外部事实源，并在 `change.md` 记录目标或引用。

Change Capsule 记录一次变更的范围、决策、批准和证据；module documentation 记录交付后模块长期有效的目标、边界、入口、流程、数据、契约、生命周期、验证面和已知限制。两者不能重复维护 phase、approval、current task 或命令过程日志。

Module documentation is not mandatory for every change（并非每次变更都必须创建）。Inspect 不创建交付文档；Quick 只有在改变既有模块契约或重大边界时才更新；Standard、Governed 和 Critical 在 `change.md` 记录分类、目标、原因和验证。可选模板 `skills/change-capsule/templates/module-doc.md` 应复制到仓库现有产品/架构文档体系或适配外部事实源，不计入 Capsule 固定产物数量。

## 保留的工程纪律

- 行为实现前 RED；重构前先建立并运行特征测试基线。
- 每个行为或契约切片先写 Verifiable Contract，再建立匹配类型的 pre-change evidence。
- 文档影响非 `none` 时，把模块文档创建或更新作为交付任务，并验证其与最终实现一致。
- bug 先稳定复现和定位根因。
- 重要实现经过规格和质量两个角度的评审。
- 完成前运行并读取最新验证输出，同时确认 repository、branch/HEAD、diff、entrypoint、依赖、生成状态和 artifact/device provenance。
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

这只执行静态 `.mjs` contract tests，不是插件用户工作流的一部分，也不能单独证明真实 Agent 行为。风险路由、授权和多 Skill 交接还应使用场景测试或独立 forward-testing。

## License

[MIT](LICENSE)
