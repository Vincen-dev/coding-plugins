# Release Notes

## 0.6.16 - 2026-06-26

- 增强 preflight，校验 skill metadata、manifest 资源、文档路径、Evidence Spec ID、release notes 和版本配置一致性。
- 增加 `RELEASE-NOTES.md`、`.version-bump.json` 和 `scripts/bump_version.py`，支持可重复的版本提升流程。
- 增加入口路由、显式 skill 请求、Claude 命名空间和 SessionStart hook 输出的行为级测试。

## 0.6.15 - 2026-06-26

- 增加 Codex SessionStart hook，在新建、恢复和清空会话时注入 `coding-plugins:using-coding-plugins` 入口规则。
- 增加 `docs/coding-plugins/INDEX.md` 产物总索引，统一检索规格、计划和 TDD Evidence。

## 0.6.14 - 2026-06-26

- 为 Codex 接入 SessionStart hook 基础链路。
- 同步 Claude manifest 版本。

## 0.6.13 - 2026-06-26

- 固定 TDD Evidence 默认落地路径为 `docs/coding-plugins/evidence/<area>/<capability>/tdd-evidence.md`。
- preflight 自动严格校验 TDD Evidence 文件。
