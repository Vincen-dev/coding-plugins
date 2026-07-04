# Formal Feature Chain Case Index

本索引用于说明 `formal-feature-chain` fixture 中每个案例的来源、优化目标和覆盖风险。案例不是正式产品文档；它们用于把真实维护问题沉淀成可回归验证的插件质量要求。

## routing-fixture

- case_id: CASE-ROUTING-001
- source_type: workflow_regression
- source_reference: Codex session routing and login state document chain
- optimization_target: 验证行为类需求从 PRD 到 TSD、TVD、TED、VED 的闭环。
- covered_risks:
  - PRD 写了登录分流需求，但 TSD 技术方案文档没有承接。
  - 测试用例只描述操作，没有绑定需求编号。
  - VED 证据无法说明最终验证覆盖了哪个需求。

## creek-wrapper-fixture

- case_id: CASE-CREEK-001
- source_type: downstream_pattern
- source_reference: evobeing_creek_wrapper upload status contract
- optimization_target: 验证 SDK wrapper API 契约、状态枚举和证据归档的闭环。
- covered_risks:
  - API 契约只停留在 PRD 正文，TSD 技术方案文档没有实现点。
  - TVD 未覆盖状态枚举和边界输入。
  - VED 无法证明 contract 验证覆盖了必须需求。

## plugin-cache-fixture

- case_id: CASE-CACHE-001
- source_type: release_regression
- source_reference: coding-plugins install cache and repository implementation drift
- optimization_target: 验证插件发布、安装缓存刷新和仓库实现一致性的文档闭环。
- covered_risks:
  - 仓库实现已更新，但安装缓存仍使用旧链路。
  - TED 只复述技术方案，没有形成可执行任务。
  - VED 没有记录缓存刷新验证结果。

## workflow-state-fixture

- case_id: CASE-STATE-001
- source_type: workflow_contract
- source_reference: spec-superflow state and contract freshness analysis
- optimization_target: 验证已有 TED 执行前能检测 feature/doc_id 当前阶段、上游文档 hash 和 plan stale 状态。
- covered_risks:
  - 代理恢复旧任务时只凭聊天记忆继续执行，没有检查 PRD/TSD/TVD/TED 是否齐全。
  - 上游需求、技术或测试用例变更后，TED 仍被当成可执行计划。
  - TED 没有明确 Intent Lock、Scope Fence、Required Tests 和 Rewind Triggers，导致实现阶段 scope drift。

## metadata-sync-fixture

- case_id: CASE-METADATA-001
- source_type: maintenance_regression
- source_reference: document metadata sync and related document freshness
- optimization_target: 验证 metadata 关系、同步更新和文档可读性维护闭环。
- covered_risks:
  - 某个文档更新后，相关文档没有同步更新。
  - related_* 关系存在，但正文无法说明阅读重点。
  - README 和 INDEX 无法帮助维护者理解文档链路。

## technical-quality-fixture

- case_id: CASE-TECHNICAL-QUALITY-001
- source_type: quality_regression
- source_reference: writing-technicals generated document readability and unfinished template content
- optimization_target: 验证 TSD 技术方案文档不只满足结构闭包，还要拒绝未替换模板占位、表格滥用、正文重复文档关系和不可交接的空泛内容。
- executable_regression: `tests/ts/document-metadata.test.mjs` 中的 technical quality validator/template cases。
- covered_risks:
  - TSD 保留 `<...>`、`YYYY-MM-DD` 或模板说明，却仍通过 preflight。
  - TSD 看似有映射表，但阅读摘要和设计摘要不能支持评审。
  - TSD 没有真实实现边界，导致 TED 和 TVD 只能继续复述空泛方案。
  - TSD 模板正文充满普通信息表格，读者只能机械填表而无法快速理解方案。
  - TSD 正文重复维护 PRD/TVD/TED/VED 路径，和 frontmatter `related_docs`、INDEX 的机器关系源冲突。

## brainstorming-fixture

