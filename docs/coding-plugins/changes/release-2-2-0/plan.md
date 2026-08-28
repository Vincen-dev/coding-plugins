---
title: 发布 2.2.0 计划
change_id: release-2-2-0
updated: 2026-08-28
---

# 发布 2.2.0 计划

## 设计

在当前本地 `main` 直接准备唯一发布提交。完整本地验证通过后先推送 `main`，待对应 CI 成功再创建 annotated `v2.2.0` 并推送；发布 workflow 成功且 GitHub Release 可见后写回证据，最后通过 Codex CLI 刷新 marketplace 和已安装插件。

整个过程分成三个可独立停止的阶段。第一阶段只准备并验证本地版本，不产生远端影响；第二阶段依次验证主线与公开发布，任何一步失败都停止后续动作；第三阶段只在公开发布已确认后刷新本机安装，并通过版本号、提交修订和关键技能内容三方面交叉核对。这样既能避免未验证代码进入公开标签，也能避免本机缓存提前指向尚未正式发布的内容。

## 测试策略

- VC-001：先运行期望 `2.2.0` 的同步检查并观察 RED，再运行 metadata 契约与 JSON 解析。
- VC-002：审计 README/GEMINI 标题、Release Notes 新版本段落和最终差异。
- VC-003：运行 focused 发布测试、全量 `npm test`、Skill YAML、manifest JSON 和 `git diff --check`。
- VC-004：比较本地/远端 SHA，并从 GitHub Actions API 确认发布提交的 `main` CI 成功。
- VC-005：检查远端 annotated tag object 与 peeled commit，确认 release workflow 和公开 GitHub Release。
- VC-006：使用 `codex plugin marketplace upgrade coding-plugins` 刷新 marketplace；若已安装插件没有自动协调才运行 `plugin add`，最后读取 CLI JSON、cache manifest 与 revision。

## 任务

1. 建立期望 `2.2.0` 的 RED 版本同步证据。
2. 更新六个版本清单、package lock、README/GEMINI 标题与 2.2.0 Release Notes。
3. 运行 focused 与完整本地验证，创建 `chore(release)` 发布提交。
4. 推送 `main`，确认远端 SHA 和对应 CI 成功。
5. 创建并推送 annotated `v2.2.0`，确认 release workflow 与 GitHub Release 成功。
6. 更新 Capsule 为完成状态，创建并推送 `docs(release)` 证据提交，验证主线 CI。
7. 刷新本地 Codex marketplace 与插件安装，确认版本、缓存 revision 与关键 Skill 内容；本次 upgrade 已自动完成安装协调，无需重复 add。

## 停止条件

- 远端 `main` 出现本地未包含的新提交。
- `v2.2.0` 已存在或无法唯一解析到预期发布提交。
- 本地完整测试或远端 CI 失败。
- release workflow 失败或公开 Release 不可见。
- Codex CLI 返回安装失败或本地显示版本/revision 与远端不一致。

## 回滚

发布提交推送前可停止并保留本地提交。`main` 推送后不重写远端历史；如果 tag 尚未推送，用后续修复提交处理。tag 与 Release 推送后不删除公开记录，问题通过新版本修复。本地不手工删除缓存；官方 CLI 可能回收被替换版本，旧版仍可从公开 tag 重新安装。

## 验证

- `node --test tests/ts/workflow-only-migration.test.mjs tests/ts/release-workflow.test.mjs`
- `npm test`
- Skill frontmatter YAML 与 manifest JSON 解析
- `git diff --check`
- GitHub REST API：branch、Actions runs、annotated tag 与 Release
- `codex plugin list --marketplace coding-plugins --json`
