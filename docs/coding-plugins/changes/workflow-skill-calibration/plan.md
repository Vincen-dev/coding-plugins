---
title: Coding Plugins Skill 校准计划
change_id: workflow-skill-calibration
updated: 2026-08-28
---

# `Coding Plugins Skill` 校准计划

## 设计

以 `using-coding-plugins` 持有通用风险、授权和 `checkout` 判定；测试驱动、验证、变更胶囊、版本控制、评审和并行 `Skill` 只维护各自流程。保留纯工作流架构，不增加运行时。

## 测试策略

- `VC-CAL-001～004`：更新路由、原则和治理契约测试，先在旧 `Skill` 上观察 `RED`。
- `VC-CAL-005`：扩展变更胶囊契约和状态测试。
- `VC-CAL-006`：增加跨 `Skill` 一致性测试，检测自动收尾、评审顺序、并行资源和署名规则。
- 最终运行聚焦的 `Node` 测试和完整 `npm test`，再检查 `Git diff` 与空白错误。

## 任务

1. 新增和修改契约测试，观察旧规则因缺少目标行为而失败。
2. 修改职责所属的 `Skill` 和必要提示，保持通用规则单一归属。
3. 运行聚焦测试，处理真实契约冲突。
4. 运行完整测试和差异检查，回填变更胶囊。

## 回滚

全部变更限制在新分支的 `Skill`、提示、测试和变更胶囊文件；可按文件恢复，不涉及外部数据、发布或安装状态。

## 验证

- `node --test tests/ts/workflow-only-routing.test.mjs tests/ts/workflow-philosophy.test.mjs tests/ts/workflow-governance-hardening.test.mjs tests/ts/change-capsule-contract.test.mjs tests/ts/workflow-skill-consistency.test.mjs`
- `npm test`
- `git diff --check`
- `git status --short --branch`
