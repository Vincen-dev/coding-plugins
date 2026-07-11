# Coding Plugins 变更文档

活跃且需要持久化的工作流状态只存放在：

```text
docs/coding-plugins/changes/<change-id>/
```

每个变更从编号 Verifiable Contract 开始。`change.md` 是整个变更的唯一状态源。只有 Governed 或 Critical 才创建 `plan.md` 和 `evidence.md`；设计或测试附件仅在风险确实需要时增加。

仓库不维护第二套文档层级、隐藏状态缓存、可执行工作流服务或固定产物链。退役设计只保留在 Git 历史和迁移说明中。

## 文档语言

生成文档的标题、章节、说明、决策、批准、证据和风险叙述必须使用简体中文。frontmatter 键、文件名、`change_id`、`VC-*`、代码标识、命令、路径和 API 名称保持英文。

## 必需顺序

```text
可验证契约
  -> 测试先行证据
  -> 最小实现
  -> 测试保持绿色后重构
  -> 最新验证
  -> 基于证据完成
```

从 `using-coding-plugins` 开始，选择最低但诚实的风险 Profile。
