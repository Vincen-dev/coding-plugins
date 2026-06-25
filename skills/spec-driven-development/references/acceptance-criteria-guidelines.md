# Acceptance Criteria Guidelines

验收标准要描述可观察结果，不要描述实现愿望。

好标准：

```text
Given 用户没有登录
When 访问 /settings
Then 系统重定向到 /login，并带上 next=/settings
```

坏标准：

```text
系统正确处理未登录用户。
```

规则：

- 每条 AC 只覆盖一个场景。
- 成功路径、错误路径、边界路径分开写。
- Then 必须是可观察结果。
- 如果无法自动化，写明人工步骤、输入、预期截图/日志/输出。
- AC 必须映射到 traceability matrix。
