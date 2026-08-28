---
title: 发布 2.2.0
change_id: release-2-2-0
profile: governed
phase: complete
risk: medium
current_task: complete
completion_status: complete
updated: 2026-08-28
---

# 发布 2.2.0

## 意图

将已经合并到本地 `main` 的工作流校准和模块文档交付能力发布为 `2.2.0`，同步远端 `main`、GitHub tag、GitHub Release 与本机 Codex 插件安装。

## 风险

这是包含远端推送与公开版本发布的操作，不能仅靠本地回退撤销。主要风险是版本元数据不一致、远端 `main` 漂移、标签指向错误提交、Actions 发布失败，或本地 marketplace 与插件缓存没有刷新到同一 revision。

## 范围

- 范围内：同步 `2.2.0` 版本元数据与发布说明；创建发布提交；推送 `main`；验证持续集成；创建并推送 annotated `v2.2.0`；验证 GitHub Release；刷新本机 `coding-plugins` marketplace 与已安装插件；写回发布证据。
- 范围外：`npm publish`、新增产品行为、删除分支、改写远端历史、删除旧插件缓存或旧发布记录。
- 预计影响的文件或系统：版本清单、`package-lock.json`、`README.md`、`GEMINI.md`、`RELEASE-NOTES.md`、本发布 Capsule、GitHub `main`/tag/Actions/Release、本机 Codex marketplace 与插件缓存。

## 假设与待决事项

- `Assumption`：远端 `origin/main` 是本地 `main` 的祖先，本地仅线性领先 2 个已验证提交；已通过 fetch、rev-list 与日志确认。
- `Assumption`：远端尚无 `v2.2.0`；已通过 `git ls-remote --tags` 确认。
- `Decision Point`：版本使用 `2.2.0`。
  - 决定来源：未发布变更是向后兼容的 `feat(workflow)`，按仓库既有 SemVer 规则提升次版本。
  - 阻止执行：否。
- `Decision Point`：发布目标是 GitHub tag 与 GitHub Release，不执行 `npm publish`。
  - 决定来源：`package.json` 为私有包，release workflow 只创建 GitHub Release。
  - 阻止执行：否。
- `Decision Point`：本地同步使用 Codex CLI 的 marketplace refresh，不直接手工改写缓存。
  - 决定来源：`plugin marketplace upgrade coding-plugins` 会刷新 marketplace 并自动协调已安装插件；本次执行后已直接生成 `2.2.0` 缓存，不需要重复运行 `plugin add`。
  - 阻止执行：否。

## 可验证契约

- [x] VC-001
  - 结果：所有当前版本清单、package 与 lock 元数据一致为 `2.2.0`。
  - 边界：不恢复 npm runtime 或 npm publish 配置。
  - 验证：版本同步 Node 检查、现有 metadata 契约测试和 JSON 解析。
- [x] VC-002
  - 结果：发布说明和用户入口准确描述本次风险校准、证据模式、checkout、验证溯源、Capsule 压缩和模块文档交付能力。
  - 边界：保留旧版本发布记录，不改写历史发布内容。
  - 验证：文档源码审计与差异检查。
- [x] VC-003
  - 结果：发布提交通过仓库完整测试和发布 workflow 契约。
  - 边界：只声明本仓库工作流插件的静态验证结果。
  - 验证：focused Node tests、`npm test`、Skill YAML、manifest JSON 和 `git diff --check`。
- [x] VC-004
  - 结果：远端 `main` 到达发布提交，并且对应 GitHub CI 成功。
  - 边界：不重写远端历史，不删除分支。
  - 验证：本地/远端 SHA 与 GitHub Actions API。
- [x] VC-005
  - 结果：annotated `v2.2.0` 指向发布提交，release workflow 成功且公开 GitHub Release 可见。
  - 边界：不执行 `npm publish`，不删除或覆盖既有标签。
  - 验证：远端 tag object/peeled SHA、GitHub Actions API 与 Releases API。
- [x] VC-006
  - 结果：本机已安装的 `coding-plugins@coding-plugins` 显示 `2.2.0`，缓存 revision 与已发布代码一致。
  - 边界：不手工伪造安装状态；旧版本可从公开 tag 恢复，缓存保留策略由官方 Codex CLI 决定。
  - 验证：Codex CLI JSON 列表、cache manifest、安装元数据与关键 Skill 内容检查。

## 文档影响

- 分类：`update-existing`。
- 目标：`README.md`、`GEMINI.md`、`RELEASE-NOTES.md` 和本发布 Capsule。
- 原因：发布会改变当前公开版本与可交付能力说明；现有模块文档已在前置变更中补充，本次不再重复创建。
- 验证：版本标题、release notes、Capsule 状态和最终 Git diff。

## 产物

- `change.md`：发布状态、范围、契约和最终完成结论。
- `plan.md`：发布顺序、停止条件与回滚边界。
- `evidence.md`：RED/GREEN、测试、远端发布与本地安装证据。

## 批准记录

- 2026-08-28 范围/计划：用户明确要求“进行push发布，本地同步进行更新”；发布范围已收敛为 `2.2.0` GitHub Release 与本机 Codex 插件同步。
- 2026-08-28 执行：同一明确指令授权 push、发布与本地同步；不包含 npm publish、历史改写或分支删除。

## 当前任务

已完成。`main`、CI、annotated tag、release workflow、GitHub Release 和本机 Codex 插件同步均已验证。

## 决策

- 使用 `2.2.0`，因为新增能力向后兼容且属于 feature release。
- 先推送 `main` 并验证 CI，再创建 annotated tag，避免给未通过主线验证的提交打公开版本。
- 远端发布成功后再通过 Codex CLI 刷新 marketplace 与安装缓存。
- 本地 marketplace upgrade 已自动更新启用中的插件，因此不重复执行 `plugin add`。

## 完成情况

- 已实现：`2.2.0` 元数据、发布说明、发布提交、远端 `main`、annotated tag、GitHub Release 与本机 Codex 插件同步。
- 已验证：本地全量 47/47；远端 main CI run `33157346532` 和 release run `33157377786` 成功；Release `378364309` 已公开；本机插件版本、启用状态、缓存 revision 与关键 Skill 内容均匹配发布提交 `5ee5952`。
- 延后项：无。
- 剩余风险：本机 `gh` token 无效，远端验证使用公开 GitHub API；tag 未签名且仓库没有 signed tag 强制要求。官方 marketplace upgrade 回收了旧 `2.1.0` 缓存，但旧版本仍可从公开 tag 恢复。已运行任务不会热加载新 Skill，后续新任务或重载后使用 `2.2.0`。
