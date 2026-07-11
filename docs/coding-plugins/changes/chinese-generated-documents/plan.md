---
title: 生成文档中文化计划
change_id: chinese-generated-documents
updated: 2026-07-11
---

# 生成文档中文化计划

## 设计

模板的 frontmatter 键和稳定标识保持英文，所有面向用户的标题、章节名、占位说明和叙述内容改为简体中文。`change-capsule` 负责声明语言边界，静态测试负责防止英文模板回流。

## 测试策略

- VC-001：逐个验证五个模板的中文章节和中文内容。
- VC-002：验证 `change-capsule` 包含强制中文与稳定字段例外。
- VC-003：遍历所有活跃 Capsule，验证标题包含中文且主体以中文为主。

## 任务

1. 新增中文生成契约测试并观察失败。
2. 中文化五个模板和 `change-capsule` 生成规则。
3. 中文化现有活跃 Capsule 及文档入口。
4. 更新原有模板契约测试和维护测试清单。
5. 运行 focused tests、全量测试、残余英文标题扫描和 diff 检查。

## 回滚

提交前可整体回退本次语言变更。回滚不得恢复旧契约或可执行工作流层。

## 验证

- `node --test tests/ts/workflow-chinese-documents.test.mjs`
- `npm test`
- 中文标题与主体扫描
- `git diff --check`
