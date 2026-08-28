---
title: 功能模块文档交付检查计划
change_id: module-documentation-delivery
updated: 2026-08-28
---

# 功能模块文档交付检查计划

## 设计

由 `using-coding-plugins` 持有通用 `Documentation Impact Check` 和四态分类；`change-capsule` 负责持久化记录与模块文档/Capsule 边界；`executing-plans` 负责执行文档任务；`verification-before-completion` 负责完成前一致性检查。提供一个可选模块文档模板，但不增加任何 Profile 的固定 Capsule 产物预算。

## 测试策略

- 使用静态契约检查覆盖四态分类、触发条件和 Quick/Inspect 非强制边界。
- 检查 `change.md` 模板包含文档影响、目标、原因和验证字段。
- 检查可选模块文档模板的最小章节及其非 Capsule 归属。
- 检查执行与验证 Skill 对非 `none` 文档影响形成闭环。
- 最终运行文档聚焦测试、完整 `npm test` 和 `git diff --check`。

## 任务

1. 增加文档影响契约测试并观察 RED。
2. 更新入口、Change Capsule、执行和验证 Skill。
3. 更新 `change.md` 模板并增加可选模块文档模板。
4. 同步 README、workflow chain 和 release notes。
5. 运行聚焦与完整验证，压缩并完成 Capsule。

## 回滚

变更仅涉及 Skill、模板、静态文档、测试和本 Capsule；可按文件恢复，不修改业务数据、安装缓存或外部文档系统。

## 验证

- `node --test tests/ts/workflow-documentation-impact.test.mjs`
- `node --test tests/ts/change-capsule-contract.test.mjs tests/ts/workflow-philosophy.test.mjs`
- `npm test`
- `git diff --check`
- `git status --short --branch`
