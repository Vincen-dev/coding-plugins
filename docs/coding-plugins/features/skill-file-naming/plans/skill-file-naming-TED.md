---
title: Skill File Naming TED
status: approved
feature: skill-file-naming
doc_id: skill-file-naming
created: 2026-07-04
updated: 2026-07-04
source_hash: sha256:cf188ea45d5c1991c40af01646f39b6455c5bd3970976322a855892cf7de5691
related_docs: []
external_references: []
---
# Skill File Naming TED

## 执行锁定区

TASK-001 实现并维护 REQ-001 的命名契约。执行时必须先让命名测试暴露违规路径，再进行重命名和引用更新。

## 执行简报

REQ-001 的目标是降低 skill 和测试资源路径漂移，保持可搜索、可维护。

## 任务总览

| Task | Scope |
| --- | --- |
| TASK-001 | 规范文件命名并用 `tests/ts/file-naming.test.mjs` 防回归。 |
