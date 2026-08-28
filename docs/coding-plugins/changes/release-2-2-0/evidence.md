---
title: 发布 2.2.0 证据
change_id: release-2-2-0
updated: 2026-08-28
---

# 发布 2.2.0 证据

## 测试驱动证据

- 契约来源：`change.md` 中的 VC-001 至 VC-006。
- 测试类型：版本配置、静态契约、Git、GitHub Actions/Release 和本地 Codex 安装检查。
- RED：运行期望全部当前元数据为 `2.2.0` 的 Node 检查，命中 6 份版本清单、lockfile 两处及 README/GEMINI 标题仍为 `2.1.0`，退出码为 1。
- GREEN：同步版本元数据与发布说明后，版本检查通过，发布 focused 测试 4/4 通过；首次完整测试 46/47，唯一失败是新 `plan.md` 中文字符比例门禁。
- REFACTOR：只补充计划的中文发布阶段说明，未修改产品行为；重新运行完整测试 47/47 通过。
- 证据收口：写回远端与本地安装结果后，完整测试再次以 46/47 命中 `evidence.md` 中文比例门禁；将机器标识统一放入代码格式并补充中文结果说明后重新验证，不改变已经发布的功能内容。

## 最终验证

- 命令或检查：版本同步 `Node` 检查、聚焦发布测试、`npm test`、`Skill/Capsule frontmatter YAML`、7 份 `manifest JSON`、`git diff --check`、远端 `SHA/tag`、`GitHub Actions/Release API`、`Codex CLI marketplace/list`、`cache manifest` 与发布文件比较。
- 结果：版本同步通过，聚焦测试 4/4、全量 47/47、18 个 `YAML frontmatter`、7 份 `JSON` 清单和差异检查通过；远端 `main` 与发布提交均为 `5ee5952d11a95a4428aeafa4fcb4b6457b22f724`，主线持续集成运行 `33157346532` 成功；带说明的标签对象 `a3dbc79874ce61376f517991748a7863ebfcc9a0` 解析到发布提交；发布运行 `33157377786` 成功；公开版本 `378364309` 已可见。
- 本地同步：`codex plugin marketplace upgrade coding-plugins --json` 无错误，市场源与缓存修订均为 `5ee5952d11a95a4428aeafa4fcb4b6457b22f724`；插件列表显示 `2.2.0`、已安装、已启用；入口技能、变更胶囊技能与模块文档模板逐文件一致。官方升级自动回收了旧 `2.1.0` 缓存，未进行手工删除。
- 覆盖范围：本地发布提交、远端 `main`、CI、tag、release workflow、GitHub Release 与本机 Codex 插件安装。

## 剩余风险

- 本机 `gh` token 无效，因此远端状态由 Git push 与公开 GitHub API 验证；未影响发布。
- tag 未签名；仓库没有 signed tag 强制要求，既有发布也使用同一边界。
- 当前已经运行的任务不会热加载刷新后的 Skill；新任务或应用重载后使用本地 `2.2.0`。
