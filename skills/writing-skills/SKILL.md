---
name: writing-skills
description: 创建新技能、编辑现有技能或部署前验证技能是否有效时使用。
---

# 编写技能

## 总览

**写技能就是把测试驱动开发应用到流程文档。**

个人技能通常放在代理特定目录，例如 Codex 的 `~/.agents/skills/`。插件技能放在插件的 `skills/` 目录。

你写测试用例（压力场景和子代理），观察它失败（没有技能时的基线行为），写技能文档，观察测试通过（代理遵守），再重构（堵住漏洞）。

**核心原则：**如果你没有看见代理在没有技能时失败，就不知道这个技能是否教会了正确东西。

使用本技能前，必须理解 `test-driven-development` 的 RED-GREEN-REFACTOR。本技能把它适配到文档。

官方技能写作最佳实践见 `anthropic-best-practices.md`；本文提供补充模式和 TDD 化方法。

## 什么是技能

技能是可复用技术、模式或工具的参考指南，帮助未来代理找到并应用有效方法。

技能是：

- 可复用技术。
- 问题处理模式。
- 工具和参考指南。

技能不是：

- 你曾经如何解决某个一次性问题的叙事。

## 技能 TDD 映射

| TDD 概念 | 技能创建 |
| --- | --- |
| 测试用例 | 子代理压力场景 |
| 生产代码 | `SKILL.md` |
| RED | 没有技能时代理违反规则 |
| GREEN | 有技能后代理遵守 |
| 重构 | 堵住漏洞并保持遵守 |
| 先写测试 | 写技能前先跑基线场景 |
| 看它失败 | 记录代理会如何合理化 |
| 最小代码 | 写文档只处理这些具体失败 |
| 看它通过 | 验证代理现在遵守 |

## 何时创建技能

创建：

- 技术不直观。
- 未来跨项目会再次引用。
- 模式适用面广。
- 其他代理也会受益。

不要创建：

- 一次性方案。
- 外部已有充分文档的标准实践。
- 项目特定约定，放进仓库规则。
- 可用正则或校验自动化的机械约束。

## 技能类型

- **Technique**：具体步骤方法，例如基于条件等待、根因追踪。
- **Pattern**：思考问题的方式。
- **Reference**：API 文档、语法指南、工具文档。

## 目录结构

```text
skills/
  skill-name/
    SKILL.md
    supporting-file.*
```

扁平命名空间。只有在需要 100 行以上重参考或可复用工具时，才拆额外文件。原则、概念和短代码模式留在 `SKILL.md`。

## SKILL.md 结构

frontmatter 必须包含：

- `name`：只用字母、数字和连字符。
- `description`：第三人称，只描述何时使用，不描述流程。

`description` 应回答：“现在是否应该读取这个技能？”不要把流程摘要写进去，否则代理可能只按描述行动，不读正文。

推荐结构：

```markdown
---
name: skill-name
description: Use when [specific triggering conditions]
---

# Skill Name

## Overview
核心原则。

## When to Use
触发症状和不适用场景。

## Core Pattern
前后对比。

## Quick Reference
表格或清单。

## Implementation
步骤、代码或引用。

## Common Mistakes
错误和修正。
```

## 可发现性优化

- `description` 从 “Use when...” 开始，只写触发条件。
- 使用代理会搜索的具体词：错误消息、症状、同义词、工具名、文件类型。
- 名称用主动、可搜索的动词或技术名。
- 频繁加载的技能要短，避免浪费上下文。

## 压力测试

阅读 `testing-skills-with-subagents.md`。至少设计一个能诱发错误行为的场景：

1. 没有技能时代理会失败。
2. 有技能时代理会遵守。
3. 记录失败合理化。
4. 修技能直到通过。

## 插件案例沉淀

当优化 `coding-plugins` 自身，并且问题来自真实项目、安装缓存、metadata 同步、文档可读性或 validator 回归时，不要只写抽象规则。把问题沉淀成可回归的 fixture case：

1. 先用一句话描述问题和风险。
2. 在 `tests/fixtures/formal-feature-chain/CASE-INDEX.md` 登记案例，写清 `case_id`、`source_type`、`source_reference`、`optimization_target` 和 `covered_risks`。
3. 优先运行 `python3 scripts/scaffold_fixture_case.py` 生成 fixture 骨架，再按实际场景补正文。
4. 写 RED 测试证明当前插件会漏掉这个问题。
5. 修 preflight、validator、模板或 skill 规则。
6. 运行 `python3 scripts/preflight.py`，确认 CASE、文档链路和 validator 都通过。

固定流程是：问题 -> CASE -> RED -> 修复 -> preflight。只有 CASE 进入索引且有测试守护，真实项目问题才算沉淀为插件能力。

## 说服原则

阅读 `persuasion-principles.md`。好技能不仅列规则，还要解释为什么规则必要、常见绕过方式是什么、违反会导致什么结果。
