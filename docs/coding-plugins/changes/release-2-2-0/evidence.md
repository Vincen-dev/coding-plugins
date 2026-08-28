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

## 最终验证

- 命令或检查：版本同步 Node 检查、focused 发布测试、`npm test`、Skill/Capsule frontmatter YAML、7 份 manifest JSON、`git diff --check`；远端发布和本地安装检查待执行。
- 结果：版本同步通过，focused 4/4、全量 47/47、18 个 YAML frontmatter、7 份 JSON 清单和差异检查通过。
- 覆盖范围：本地发布提交、远端 `main`、CI、tag、release workflow、GitHub Release 与本机 Codex 插件安装。

## 剩余风险

- 远端 `main`、CI、tag、Release 和本地同步尚未执行。
