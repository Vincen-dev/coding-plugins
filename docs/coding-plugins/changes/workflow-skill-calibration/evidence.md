---
title: Coding Plugins Skill 校准证据
change_id: workflow-skill-calibration
updated: 2026-08-28
---

# Coding Plugins Skill 校准证据

## 测试驱动证据

- 契约来源：VC-CAL-001～VC-CAL-006。
- 证据模式：静态契约检查；本次只验证 `Skill` 文本、提示、模板和跨文件不变量，不声称证明真实模型行为。
- 变更前基线：`npm test`，32/32 通过。
- 代表性 RED：运行 routing、philosophy、governance、Capsule 和 consistency 聚焦套件，24 项中 11 项按预期失败，覆盖风险路由、四类证据、checkout 四态、验证来源、Capsule 压缩和 Git/review/并行交接。末尾一致性切片另观察到 worktree 初始化副作用与 review 分级 2 项失败。
- GREEN：同一首轮聚焦套件 24/24 通过；末尾 `node --test tests/ts/workflow-skill-consistency.test.mjs` 8/8 通过。
- REFACTOR：同步 README、workflow chain、release notes、提示和模板后运行完整套件，不保留重复命令转录。

## 最终验证

- 命令或检查：`npm test`；`git diff --check`；`git status --short --branch`。
- 结果：42/42 通过，0 失败；差异无空白错误；工作树仅包含本切片的源码、文档、测试和 Capsule 变更。
- 来源：验证时仓库为 `/Users/vincen/workspace/plugins/coding-plugins`，分支为 `codex/optimize-workflow-skills-v2`，基线 HEAD 为 `a2947ac87da3f031c91706f067cf77458916c534`；验证对象是随后提交并 fast-forward 到本地 `main` 的同一 working-tree diff。
- 依赖与产物：`package.json`、`package-lock.json` 未修改；无 codegen、二进制 artifact 或设备验收；插件安装缓存与 release 状态未变更。
- 覆盖范围：静态工作流契约、中文 Capsule 约束、纯 Skills 分发边界、风险/授权/证据/交接一致性。

## 剩余风险

- 静态测试不能证明真实模型在所有自然语言场景中的行为，需保留独立 forward-testing 边界。
- 未执行 push、发布、缓存刷新、真实插件重装或跨模型场景回放，因此这些不在完成声明内。