- case_id: CASE-BRAINSTORMING-001
- source_type: workflow_regression
- source_reference: pre-SDD idea exploration and solution comparison
- optimization_target: 验证方案讨论、产品方向不清或是否值得做的入口先进入 brainstorming，而不是直接创建正式 PRD 链路。
- covered_risks:
  - 用户只要求方案讨论，插件却过早创建 README、PRD、TSD、TVD、TED 或 VED。
  - brainstorming 产物被误当成 approved 需求，绕过 SDD 和用户确认。
  - 方案比较没有明确目标、非目标、推荐路径和进入 SDD 的门禁。

## workflow-gate-fixture

- case_id: CASE-WORKFLOW-001
- source_type: workflow_contract
- source_reference: scenario-routing structured gates and route-to-case coverage
- optimization_target: 验证场景路由不只依赖自由文本 gates，而是用 gate_id 和 case_id 建立可回归的质量约束。
- covered_risks:
  - 场景链路文档有 gate 文案，但没有稳定 ID，后续修改难以发现语义漂移。
  - 新增场景没有绑定真实案例，导致流程看似完整但没有回归依据。
  - 插件维护场景绕过 RED 行为测试或 fixture case，只改文档说明。

## claude-entrypoint-fixture

- case_id: CASE-CLAUDE-001
- source_type: platform_entrypoint
- source_reference: Claude Code namespaced skill entry and reload behavior
- optimization_target: 验证 Claude Code 入口文档把自动选择视为 best-effort，并要求关键链路显式调用 `/coding-plugins:using-coding-plugins` 或具体技能。
- covered_risks:
  - 文档暗示 Claude Code 一定会自动选择正确技能，导致新链路没有被稳定使用。
  - `/reload-plugins` 后没有重新发送入口提示，继续沿用旧上下文判断。
  - 用户只知道插件已安装，但不知道如何手动进入 brainstorming 或 using-coding-plugins。

## bug-debugging-fixture

- case_id: CASE-BUG-001
- source_type: workflow_regression
- source_reference: systematic debugging before TDD bugfix
- optimization_target: 验证 bug、CI 失败和异常行为必须先稳定复现或定位根因，再进入 TDD 修复和 VED 证据。
- covered_risks:
  - 代理看到错误后直接改代码，没有复现、根因或失败测试。
  - 修复完成只报告“已解决”，没有 verification-before-completion 证据。
  - VED 证据无法区分 bug 复现、RED 失败和最终验证。

## review-feedback-fixture

- case_id: CASE-REVIEW-001
- source_type: workflow_regression
- source_reference: code review and received feedback handling
- optimization_target: 验证代码评审先输出 findings，处理反馈前先验证反馈是否成立，再决定修改、反驳或澄清。
- covered_risks:
  - review 输出先给总结，问题淹没在说明文字中。
  - 收到反馈后无条件修改，未验证反馈是否真实、是否过期或是否和现有契约冲突。
  - 反馈处理后没有回到验证或必要的 TDD 修复链路。

## commit-finish-fixture

- case_id: CASE-COMMIT-001
- source_type: workflow_regression
- source_reference: direct commit and branch finishing gates
- optimization_target: 验证直接提交、完成收尾和分支集成必须先检查 diff、作者身份、敏感文件和最新提交。
- covered_risks:
  - 完成后没有提交，或提交没有按用户选择语言生成 Conventional Commit 和 Authored-by footer。
  - 代理把中文或英文写成硬性默认值，没有在用户未指定语言时先询问。
  - 未检查 staged diff 和敏感文件就提交。
  - 分支收尾跳过提交或提交后没有验证最新 commit。

## parallel-dispatch-fixture

- case_id: CASE-PARALLEL-001
- source_type: workflow_regression
- source_reference: dispatching parallel agents and main-agent synthesis
- optimization_target: 验证并行任务必须先拆分独立领域，子任务完成后由主代理审阅合并结果并运行整体验证。
- covered_risks:
  - 不相关任务被串行混在一个上下文里，导致遗漏或互相污染。
  - 子代理结果未经主代理审阅就直接采纳。
  - 并行结果只各自通过，没有做最终整体校验。
