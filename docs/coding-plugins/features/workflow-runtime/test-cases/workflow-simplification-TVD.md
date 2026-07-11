---
title: Coding Plugins 工作流简化与工程策略绑定测试用例
status: approved
feature: workflow-runtime
doc_id: workflow-simplification
created: 2026-07-11
updated: 2026-07-11
related_docs:
  - docs/coding-plugins/features/workflow-runtime/requirements/workflow-simplification-PRD.md
  - docs/coding-plugins/features/workflow-runtime/technicals/workflow-simplification-TSD.md
  - docs/coding-plugins/features/workflow-runtime/plans/workflow-simplification-TED.md
  - docs/coding-plugins/features/workflow-runtime/evidences/workflow-simplification-VED.md
---

# Coding Plugins 工作流简化与工程策略绑定测试用例

## 阅读摘要

- **本文结论:** 通过 12 组功能/兼容测试和 5 组 `TC-POL-*` 工程政策测试，覆盖 PRD 的全部 MUST 规格以及 REQ-010、OBS-001。测试以 TypeScript library contract 和 CLI e2e 为主，不依赖网络或真实用户仓库；四个用户提供的历史会话仅提取稳定意图作为去标识化路由 fixture。
- **当前状态:** 已通过当前 v1 DP-3 测试设计批准，进入 TED 执行计划设计。
- **先读重点:** 先看测试用例总览、TC-001 至 TC-012、TC-101 至 TC-105，以及通过/失败标准。
- **下游同步:** TVD 获批后创建同一 `doc_id` 的 TED；实际 RED/GREEN/REFACTOR、Policy Evidence 和最终验证输出只写入 VED。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | workflow-runtime |
| Doc ID | workflow-simplification |
| 文档类型 | TVD |
| 关系源 | frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md` |
| 批准语义 | 当前变更使用 governed-v1 DP-3；目标 governed-v2 的联合技术批准由 TC-005、TC-007 验证 |

## 测试策略摘要

- 单元/contract 层：测试 intent classifier、route decision、active change、scope drift、Policy resolver、coverage graph、decision hash 和 completion state 等纯函数或隔离模块。
- fixture 层：在临时目录生成 Quick、Standard、Governed、v1/v2、tracked/local/ignored 等项目结构，验证文档与状态恢复，不读写真实用户配置。
- CLI e2e 层：通过仓库真实 `bin/coding-plugins.js` 验证单入口、JSON schema、旧命令转发、exit code 和 text/JSON diagnostics 等价。
- 兼容层：继续执行现有 `productization-cli.test.mjs`、`workflow-state.test.mjs`、`src-architecture.test.mjs` 和正式 fixture 测试。
- 人工验收边界：仅检查 CLI text 的可读性和迁移说明是否表达清楚；所有状态和门禁结论均由自动化断言覆盖。
- 高风险顺序：先锁定 v1 contract，再增加 v2 opt-in；先验证 stale/eligibility，再允许 approve/complete；默认版本切换属于后续独立发布门禁。

## 风险到测试映射

- REQ-001、REQ-002 / 风险：路由结果仍然互相矛盾，或把 unknown scope 当作零。
  - 测试覆盖：TC-001 路由回放、TC-002 contract 不变量、TC-012 diagnostics 等价。
  - 未覆盖说明：自然语言无限表达不做穷举；有序规则未识别的输入应稳定返回 `uncertain`，由测试覆盖降级语义。
- REQ-003 / 风险：长会话恢复错误 change，或把新目标追加到已完成链。
  - 测试覆盖：TC-003 的显式/cache/文档恢复优先级、歧义、expanded/new-change。
  - 未覆盖说明：跨设备同步不在本期范围；runtime state 是可丢弃本地缓存。
- REQ-004 / 风险：轻量变更重新膨胀为全链，或 Governed Change 被错误降级。
  - 测试覆盖：TC-004 三种 artifact profile fixture。
  - 未覆盖说明：长期 specs delta/archive 是 PRD 非目标，只验证预留字段可被忽略读取。
- REQ-005、MIG-001 / 风险：v1 DP ID 被 v2 新语义重解释，或批准内容变化后仍有效。
  - 测试覆盖：TC-005 catalog/hash/stale、TC-011 兼容回归、TC-POL-COMPAT-001。
  - 未覆盖说明：默认 v2 切换属于后续 major release，本期只测试 opt-in 与迁移诊断。
- REQ-006、REQ-007、REQ-008 / 风险：个人 Skill 路径被当作正式 Policy，或 approved Policy 在 TED/VED 中丢失。
  - 测试覆盖：TC-006 resolver、TC-007 technical bundle、TC-008 coverage graph、TC-POL-DOC-001。
  - 未覆盖说明：Skill 本身的业务正确性由对应 Skill 仓库测试负责；本期验证解析、绑定、portable 和 evidence contract。
- REQ-009 / 风险：ignored/local evidence 再次误报 formal completion，或 workflow 永远停在 ready-for-execution。
  - 测试覆盖：TC-009 completion audit、TC-POL-VERIFY-001。
  - 未覆盖说明：发布平台状态不在本期实现；publish 只验证独立状态维度。
- REQ-010、OBS-001 / 风险：Agent 仍需串联多个命令，或生成业务仓库不存在的本地 bin fallback。
  - 测试覆盖：TC-010 CLI e2e、TC-012 reason codes、TC-POL-ARCH-001。
  - 未覆盖说明：第三方非 JSON 文本解析器不提供兼容保证；迁移期保证结构化 contract。

## 测试环境与数据

- 环境：项目支持的 Node.js 版本、本地与 CI；测试通过 `node --test` 执行，CLI 子进程使用当前仓库入口。
- 文件系统：每个 fixture 创建独立临时根目录，结束后由 Node test cleanup 删除；不写入工作区 `.coding-plugins` 状态。
- 时钟：decision timestamp 使用注入 clock 或只断言格式/顺序，不比较真实墙钟值。
- Hash：fixture 使用固定正文与稳定序列化，断言相同语义产生相同 SHA-256、required 内容变化产生不同 hash、展示字段变化不影响 hash。
- 会话路由数据：
  - S-INSPECT-SDK（来源会话 `019f47d0-1d4d-7dc1-893f-79330c11743c`）：只读分析 SDK 云端配置实现。
  - S-CHANGE-UI（来源会话 `019f4581-bf54-74b0-8ef2-bc79bdbd6656`）：多回合 UI 优化，不涉及 public API/schema/migration。
  - S-GOVERNED-SCHEMA（来源会话 `019f4168-691f-7c60-9aea-a0151a730775`）：数据库 schema、protobuf 与云端兼容联动。
  - S-INSPECT-COMPARE（来源会话 `019f3fca-b130-7e80-9603-4853b17f68ed`）：只读比较 OpenSpec 与 Coding Plugins。
- Policy 数据：repo-relative Policy、versioned-plugin Policy/Skill、personal absolute Skill、冲突 required Policies、缺失 source、recommended-only 变化。
- 隔离：外部网络、真实插件安装、GitHub、发布平台均不参与测试；CLI reference 通过 fixture 配置或当前可执行入口注入。

## 测试用例总览

| 测试用例 | 标题 | 覆盖规格 / Policy | 测试类型 | 执行方式 | 证据目标 |
| --- | --- | --- | --- | --- | --- |
| TC-001 | 三流程路由回放 | REQ-001 | behavior | 自动化 | VED Requirement Evidence |
| TC-002 | RouteDecision 唯一契约 | REQ-002 | contract | 自动化 | VED Contract Evidence |
| TC-003 | Active Change 恢复与范围漂移 | REQ-003 | state | 自动化 | VED State Evidence |
| TC-004 | Quick/Standard/Governed 文档分层 | REQ-004 | config/fixture | 自动化 | VED Artifact Evidence |
| TC-005 | v1/v2 决策目录与 stale | REQ-005、MIG-001 | state/contract | 自动化 | VED Decision Evidence |
| TC-006 | Policy 与 Skill 解析 | REQ-006 | schema/behavior | 自动化 | VED Policy Resolution Evidence |
| TC-007 | 技术批准包审计 | REQ-007 | contract | 自动化 | VED Technical Approval Evidence |
| TC-008 | Policy 全链覆盖 | REQ-008 | architecture/source-scan | 自动化 | VED Policy Coverage Evidence |
| TC-009 | Evidence eligibility 与完成态 | REQ-009 | state/behavior | 自动化 | VED Completion Evidence |
| TC-010 | 单一 task facade | REQ-010 | CLI e2e | 自动化 | VED CLI Evidence |
| TC-011 | v1 兼容迁移 | MIG-001 | compatibility | 自动化 | VED Compatibility Evidence |
| TC-012 | 稳定 reason code 与修复动作 | OBS-001 | contract/CLI | 自动化 | VED Diagnostics Evidence |
| TC-101 / TC-POL-ARCH-001 | Library/CLI 分层 | POL-ARCH-001 | architecture | 自动化 | VED Policy Evidence |
| TC-102 / TC-POL-COMPAT-001 | 兼容策略门禁 | POL-COMPAT-001 | compatibility | 自动化 | VED Policy Evidence |
| TC-103 / TC-POL-TDD-001 | TDD 证据完整性 | POL-TDD-001 | source-scan/config | 自动化 | VED Policy Evidence |
| TC-104 / TC-POL-VERIFY-001 | 新鲜验证证据 | POL-VERIFY-001 | behavior/config | 自动化 | VED Policy Evidence |
| TC-105 / TC-POL-DOC-001 | 正式文档一致性 | POL-DOC-001 | config | 自动化 | VED Policy Evidence |

## 三流程路由回放（TC-001 / REQ-001）

### 测试目标

验证四个真实会话意图和典型小改动只返回 Inspect、Change、Governed Change 之一，并且每次只有一个下一动作。

### 前置条件

- 没有 active change；repository signals 由 fixture 明确提供。
- intent classifier 和 route decision 通过 public library API 调用。

### 测试步骤

1. 分别输入 S-INSPECT-SDK、S-CHANGE-UI、S-GOVERNED-SCHEMA、S-INSPECT-COMPARE。
2. 输入“小按钮问号文本改为 Icon”，风险信号为空。
3. 对每个输入重复执行两次并序列化结果。

### 断言

- 两个只读分析 fixture 返回 `inspect`；UI 与按钮修改返回 `change`；schema/protobuf/云端兼容返回 `governed-change`。
- 每个结果只有一个 `flow`、一个 `next.action`，无并列 mode。
- 相同输入两次结果除诊断展示顺序外完全一致；展示顺序也应由稳定排序固定。

### 测试数据

- 主要数据：测试环境中定义的 S-* intent、risk signals、scope knowledge。
- 覆盖条件：只读、日常 UI、多回合标准变更、高风险 schema/compatibility。
- 数据隔离：纯对象，无文件写入。

### 证据目标

- VED 记录 TC-001 RED/GREEN 输出和四个 fixture 的决策摘要。

## RouteDecision 唯一契约（TC-002 / REQ-002）

### 测试目标

验证 route、state、actions、next skill/command 均源自一个 `RouteDecisionV2`，未知 scope 保持 unknown，v1 projection 不产生矛盾。

### 前置条件

- 使用固定 repository/document state fixture。
- 分别请求 contract version 1 与 2。

### 测试步骤

1. 省略 file/task/feature counts 调用 `WorkflowRuntime.evaluate`。
2. 构造现有已知失败组合：旧 mode classifier 倾向 `tdd-only`，文档状态倾向 `spec-driven-development`。
3. 请求 v2 contract，再从同一 decision 生成 v1 projection。

### 断言

- scope knowledge 为 `unknown`，不存在自动补零。
- v2 只返回一个 flow 和 next action；allowed 与 blocked actions 无交集。
- v1 projection 要么自洽，要么返回 `COMPAT_PROJECTION_UNAVAILABLE`，不会同时声称 tdd-only 和继续 formal chain。
- payload 包含 `schemaVersion` 和稳定 diagnostics。

### 测试数据

- 主要数据：unknown counts、冲突旧分类、formal document state。
- 覆盖条件：正常投影与不可无损投影。
- 数据隔离：纯对象。

### 证据目标

- VED 记录 contract schema、invariant assertions 和 compatibility error。

## Active Change 恢复与范围漂移（TC-003 / REQ-003）

### 测试目标

验证“继续”可以恢复唯一 change，并正确区分 within-scope、expanded、new-change、uncertain。

### 前置条件

- 临时仓库分别包含显式 change id、runtime cache、单个 active `change.md`、单个 Governed chain、多个候选和已完成链。

### 测试步骤

1. 按显式参数、cache、Standard doc、Governed doc 的优先级调用恢复。
2. 删除 cache 后从正式文档重建。
3. 对现有 acceptance 内小改、public API 扩大、完成后数据库性能新目标、信息不足输入执行 scope classification。

### 断言

- 恢复优先级固定，cache 丢失不影响唯一正式链恢复。
- 多候选返回 `ACTIVE_CHANGE_AMBIGUOUS`，不随机选择。
- 四种输入依次得到 within-scope、expanded、new-change、uncertain。
- expanded 进入 `needs-rescope`；new-change 不追加旧 VED/TED。

### 测试数据

- 主要数据：固定 active records、PRD acceptance、planned files、completed chain。
- 覆盖条件：恢复成功、歧义、缓存损坏、范围四分类。
- 数据隔离：临时目录自动清理。

### 证据目标

- VED 记录恢复来源和 scope reason codes。

## Quick/Standard/Governed 文档分层（TC-004 / REQ-004）

### 测试目标

验证三种变更强度对应零文档、单 `change.md` 和完整正式链，不发生文档数量膨胀或风险降级。

### 前置条件

- 临时仓库可调用 artifact scaffold/validator API。

### 测试步骤

1. 为按钮小改创建 Quick Change。
2. 为多回合 UI 优化创建 Standard Change。
3. 为 schema migration 创建 Governed Change。
4. 校验每类 artifact set 和 change schema。

### 断言

- Quick 不创建 feature/change 流程文档。
- Standard 只创建一份含 Intent、Acceptance、Scope、Tasks、Decisions、Evidence、Completion 的 `change.md`。
- Governed 使用 PRD/TSD/TVD/TED/VED；高风险输入不能选择 Quick/Standard。
- 预留 `spec_refs`/`delta_refs` 缺省不影响第一阶段读取。

### 测试数据

- 主要数据：按钮、UI、schema migration 三类 intent/risk fixture。
- 覆盖条件：零、一、五类 artifact 边界。
- 数据隔离：临时目录自动清理。

### 证据目标

- VED 记录每类生成文件清单与 validator 输出。

## v1/v2 决策目录与 stale（TC-005 / REQ-005、MIG-001）

### 测试目标

验证 v1 历史语义保持不变，v2 按 DP-1/2/3 批准 bundle，语义内容变化触发 stale。

### 前置条件

- v1 fixture 无 `workflow_schema` 且含现有 DP-1..DP-4 records。
- v2 fixture 含 review-ready PRD/TSD/TVD/TED、Policy bundle 和固定 clock。

### 测试步骤

1. 读取 v1 record 并查询每个 DP 的名称/输入。
2. 在 v2 中尝试越过 DP-1、缺少 TVD 通过 DP-2、缺少 TED 通过 DP-3。
3. 完整批准 v2 三个 DP。
4. 分别修改 required Policy、TSD、TVD、TED gate 和 advisory Skill。

### 断言

- v1 缺省解析为 governed-v1，DP-2 仍是 TSD，DP-3 仍是 TVD，DP-4 仍是 TED。
- v2 顺序和 review-ready 前置条件生效。
- required Policy/TSD/TVD 变化使 DP-2 stale；TED/gate 变化使 DP-3 stale。
- advisory Skill 变化不改变 approved bundle hash。

### 测试数据

- 主要数据：v1/v2 decision stores、artifact bodies、required/recommended Policy。
- 覆盖条件：顺序阻断、批准、内容 stale、非语义字段变化。
- 数据隔离：临时状态文件。

### 证据目标

- VED 记录 catalog 解析、bundle hash 和 stale reason。

## Policy 与 Skill 解析（TC-006 / REQ-006）

### 测试目标

验证 resolver 根据项目、路径、PRD risk 和显式 Skill 选择 Policy/Skill，并阻止不可复现 required 来源。

### 前置条件

- 临时 `coding-plugins.policies.yaml` 含 TypeScript、Flutter、security profiles。
- 同时准备 repo-relative、versioned-plugin、personal absolute 和冲突 Policy 数据。

### 测试步骤

1. 对 TypeScript CLI 文件、Flutter 文件和 security risk 分别解析。
2. 显式加入 `flutter-dart-development-standards` personal Skill。
3. 删除 required repository source；再创建两个互斥 required Policies。
4. 只修改 recommended Policy/Skill 并重新计算 hash。

### 断言

- appliesWhen 只选择匹配 Policy；Skill binding 指向明确 Policy IDs。
- personal absolute Skill 为 `portable=false`/advisory，不能满足 required Policy。
- 缺失来源和 required 冲突产生阻断 diagnostics。
- required bundle hash 稳定；recommended/informative 变化不改变该 hash。

### 测试数据

- 主要数据：三类 profile、四类来源/冲突 fixture。
- 覆盖条件：匹配、非匹配、不可复现、冲突、hash 排除项。
- 数据隔离：临时 registry 与 mock plugin catalog。

### 证据目标

- VED 记录 resolved bundle 摘要，不记录个人绝对路径。

## 技术批准包审计（TC-007 / REQ-007）

### 测试目标

验证 v2 DP-2 联合审计 TSD、TVD、resolved Policies、required Skills 与 waiver。

### 前置条件

- review-ready TSD/TVD fixture 含/缺 Policy mapping、TC-POL、Skill plan 和 waiver。

### 测试步骤

1. 分别移除 required Policy 的 TSD design response、TVD test coverage、portable Skill version。
2. 添加未批准 required waiver。
3. 构造完整 bundle 并调用 `auditTechnicalBundle` 与 DP-2 approve。

### 断言

- 任一缺口返回具体 Policy ID 和 remediation，DP-2 不通过。
- 未批准 waiver 阻断；approved waiver 纳入 bundle hash。
- 完整 bundle audit 通过后，TSD/TVD 同步进入 approved。

### 测试数据

- 主要数据：POL-ARCH-001、POL-TDD-001、POL-DOC-001 的完整/缺口映射。
- 覆盖条件：每类缺口、waiver、成功批准。
- 数据隔离：临时文档和 decision store。

### 证据目标

- VED 记录每个阻断码与完整 bundle 的批准摘要。

## Policy 全链覆盖（TC-008 / REQ-008）

### 测试目标

验证 required Policy 从 TSD 到 TVD、TED、workflow brief、VED 和 completion audit 不丢失。

### 前置条件

- 完整链 fixture 含两个 TED tasks，各绑定不同 Policy/Skill；另有缺少某一节点的变体。

### 测试步骤

1. 构建 Policy coverage graph。
2. 分别删除 Test、Task、Evidence 节点并审计。
3. 为 TASK-001/TASK-002 生成 workflow brief。

### 断言

- 完整链每个 required Policy 有 Design、Test、Task、Evidence 节点。
- 缺失任一节点返回 `POLICY_COVERAGE_MISSING` 并阻断 formal completion。
- TASK-001 brief 只返回其 Policy/Skill，TASK-002 同理；无关 Skill 不进入 must-read。

### 测试数据

- 主要数据：双 task、双 Policy、相关/无关 Skills。
- 覆盖条件：完整、四类缺口、task scoped extraction。
- 数据隔离：临时正式链。

### 证据目标

- VED 记录 coverage matrix 和两个 task brief 摘要。

## Evidence eligibility 与完成态（TC-009 / REQ-009）

### 测试目标

验证 evidence 内容有效与 formal eligibility 分离，并让已完成链进入 `complete`。

### 前置条件

- tracked、local、ignored 三种 VED fixture；完整/缺 task、测试失败、scope drift、hash stale、DP stale 变体。

### 测试步骤

1. 对三种 artifact mode 运行 evidence validator。
2. 对各 blocker 运行 completion audit。
3. 对全部 tasks/tests/policies/scope/hash/DP 通过的 fixture 运行 audit。

### 断言

- local/ignored 内容可通过结构校验，但只 `validFor=[local-review]` 且 `formalCompletionAllowed=false`。
- 每类 blocker 对应稳定 code，workflow 为 blocked。
- 完整 fixture 的 implementation/verification/workflow 为 complete/passed/complete，workflow state 不再停在 ready-for-execution。
- commit 和 publish 保持独立维度。

### 测试数据

- 主要数据：三种 artifact mode 和六类 completion condition。
- 覆盖条件：内容有效但资格不足、各阻断、完全成功。
- 数据隔离：临时 gitignore/fixture，不调用真实 Git。

### 证据目标

- VED 分别记录 local eligibility 与 formal completion payload。

## 单一 task facade（TC-010 / REQ-010）

### 测试目标

验证一次 `task status` 聚合 route/state/DP/guard/brief/scope/completion，并使用结构化 next command。

### 前置条件

- CLI e2e fixture 覆盖 Inspect、Standard active change、Governed DP pending、completion blocked。
- 业务仓库 fixture 不包含 `bin/coding-plugins.js`。

### 测试步骤

1. 对每个 fixture 执行 `task status --contract-version 2 --json`。
2. 检查 next command 的 name/args，并在注入的 CLI reference 上执行。
3. 调用旧 `start`、`workflow-state` 等兼容命令。

### 断言

- 单次 status 包含唯一下一步、blockers、当前 task context 和 completion summary。
- next command 不包含业务仓库 `node ./bin/coding-plugins.js` fallback。
- 旧命令转发或返回可执行迁移提示，exit code 与 diagnostics severity 对齐。

### 测试数据

- 主要数据：四种运行时 fixture、无本地 bin 的业务仓库路径。
- 覆盖条件：正常、阻断、兼容入口。
- 数据隔离：CLI 子进程仅访问临时根目录。

### 证据目标

- VED 记录 JSON contract、next args 和旧命令迁移输出。

## v1 兼容迁移（TC-011 / MIG-001）

### 测试目标

验证现有正式 feature fixtures、命令、decision store 和 JSON 消费方不会被静默升级。

### 前置条件

- 复用现有 productization/formal fixtures，并复制一份无 schema 的旧链。

### 测试步骤

1. 运行现有 compatibility tests 和旧 CLI snapshots。
2. 对同一旧链分别请求默认、contract v1、contract v2。
3. 尝试把 local evidence 作为迁移输入。

### 断言

- 默认仍为 v1；显式 v1 与迁移前关键字段一致。
- v2 请求可读取旧链并带 catalog/compatibility diagnostics。
- local evidence 保持 local，不生成 formal record。
- 旧 DP records 不增加 v2 bundle hash，也不改变批准含义。

### 测试数据

- 主要数据：现有 fixtures、旧 decision JSON、local VED。
- 覆盖条件：默认、显式版本、不可升级证据。
- 数据隔离：复制 fixture，不改仓库基线。

### 证据目标

- VED 记录 compatibility test 汇总和版本响应差异。

## 稳定 reason code 与修复动作（TC-012 / OBS-001）

### 测试目标

验证相同阻断在 library、JSON 和 text 输出中共享 code、severity、message 语义和 remediation。

### 前置条件

- 为 unknown scope、active ambiguity、scope expanded、decision stale、Policy non-portable、coverage missing、evidence not formal、completion blocked 各准备 fixture。

### 测试步骤

1. 调用 library API 获取 diagnostics。
2. 对相同 fixture 执行 CLI JSON 与 text 输出。
3. 重复执行并比较 code 顺序。

### 断言

- 每个 blocker 至少含一个注册 code 和可执行 remediation。
- text 与 JSON 不改变 severity/含义；text 可以本地化 message，但 code 保持一致。
- diagnostics 按稳定优先级排序，相同输入输出确定。

### 测试数据

- 主要数据：八类 blocker fixture。
- 覆盖条件：warning/error、单/多 diagnostics。
- 数据隔离：纯对象与临时 CLI fixture。

### 证据目标

- VED 记录 code registry 覆盖率和 text/JSON 等价断言。

## Library/CLI 分层（TC-101 / TC-POL-ARCH-001 / POL-ARCH-001）

### 测试目标

验证核心决策留在 `src/lib/workflow`，CLI 只负责参数解析、调用和渲染。

### 前置条件

- `src-architecture.test.mjs` 可扫描 import graph 和禁止模式。

### 测试步骤

1. 扫描新增 workflow modules 和 CLI modules。
2. 检查 CLI 是否重新实现分类、hash、Policy 或 completion 逻辑。
3. 运行 architecture test。

### 断言

- 核心逻辑全部由 library 导出；CLI 无重复 decision branches。
- architecture test 通过。

### 测试数据

- 主要数据：源码 import graph 和受限 pattern。
- 覆盖条件：正确委托与人为插入重复逻辑的 RED fixture。
- 数据隔离：source scan 只读。

### 证据目标

- VED Policy Evidence 记录 architecture command 和结果。

## 兼容策略门禁（TC-102 / TC-POL-COMPAT-001 / POL-COMPAT-001）

### 测试目标

验证任何 v2 行为提交都同时运行 v1 fixture 和 contract tests。

### 前置条件

- compatibility suite 聚合 TC-005、TC-010、TC-011。

### 测试步骤

1. 运行 `productization-cli.test.mjs`、`workflow-state.test.mjs` 和 v2 compatibility targets。
2. 检查 v1 DP catalog snapshot 与 JSON schema。

### 断言

- v1 fixtures 全部通过，v2 opt-in tests 通过。
- 任一历史语义变化阻断阶段验证。

### 测试数据

- 主要数据：仓库正式 fixture 与旧 decision store。
- 覆盖条件：旧/新双版本。
- 数据隔离：临时复制。

### 证据目标

- VED Policy Evidence 分别记录 v1 与 v2 suite。

## TDD 证据完整性（TC-103 / TC-POL-TDD-001 / POL-TDD-001）

### 测试目标

验证每个源码实现 task 都有可验证 RED、GREEN、REFACTOR 记录或事前批准例外。

### 前置条件

- TED/未来 VED fixture 含 task-to-test mapping。

### 测试步骤

1. 对缺 RED、缺 GREEN、命令失败、仅叙述性 evidence 和完整 evidence 运行 TDD validator。
2. 检查 exception 是否在实现前批准且含替代验证。

### 断言

- 不完整或事后补写 evidence 阻断 formal completion。
- 完整记录与合法例外可追踪到 Test ID/Task ID。

### 测试数据

- 主要数据：五种 evidence fixture。
- 覆盖条件：RED/GREEN/REFACTOR/exception。
- 数据隔离：临时 VED。

### 证据目标

- VED Policy Evidence 记录 validator 输出；不自引用为实际实现证据。

## 新鲜验证证据（TC-104 / TC-POL-VERIFY-001 / POL-VERIFY-001）

### 测试目标

验证 completion 只接受当前 source hash 对应的最近验证，不接受历史口头结论。

### 前置条件

- completion fixture 含 matching/stale source hash、成功/失败 exit code、缺 timestamp。

### 测试步骤

1. 对四种验证记录执行 completion audit。
2. 在验证后修改 source hash 并再次审计。

### 断言

- 只有 matching hash、成功 exit code、完整 command/timestamp 的证据有效。
- 源码变化后原验证立即 stale；completion 返回 remediation。

### 测试数据

- 主要数据：固定 source/command hash 与 validation records。
- 覆盖条件：新鲜、失败、缺失、变更后 stale。
- 数据隔离：纯 fixture。

### 证据目标

- VED Policy Evidence 记录 completion audit，不复用旧命令输出。

## 正式文档一致性（TC-105 / TC-POL-DOC-001 / POL-DOC-001）

### 测试目标

验证 PRD/TSD/TVD/TED/VED 的 frontmatter、related_docs、INDEX、source hash 和 artifact mode 一致。

### 前置条件

- 完整链、缺 link、stale date、wrong doc_id、ignored artifact、stale source hash fixtures。

### 测试步骤

1. 运行 strict document validators 和 preflight。
2. 逐一注入 metadata 与 artifact mode 错误。

### 断言

- 完整链通过；每种错误产生定位到文件/字段的诊断。
- ignored chain 不获得 formal eligibility。
- INDEX 由生成器更新，不依赖 README 手工表格。

### 测试数据

- 主要数据：六种文档 fixture。
- 覆盖条件：metadata、sync、hash、artifact mode。
- 数据隔离：临时 docs root。

### 证据目标

- VED Policy Evidence 记录 strict validators、INDEX diff 和 preflight。

## 边界和错误用例

| Spec ID | 测试用例 ID | 条件 | 期望结果 | 测试类型 |
| --- | --- | --- | --- | --- |
| REQ-001 | TC-ERR-001 | 意图同时包含分析与执行但无明确主动作 | flow 不猜测，返回 uncertain 与补充上下文动作 | behavior |
| REQ-002 | TC-ERR-002 | allowed 与 blocked action 计算冲突 | `ROUTE_CONFLICT`，不输出可执行 next command | contract |
| REQ-003 | TC-ERR-003 | runtime cache JSON 损坏 | 隔离缓存并从正式文档重建；无唯一候选则阻断 | state |
| REQ-005 | TC-ERR-004 | v2 record 缺 catalogVersion | 不按当前版本猜测，返回 schema/catalog 诊断 | contract |
| REQ-006 | TC-ERR-005 | repository Policy path 逃逸 root | `POLICY_SOURCE_NON_PORTABLE` 或 invalid source | security/config |
| REQ-007 | TC-ERR-006 | TSD/TVD status 非 review-ready | DP-2 阻断并指出目标状态 | state |
| REQ-008 | TC-ERR-007 | TED task 引用未知 Policy ID | coverage graph 阻断，不忽略未知引用 | architecture |
| REQ-009 | TC-ERR-008 | VED 内容通过但目录被 gitignore | 仅 local-review，formal completion blocked | behavior |
| REQ-010 | TC-ERR-009 | 注入的 CLI reference 不可执行 | 返回 CLI_REFERENCE_UNAVAILABLE，不回退业务仓库 bin | CLI |
| MIG-001 | TC-ERR-010 | v1 无法无损投影某 v2 状态 | 返回 COMPAT_PROJECTION_UNAVAILABLE 与迁移动作 | compatibility |

## 通过 / 失败标准

- 通过标准：TC-001 至 TC-012、TC-101 至 TC-105 全部自动化断言通过；PRD 的全部 MUST 规格至少对应一个通过用例；required Policy 均有 `TC-POL-*`、TED task 和 VED Policy Evidence 目标；现有 v1 compatibility suite 无回归。
- 阻塞失败：任何 route invariant、v1 语义、DP 顺序/hash、required Policy portable/coverage、formal evidence eligibility、scope drift、source hash 或 completion 断言失败，都停止执行并回到对应 PRD/TSD/TVD。
- 非阻塞风险：CLI text 文案措辞和 recommended/informative Policy 提示顺序可以在不改变 code/severity/remediation 的前提下调整；差异记录为 review note。
- 人工验收：最终只需确认三条用户链路名称、阻断文案和迁移提示可理解；人工意见不能覆盖失败的 contract test。

## 自动化状态

- 自动化覆盖：TC-001 至 TC-012、TC-101 至 TC-105 全部计划自动化；目标文件为 TSD 测试策略中列出的 `tests/ts/workflow-runtime-*.test.mjs`，Policy cases 合并到其对应领域测试和现有 architecture/productization suites。
- 人工验收：仅在 VED 最终验证中记录 CLI text 可读性复核，不存在只能依靠人工判断的 MUST 行为。
- 暂不覆盖：长期 specs/delta/archive、默认 v2 major release 切换、真实外部插件安装、跨设备 active state、发布平台状态；这些属于 PRD 非目标或后续 release change。
- RED/GREEN 规则：TED 为每个实现 task 指定单文件 `node --test` RED/GREEN 命令；阶段完成运行受影响 suite，最终运行 `npm test`、strict document validators 和 `npm run preflight`。

## 不需要测试用例的规格

- 无：REQ-001 至 REQ-010、MIG-001、OBS-001 均有独立测试用例；全部 MUST 规格已覆盖。

## 执行提示

- 实现阶段使用 `test-driven-development`，源码改动前先观察对应 test target 失败。
- 实际 RED/GREEN/REFACTOR 输出写入 VED，不写入本文档。
- TED 每个 task 同时绑定 Spec IDs、Test IDs、Policy IDs、required Skills 和 verification command。
- 任一 PRD/TSD/Policy required 内容变化都触发回看本 TVD；测试覆盖变化后重新申请当前链对应批准。
