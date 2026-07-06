# TODO

本文件记录 Coding Plugins 在真实会话使用中暴露出的流程问题和后续优化项。重点不是继续增加规则说明，而是把规则升级为可执行的状态机、门禁和证据系统。

## P0：流程门禁和正式证据

- [x] 统一任务入口：新增或强化 `coding-plugins task start|continue|status`，把 `start`、`workflow-mode`、`workflow-state`、`workflow-guard`、`workflow-brief` 的结果合并成唯一任务状态输出。
  - 输出必须包含 `mode`、`feature`、`doc_id`、`state`、`allowed_actions`、`blocked_actions`、`next_skill`、`decision_point`。
  - 用户说“继续 / 恢复 / 开始实现 / 执行 TED”时，必须先通过该入口重新判定状态。
- [x] 强化 full-chain / maintenance-chain 执行门禁：没有 approved PRD/TSD/TVD/TED 时，不允许进入实现。
  - 对 public API、schema、generator、release、dependency、SDK 兼容窗口等变更，默认进入 full-chain 或 maintenance-chain。
  - 发现“先实现，后补 TSD/TVD/TED”时，标记为 workflow violation，而不是允许补票通过。
- [x] 将 DP-0 到 DP-7 做成可执行决策点。
  - 增加 `coding-plugins dp status|request|approve|audit`。
  - 在正式链路中显式输出当前 DP、所需用户确认和被阻止的动作。
  - 未通过 DP-4 时禁止执行；未通过 DP-6/DP-7 时禁止提交、tag、发布。
- [ ] 明确 `docs/coding-plugins/` artifact mode。
  - 支持 `tracked`、`local`、`external` 三种模式。
  - `tracked`：PRD/TSD/TVD/TED/VED 必须入库，`.gitignore` 忽略该目录时 preflight 失败。
  - `local`：只能作为本机 scratch，不能作为完成声明或提交证据。
  - `external`：必须记录外部文档链接或 artifact id。
- [ ] 强化 evidence 合法性检查。
  - VED 引用的命令、测试、commit、tag、workflow run 必须可复核。
  - ignored evidence 不能作为正式完成证据。
  - `validate-tdd-evidence` 对“没有正式 Spec ID”的 warning 应根据 artifact mode 决定是否允许通过。

## P1：范围控制、发布和插件版本稳定性

- [ ] 增加范围膨胀检测 `coding-plugins scope-check`。
  - docs-only 改到 source/test/tool 时要求重新路由。
  - 单一任务扩展到多个独立 feature 时要求拆分。
  - README/TODO 任务扩展到 release helper、tag、publish 时要求升级为 maintenance-chain 或 release-chain。
- [ ] 增加 release 专用链路。
  - 新增 `coding-plugins release plan|guard|verify`。
  - 固定完成标准：release commit 已推送、tag 已推送、GitHub Actions 成功、发布目标可见、依赖解析通过。
  - 明确 `tag pushed != release complete`。
  - 多包发布必须表达顺序依赖，例如先 runtime 包，确认可解析后再 generator 包。
- [ ] 增加 commit guard。
  - 统一判断提交语言、作者身份、敏感文件、变更范围、当前分支、是否需要 DP-7。
  - 用户未指定提交语言时，不能只凭最近提交语言静默决定；需要按项目策略或显式确认。
  - main 分支直接提交或直接 push 时，按任务风险提示 branch/worktree/PR 方案。
- [ ] 固定单会话插件版本。
  - 首次运行生成 session lock，记录 plugin version、plugin root、CLI path、thread id。
  - 后续 fallback 必须读取该 lock，不允许混读多个 cache 版本。
  - `coding-plugins doctor` 输出 PATH、cache manifest、installed/enabled/version 和 artifact mode。
- [ ] 修正 CLI fallback 体验。
  - 避免 agent 直接 import `src/lib/...` 内部 TS 模块。
  - `preflight --root`、`--write-index`、`validate` 等命令必须能可靠作用于目标仓库。
  - CLI 不在 PATH 时，提供稳定的“当前 repo fallback”命令，而不是依赖硬编码 cache 版本。

## P2：执行体验和报告质量

- [ ] 提供 task brief 输出，减少重复读取完整 skill。
  - 由 CLI 输出本轮必要 skill、当前状态、下一命令、阻塞点和验证要求。
  - skill 文件仍是权威规则，但不应在长会话中反复手动查找多个版本。
- [ ] 优化完成报告模板。
  - 明确区分：已实现、已验证、未验证、只本地验证、已提交、已发布。
  - 发布类报告必须包含 workflow run、远端 tag、包仓库可见性或失败原因。
- [ ] 增加环境诊断。
  - 对 FVM/Dart SDK cache、build_runner AOT/JIT、GitHub auth、pub.dev auth、SSH host key 等常见阻塞提供 `doctor` 检查。
  - 避免每个验证命令都先失败再提权重跑。
- [ ] 建立会话复盘测试集。
  - 将真实失控模式转成 fixture case：full-chain 先实现后补、ignored evidence、连续“继续”未走 state、tag pushed 误判发布完成、混读多个插件版本。
  - `npm run preflight` 必须覆盖这些回归。
- [ ] 输出 migration guide。
  - 说明何时使用 lightweight TDD，何时必须 full-chain / maintenance-chain。
  - 说明业务仓库是否应该提交 `docs/coding-plugins/`，以及 local/external 模式的边界。

## 验收标准

- [ ] `full-chain` 下没有 approved TED 时，任何实现动作都会被 guard 阻止。
- [ ] 用户说“继续”时，CLI 能返回唯一下一步，而不是让 agent 自行推断。
- [ ] ignored 的 VED 不能被用作正式完成证据。
- [ ] release tag 推送后，必须验证 workflow 和发布目标可见，才能声明发布完成。
- [ ] 同一会话只使用一个插件版本；混读 cache 版本会被 doctor 报告。
- [ ] docs-only 任务扩展到源码、工具或发布动作时，scope-check 要求重新路由。
