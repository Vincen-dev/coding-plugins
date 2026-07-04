# Coding Plugins for Gemini CLI

Coding Plugins 是中文编码代理方法论插件。开始任何开发、调试、评审、提交或收尾任务时，先读取并遵守 `skills/using-coding-plugins/SKILL.md`。

## 默认入口

- 方案讨论、需求不清或先分析不落地：使用 `brainstorming`。
- 新功能、行为变更、接口契约、schema、状态机或验收标准不清：使用 `spec-driven-development`。
- 小型明确变更：使用 `test-driven-development`。
- bug、测试失败、CI 失败或原因不明：使用 `systematic-debugging`。
- 已有 IPD 任务执行文档：使用 `subagent-driven-development` 或 `executing-plans`。
- 声称完成前：使用 `verification-before-completion`。
- 用户要求提交：使用 `git-commit`。

## 核心约束

- 规格先于实现，证据先于完成声明。
- 执行阶段优先读取当前 IPD 任务章节和执行锁定区，不重复吞完整上游文档。
- 修改插件自身后运行 `npm run preflight`。
