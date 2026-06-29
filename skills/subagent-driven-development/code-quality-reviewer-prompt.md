# 代码质量评审 Prompt 模板

派发代码质量评审子代理时使用本模板。

**目的：**确认实现构建良好、测试充分、可维护。

**只在规格符合性评审通过后派发。**

```text
Task tool (general-purpose):
  使用 requesting-code-review/code-reviewer.md 模板

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: 任务 N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
```

除标准代码质量外，评审者还应检查：

- 每个文件是否有单一清晰职责和明确接口？
- 单元是否可独立理解和测试？
- 实现是否遵循计划中的文件结构？
- 测试是否验证外部行为，而不是实现细节或 mock 调用本身？
- TDD 证据 是否和实际测试文件、命令、失败/通过结果一致？
- 是否出现测试后补、过宽测试、快照滥用、固定 sleep 或只追覆盖率等反模式？
- 这次改动是否创建了已经过大的新文件，或显著膨胀了现有文件？不要因为历史文件本来大而扣分，关注本改动贡献。

**代码评审返回：**Strengths、Issues（Critical/Important/Minor）、Assessment。
