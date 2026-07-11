---
title: Coding Plugins Workflow Runtime
status: draft
feature: workflow-runtime
updated: 2026-07-11
tags:
  - workflow
  - routing
  - decision-points
  - engineering-policy
  - skills
---

# Coding Plugins Workflow Runtime

本 feature 收敛 Coding Plugins 的用户可见工作流、决策点、活动变更状态、证据完成语义，以及工程 Policy 与自定义 Skill 的绑定方式。

`workflow-simplification` 文档链已实现并完成验证：历史链按 governed-v1 的 DP-1 至 DP-4、DP-6、DP-7 保持兼容；新建 Governed Change 通过 `task approve` 使用 DP-1 范围、DP-2 技术、DP-3 执行三批准点，并通过 `task complete` 统一完成审计。Active/Standard Change、scope expansion 和仓库 `integrationPolicy` 已接入生产 facade；当前仓库使用 main-only 交付策略。
