---
title: 发布 2.1.0
change_id: release-2-1-0
profile: governed
phase: complete
risk: medium
current_task: complete
completion_status: complete
updated: 2026-07-11
---

# 发布 2.1.0

## 意图

将工作流治理加固安全合并到 `main`，发布标签 `v2.1.0`，并确认 `GitHub Actions` 与 `GitHub Release` 完成。

## 风险

这是不可仅靠本地回退撤销的远端发布操作。主要风险是版本文件不一致、标签指向错误提交、远端 `main` 漂移、发布工作流失败或 `GitHub Release` 不可见。

## 范围

- 范围内：同步版本元数据、补充 2.1.0 发布说明、修复版本测试的未来发布兼容性、发布提交、快进合并、推送 `main` 与 `v2.1.0`、验证持续集成和 `GitHub Release`。
- 范围外：`npm publish`、修改 2.1.0 的产品行为、删除功能分支、发布其他版本。
- 预计影响的文件或系统：版本清单、`package-lock.json`、`README.md`、`GEMINI.md`、`RELEASE-NOTES.md`、版本契约测试、GitHub `main`、标签与 Release。

## 假设与待决事项

- `Assumption`：`origin/main` 仍指向 `9423c0a`，功能分支仅领先治理加固提交；已通过 `git fetch` 和分支差异检查确认。
- `Assumption`：标签 `v2.1.0` 尚不存在；已通过本地与远端标签刷新确认。
- `Decision Point`：发布版本选择 `2.1.0`。
  - 决定来源：未发布提交为向后兼容的 `feat(workflow)`，按 `SemVer` 使用次版本。
  - 阻止执行：否。
- `Decision Point`：发布目标仅为 GitHub 标签和 Release，不执行 `npm publish`。
  - 决定来源：`package.json` 为私有包，`.github/workflows/release.yml` 只创建 `GitHub Release`。
  - 阻止执行：否。
- `Assumption`：GitHub 写权限与 Actions 可用；在推送前通过认证检查确认。

## 可验证契约

- [x] VC-001
  - 结果：所有版本清单、package 与 lock 元数据一致为 `2.1.0`。
  - 边界：不恢复 npm runtime 发布配置。
  - 验证：版本同步契约测试和 `JSON` 解析。
- [x] VC-002
  - 结果：发布说明和用户入口准确描述 2.1.0 的治理加固内容。
  - 边界：保留 2.0.0 迁移历史，不改写旧版本记录。
  - 验证：文档源码扫描、中文契约和差异审计。
- [x] VC-003
  - 结果：发布提交在本地完整测试与发布工作流契约下通过。
  - 边界：只声明本仓库静态工作流包验证结果。
  - 验证：`npm test`、Skill YAML、清单 JSON、`git diff --check`。
- [x] VC-004
  - 结果：`main` 快进到发布提交并成功推送远端。
  - 边界：不创建合并提交，不删除功能分支。
  - 验证：本地和 `origin/main` SHA 一致，GitHub CI 成功。
- [x] VC-005
  - 结果：带说明的标签 `v2.1.0` 指向发布提交，发布工作流成功且 `GitHub Release` 可见。
  - 边界：不执行 `npm publish`。
  - 验证：远端标签 SHA、GitHub Actions 运行结果与 `gh release view v2.1.0`。

## 产物

- `change.md`：整个发布的唯一状态源。
- `plan.md`：发布步骤与回滚边界。
- `evidence.md`：本地与远端发布证据。

## 批准记录

- 2026-07-11 范围/计划：用户明确要求“合并到main中，并发布”。
- 2026-07-11 执行：同一指令明确授权合并、推送和发布外部操作。

## 当前任务

已完成。`main`、CI、tag、release workflow 和 GitHub Release 均已验证。

## 决策

- 使用 `2.1.0`，因为新增的是向后兼容的公共工作流能力。
- 使用快进合并，保持线性历史。
- 先推送 `main` 并验证持续集成，再创建和推送发布标签。

## 完成情况

- 已实现：发布 Capsule、2.1.0 版本元数据、发布说明、未来版本兼容测试、`main` 推送、tag 与 GitHub Release。
- 已验证：版本同步、focused 4/4、全量 31/31、`main` CI、release workflow、远端 annotated tag 和公开 Release 全部通过。
- 延后项：无。
- 剩余风险：本机 `gh` token 失效但未影响 Git push 或 Actions 发布；tag 未签名且仓库无 signed tag 强制要求。
