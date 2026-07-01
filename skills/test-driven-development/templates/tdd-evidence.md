---
title: <能力> TDD 证据
status: draft
feature: <feature-name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/<feature-name>/specs/feature.md
related_technical:
  - docs/coding-plugins/features/<feature-name>/technical/technical-design.md
related_plans:
  - docs/coding-plugins/features/<feature-name>/plans/implementation.md
---

# <能力> TDD 证据

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |

## 任务 <N>：<任务名称>

### TDD 证据

- **规格/缺陷/验收:** <REQ-001、bug 复现链接或验收标准>
- **测试类型:** behavior
- **RED 测试:** `<tests/path/test_file.py::test_specific_behavior>`
- **RED 命令:** `<pytest tests/path/test_file.py::test_specific_behavior -v>`
- **RED 失败:** <失败信息摘要，说明它因缺失行为失败，而不是导入、拼写或环境问题>
- **GREEN 变更:** <最小实现摘要>
- **GREEN 命令:** `<pytest tests/path/test_file.py::test_specific_behavior -v>`
- **REFACTOR 命令:** `<pytest tests/path/test_file.py -v>`
- **最终验证:** <最终相关测试、构建或校验命令和结果>

## 任务 <N>：<无法自动测试的任务名称>

### TDD 例外记录

- **原因:** <为什么无法先写失败测试>
- **用户批准:** <用户同意的原话或明确说明>
- **替代验证:** <替代验证命令、日志、截图或人工验收步骤>
- **风险:** <剩余风险和后续补测试计划>
