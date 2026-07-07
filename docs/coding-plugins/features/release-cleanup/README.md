---
title: 正式发布优化
status: draft
feature: release-cleanup
updated: 2026-07-07
tags:
  - release-cleanup
  - release
  - packaging
  - productization
---

# 正式发布优化

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | draft |
| Feature | release-cleanup |

## 总览

正式发布优化用于收紧 Coding Plugins 的发布包边界，确保用户安装后只看到运行所需内容、用户文档和必要 manifest，不暴露仓库开发文档、测试 fixture、待办文件或临时规划材料。

当前处于 PRD 草稿阶段，先固定 npm package / plugin artifact 的 allowlist、排除规则和安装洁净度验收口径。需求确认后再进入 TSD，设计具体的 package 配置、审计脚本和回归测试。
