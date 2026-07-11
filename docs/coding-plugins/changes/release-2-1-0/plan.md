---
title: 发布 2.1.0 计划
change_id: release-2-1-0
updated: 2026-07-11
---

# 发布 2.1.0 计划

## 设计

先在功能分支准备唯一发布提交，确保版本、说明和测试同步；随后将本地 `main` 快进到该提交并推送。只有 `main` 持续集成成功后才创建带说明的标签，最后验证发布工作流和 `GitHub Release`。

## 测试策略

- VC-001：版本同步测试覆盖六个版本清单、package lock 和版本配置。
- VC-002：现有文档与中文契约测试覆盖发布说明和用户入口。
- VC-003：全量 `npm test`、YAML/JSON 解析和 diff 检查。
- VC-004：Git SHA、GitHub Actions 持续集成状态和远端 `main` 检查。
- VC-005：远端标签、发布工作流和 `GitHub Release` 检查。

## 任务

1. 运行现有 2.0 migration 测试基线，并将固定当前版本断言重构为“2.0 迁移历史 + 当前版本同步”。
2. 运行期望 `2.1.0` 的可复现检查并观察 RED。
3. 更新所有版本元数据、README/GEMINI 标题和 2.1.0 Release Notes。
4. 运行聚焦与全量验证，创建发布提交。
5. 快进本地 `main`，再次验证并推送远端。
6. 验证 `main` 持续集成，创建并推送带说明的标签 `v2.1.0`。
7. 验证发布工作流、远端标签和 `GitHub Release`，更新证据。

## 回滚

发布提交推送前可停止并保留功能分支。`main` 推送后不重写远端历史；若标签尚未推送，可用后续修复提交。标签与 Release 推送后只通过新版本修复，不删除公开发布记录。

## 验证

- `node --test tests/ts/workflow-only-migration.test.mjs tests/ts/release-workflow.test.mjs`
- `npm test`
- Skill frontmatter YAML 与 manifest JSON 解析
- `git diff --check`
- `gh run list` / `gh run view`
- `git ls-remote --tags origin refs/tags/v2.1.0`
- `gh release view v2.1.0`
