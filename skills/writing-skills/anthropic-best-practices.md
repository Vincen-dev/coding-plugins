# 技能编写最佳实践（中文整理）

本文件是原版 Anthropic 技能作者指南的中文整理版，供 `writing-skills` 使用。重点是让技能容易被发现、容易被正确调用、并且在上下文中保持高信号。

## 技能定位

技能应记录可复用能力：流程、工具、技术模式、参考材料或领域操作步骤。不要把一次性任务复盘写成技能。

好技能回答三个问题：

1. 什么时候应该使用它？
2. 使用时必须做什么？
3. 如何判断做对了？

## Frontmatter

必须包含：

```yaml
---
name: skill-name
description: Use when ...
---
```

`name`：

- 小写 kebab-case。
- 稳定、短、可搜索。
- 不包含空格、括号或特殊字符。

`description`：

- 只写触发条件。
- 不写流程摘要。
- 包含具体症状、场景和关键词。
- 保持简短，避免让代理只看描述就跳过正文。

坏：

```yaml
description: Use for TDD - write failing test, implement, refactor
```

好：

```yaml
description: Use when implementing any feature or bugfix, before writing implementation code
```

## 内容结构

推荐结构：

```markdown
# Skill Name

## Overview
核心原则和目标。

## When to Use
触发场景，不适用场景。

## Process
必须执行的步骤。

## Examples
好/坏对比。

## Common Mistakes
常见失败和修正。

## Verification
完成标准。
```

## 渐进披露

不要把所有参考材料都塞进 `SKILL.md`。核心规则放正文，长参考、模板、脚本放旁边文件，并在正文中明确何时读取。

适合拆文件：

- 100 行以上 API 参考。
- 大型 prompt 模板。
- 可复用脚本。
- 示例集合。

不适合拆文件：

- 核心步骤。
- 必须立即知道的约束。
- 短示例。

## 可发现性

技能能否生效，首先取决于代理能否找到它。`description` 应包含用户请求中可能出现的词：

- 症状：flaky、timeout、race condition、回归、卡住。
- 场景：写计划、修 bug、代码评审、创建技能。
- 工具或文件类型：pytest、React、OpenAPI、PDF、docx。
- 同义词：hang/freeze/stall，cleanup/teardown。

## 规则强度

区分刚性和柔性：

- 刚性技能：TDD、调试、安全发布。使用 MUST、STOP、NEVER。
- 柔性技能：设计模式、写作风格。说明原则和取舍。

不要把所有建议都写成 MUST，否则代理会僵硬且难以遵守。

## 示例质量

示例应包含好坏对比，并说明为什么。只给正例不够，代理容易沿着坏合理化走。

示例越接近真实失败越好：

- 坏例展示常见偷懒。
- 好例展示具体替代做法。
- 解释差异。

## 测试技能

技能需要像代码一样测试：

1. 设计一个没有技能时代理会失败的压力场景。
2. 运行基线，记录失败。
3. 写技能。
4. 在同样场景下验证代理遵守。
5. 发现新绕过方式后修技能。

## 常见错误

- 描述字段写成流程摘要。
- 技能太长，把核心埋在参考材料里。
- 只写原则，没有步骤。
- 没有“何时不用”。
- 没有失败示例。
- 没有验证标准。
- 把项目特定规则写成通用技能。
- 用技能替代可自动化校验。

## 最小完成标准

发布前检查：

- frontmatter 有效。
- `description` 只描述触发条件。
- 核心步骤明确。
- 长参考按需拆分。
- 至少一个压力场景通过。
- 没有 TODO、占位符和互相矛盾的规则。
