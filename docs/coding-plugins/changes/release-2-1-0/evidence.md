---
title: 发布 2.1.0 证据
change_id: release-2-1-0
updated: 2026-07-11
---

# 发布 2.1.0 证据

## 测试驱动证据

- 契约来源：`change.md` 中的 VC-001 至 VC-005。
- 测试类型：版本配置、源码扫描、Git 与远端发布检查。
- RED 测试与命令：运行期望全部元数据为 `2.1.0` 的 Node 检查。
- RED 失败：`package.json: expected 2.1.0, got 2.0.0`，证明发布版本尚未准备。
- GREEN 变更与命令：同步六个版本清单、package lock、README/GEMINI 标题与发布说明；2.1.0 元数据检查通过，聚焦测试 4/4 通过。
- REFACTOR 命令：先运行旧迁移测试基线 4/4 通过，再把永久锁定 2.0.0 的断言重构为“保留 2.0.0 迁移历史并校验当前版本同步”；全量 `npm test` 31/31 通过。

## 最终验证

- 命令或检查：`npm test`、聚焦发布与迁移测试、版本同步 Node 检查、Skill YAML、清单 JSON、`git diff --check`、GitHub API 的分支、Actions、标签对象与 Release 检查。
- 结果：本地版本同步通过，聚焦测试 4/4、全量 31/31、差异检查通过；远端 `main` CI run `29155372774` 成功；release run `29155399313` 成功；annotated `v2.1.0` 解析到 `805352d`；Release `352527138` 已公开。
- 覆盖范围：本地发布提交、远端 `main`、标签、Actions 与 `GitHub Release`。

## 剩余风险

- 本机 `gh` token 已失效，因此远端验证改用公开 GitHub API；Git push、Actions token 和 Release 创建均实际成功。
- annotated tag 未签名；仓库当前没有 signed tag 强制要求，旧发布也沿用相同边界。
