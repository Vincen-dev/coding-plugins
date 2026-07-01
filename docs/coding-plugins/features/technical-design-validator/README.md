---
title: Technical Design Validator
status: approved
feature: technical-design-validator
updated: 2026-06-29
tags:
  - technical-design
  - validator
  - preflight
  - stale
  - traceability
---
# Technical Design Validator

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | technical-design-validator |

## 摘要

本 feature 将 technical design 质量检查沉淀为独立 validator。目标是把结构校验、Spec ID 覆盖、related 链路、泛化映射 warning 和 stale 检测集中到一个可单独运行、可由 preflight 复用的入口。
