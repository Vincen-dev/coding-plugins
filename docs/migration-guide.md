# Coding Plugins Migration Guide

本指南说明既有项目接入 Coding Plugins 时，什么时候使用 lightweight TDD，什么时候进入 full-chain 或 maintenance-chain，以及 `docs/coding-plugins/` 是否应提交到仓库。

## Workflow Choice

使用 lightweight TDD 的场景：

- 改动范围清楚，通常不超过一两个文件。
- 行为或 bug 复现已经明确，可以先写 RED 测试。
- 不涉及 public API、schema、generator、release、dependency、SDK 兼容窗口或数据迁移。

使用 full-chain 的场景：

- 新需求、接口契约、schema、状态机、验收标准还不清楚。
- 需要 PRD、TSD、TVD、TED、VED 追踪 Spec ID 到测试和证据。
- 用户说“继续”时，先运行 `coding-plugins task status --root . --intent "继续" --json`，按唯一下一步执行。
- Agent 新接入优先运行 `${CP_CLI} task status --root . --intent "继续" --contract-version 2 --json`。v2 返回 Inspect、Change、Governed Change 三类 flow、唯一 `next`、结构化 `{name: "task", args: [...]}`、稳定 diagnostics 和当前 context。
- 1.x 兼容期内不带 `--contract-version` 仍返回 v1 payload；现有 `start`、`workflow-state`、`workflow-guard`、`workflow-brief` 和 `dp` 保留为兼容/debug 入口，但不再是普通 Agent 需要手工串联的主入口。
- 不要在业务仓库构造 `node ./bin/coding-plugins.js`。应使用 SessionStart 提供的 `${CP_CLI}`，以避免业务仓库不存在该文件时的 `MODULE_NOT_FOUND`。

使用 maintenance-chain 的场景：

- 维护、迁移、重构、安全、性能、依赖升级或 release 流程变更会影响兼容性或验证口径。
- 需要证明旧行为如何保留、风险如何降级、发布如何验证。
- tag 推送不等于 release 完成；发布类完成报告必须包含 workflow run、远端 tag 和发布目标可见性。

## Artifact Modes

`docs/coding-plugins/` 支持三种 artifact mode：

- `tracked`：正式 PRD/TSD/TVD/TED/VED 进入当前仓库。适合团队协作、审查、commit, tag, release 证据。
- `local`：本机 scratch。可以辅助会话，但不能作为完成、commit, tag, release 或 publish 证据。
- `external`：正式文档在外部系统。仓库根目录 `.coding-plugins-artifacts.json` 必须记录 `external_reference` 或 `external_artifact_id`。

业务仓库是否提交 `docs/coding-plugins/`：

- 团队需要可复核证据、PR 审查或发布审计时，使用 `tracked` 并提交。
- 单人临时探索或不希望污染业务仓库时，使用 `local`，但不要把它作为完成报告证据。
- 公司已有 Wiki、飞书、Notion 或工单系统承载正式文档时，使用 `external` 并在仓库记录外部引用。

## Completion Reports

完成报告必须分清：

- 已实现
- 已验证
- 未验证
- 只本地验证
- 已提交
- 已发布

发布类报告必须列出 workflow run、远端 tag、发布目标可见性或失败原因。没有这些证据时，只能报告“未发布完成”。
