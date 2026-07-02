# Formal Feature Chain Case Index

本索引用于说明 `formal-feature-chain` fixture 中每个案例的来源、优化目标和覆盖风险。案例不是正式产品文档；它们用于把真实维护问题沉淀成可回归验证的插件质量要求。

## routing-fixture

- case_id: CASE-ROUTING-001
- source_type: workflow_regression
- source_reference: Codex session routing and login state document chain
- optimization_target: 验证行为类需求从 PRD 到 TID、TCD、IPD、TED 的闭环。
- covered_risks:
  - PRD 写了登录分流需求，但下游实现点没有承接。
  - 测试用例只描述操作，没有绑定需求编号。
  - TED 证据无法说明最终验证覆盖了哪个需求。

## creek-wrapper-fixture

- case_id: CASE-CREEK-001
- source_type: downstream_pattern
- source_reference: evobeing_creek_wrapper upload status contract
- optimization_target: 验证 SDK wrapper API 契约、状态枚举和证据归档的闭环。
- covered_risks:
  - API 契约只停留在 PRD 正文，TID 没有实现点。
  - TCD 未覆盖状态枚举和边界输入。
  - TED 无法证明 contract 验证覆盖了必须需求。

## plugin-cache-fixture

- case_id: CASE-CACHE-001
- source_type: release_regression
- source_reference: coding-plugins install cache and repository implementation drift
- optimization_target: 验证插件发布、安装缓存刷新和仓库实现一致性的文档闭环。
- covered_risks:
  - 仓库实现已更新，但安装缓存仍使用旧链路。
  - IPD 只复述技术方案，没有形成可执行任务。
  - TED 没有记录缓存刷新验证结果。

## metadata-sync-fixture

- case_id: CASE-METADATA-001
- source_type: maintenance_regression
- source_reference: document metadata sync and related document freshness
- optimization_target: 验证 metadata 关系、同步更新和文档可读性维护闭环。
- covered_risks:
  - 某个文档更新后，相关文档没有同步更新。
  - related_* 关系存在，但正文无法说明阅读重点。
  - README 和 INDEX 无法帮助维护者理解文档链路。
