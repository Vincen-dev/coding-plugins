---
title: 校准 Coding Plugins Skill 工作流
change_id: workflow-skill-calibration
profile: governed
phase: complete
risk: high
current_task: 已完成当前工作流校准切片
completion_status: complete
updated: 2026-08-28
---

# 校准 `Coding Plugins Skill` 工作流

## 意图

保留测试先行、可验证契约、系统化执行和证据先于声明，同时修正真实开发中暴露的风险分级膨胀、假 `RED`、`dirty checkout` 误判、验证对象不明确、`Capsule` 膨胀和未授权 `Git` 收尾。

## 风险

本变更采用 `Governed Change`，因为它修改插件公开 `Skill` 行为和跨平台工作流契约。若需要重新引入 `CLI`、隐藏状态、旧五文档链路或改变插件安装方式，则超出本变更范围并重新确认。

## 范围

- 范围内：风险 `Profile`、诊断授权边界、测试证据类型、`checkout` 分类、验证 `provenance`、`Capsule` 压缩、计划/收尾/提交/评审/并行交接规则及对应测试。
- 范围外：插件发布、版本号、`tag`、`push`、安装缓存刷新、`CLI` 或运行时状态服务。
- 预计影响：`skills/**`、评审与子代理提示、`tests/ts/**`、本 `Capsule`。

## 假设与待决事项

- `Assumption`：`a2947ac` 的“`worktree` 必须显式授权”属于已接受基础，本变更保留并细化，不回退。
- `Assumption`：插件继续保持 `workflow-only`，测试可验证确定性契约和跨 `Skill` 一致性，但不把正则匹配表述为真实 `Agent` 行为证明。
- `Decision Point`：是否在本次发布或刷新安装缓存。
  - 决定：不执行；当前仅优化源码并验证。
  - 决定来源：用户只要求开始优化，未要求 `commit`、`push` 或 `release`。
  - 阻止执行：否。

## 可验证契约

- [x] VC-CAL-001
  - 结果：`Profile` 根据可逆性、外部兼容面、数据/安全副作用和验证难度校准；普通用户可见行为不自动进入 `Governed`，普通认证界面不自动进入 `Critical`。
  - 边界：公共 API、schema、迁移、release、安全和不可逆外部影响仍保留高风险门禁。
  - 验证：routing contract tests 覆盖 Inspect/Quick/Standard/Governed/Critical 的正反场景。
- [x] VC-CAL-002
  - 结果：`TDD` 区分行为 `RED`、重构特征基线、静态契约检查和外部验证门禁，且禁止删除来源不明或用户拥有的实现。
  - 边界：行为变更仍必须先观察能证明缺失行为的 RED。
  - 验证：TDD contract tests 检查四类证据与 user-owned diff 保护。
- [x] VC-CAL-003
  - 结果：`checkout` 区分干净、已知无关静态修改、重叠/未知修改和活跃写入者，并识别代码生成、原生构建等共享资源。
  - 边界：worktree 仍需用户明确授权；重叠或未知所有权仍阻止写入。
  - 验证：governance contract tests 覆盖四态分类和共享资源。
- [x] VC-CAL-004
  - 结果：完成声明绑定仓库、分支、差异、入口、依赖、生成状态和产物等来源信息，已知基线和外部验收不会被本地聚焦测试掩盖。
  - 边界：不引入持久化运行时或隐藏状态。
  - 验证：verification contract tests 覆盖 provenance、baseline、external gate 与 freshness 定义。
- [x] VC-CAL-005
  - 结果：`Capsule` 完成后压缩重复过程信息；`change.md`、`plan.md`、`evidence.md` 不维护重复状态和大段重复内容。
  - 边界：保留最终决策、VC、关键 RED、最终验证和剩余风险。
  - 验证：Capsule contract tests 检查 compact/archival guidance。
- [x] VC-CAL-006
  - 结果：执行完成不会自动提交、合并、拉取、推送或清理；评审提示、并行触发和提交尾注规则保持一致且由用户或仓库授权决定。
  - 边界：显式用户请求仍可进入对应 Git 和 review 流程。
  - 验证：workflow consistency tests 覆盖 conditional finishing、findings-first、parallel shared resources 和 optional attribution。

## 产物

- `change.md`：唯一全局状态源。
- `plan.md`：实现与验证计划。
- `evidence.md`：RED/GREEN 和最终证据。

## 批准记录

- 2026-08-28 范围与计划批准：用户在查看完整 `Skill` 复盘、优先级优化项和建议的下一版主题后要求“开始进行优化”。
- 2026-08-28 执行批准：同一指令明确授权立即开始已展示范围内的优化；未授权提交、推送、发布或安装缓存刷新。
- 2026-08-28 集成授权：用户明确要求合并到本地 `main` 并继续直接在 `main` 开发；未要求 push、release 或缓存刷新。

## 当前任务

当前校准切片已完成，并纳入用户授权的本地 `main` 集成。

## 决策

- 在当前源码基础上继续，保留 `a2947ac`，使用 `codex/optimize-workflow-skills-v2` 分支。
- 不恢复旧版 `CLI` 或五文档链路；改进 `workflow-only Skill` 和测试。
- 静态契约测试只证明维护的不变量，不声称模拟了模型行为。

## 完成情况

- 已实现：六项 `VC-CAL-*` 均已落到所属 `Skill`、提示、文档和静态契约测试；完成状态仅覆盖本次源码校准切片。
- 已验证：变更前基线 `npm test` 32/32；最终 `npm test` 42/42；`git diff --check` 无错误。
- 延后项：push、发布、安装缓存刷新和跨模型 forward-testing。
- 剩余风险：真实 `Agent` 行为仍需要后续独立前向测试才能证明。
