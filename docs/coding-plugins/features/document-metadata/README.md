---
title: 文档元数据规则和技能化
status: approved
feature: document-metadata
updated: 2026-07-01
tags:
  - metadata
  - chinese
  - plan
  - preflight
  - skill
  - template
---
# 文档元数据规则和技能化

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | document-metadata |

本 feature 维护 Coding Plugins 文档 metadata 的机器规则、中文展示、关联关系和读取入口。文档关系以 frontmatter 的 `related_*` 为准，代理读取文档时优先使用 `document-metadata` skill 确认 metadata，再进入正文。
