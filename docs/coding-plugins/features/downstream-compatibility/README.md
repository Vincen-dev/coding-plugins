---
title: 下游项目兼容性和证据生命周期
status: approved
feature: downstream-compatibility
updated: 2026-07-01
tags:
  - validator
  - compatibility
  - evidence
  - migration
  - external-references
---
# 下游项目兼容性和证据生命周期

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | downstream-compatibility |

## 摘要

本 feature 修复 `coding-plugins` 在真实下游 Flutter/Dart 项目中暴露的兼容性问题：validator 误报 Dart 泛型和带作用域 Spec ID，旧文档缺少迁移路径，active evidence 与历史证据混杂，完成状态容易漂移，源码扫描测试缺少质量标注，跨仓库引用缺少稳定 metadata 边界。
