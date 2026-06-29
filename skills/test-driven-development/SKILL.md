---
name: test-driven-development
description: 实现任何功能或 bugfix 且准备写实现代码前使用；强制先写失败测试。
---

# 测试驱动开发（TDD）

## 总览

先从规格、bug 复现或明确验收标准写测试。看着它失败。写最小代码让它通过。

**核心原则：**如果你没有看见测试失败，就不知道它是否真的测试了正确的东西。

违反规则的字面要求，就是违反规则的精神。

测试必须来自已批准规格、Spec ID、bug 复现或明确验收标准。不要根据实现细节倒推测试。

## 何时使用

必须使用：

- 新功能。
- bug 修复。
- 重构。
- 行为变更。

例外必须询问用户：

- 一次性原型。
- 生成代码。
- 配置文件。

如果你在想“这次先跳过 TDD”，停下。这是在合理化偷懒。

## 铁律

```text
没有先失败的测试，就不能写生产代码
```

先写了代码？删除它，重新开始。

不要保留作为“参考”，不要边写测试边“改造”它，不要再看它。删除就是删除。根据测试重新实现。

## RED-GREEN-REFACTOR

### RED：写失败测试

写一个最小测试，展示期望行为。

如果有 SDD 规格，测试名称或注释必须能追溯到相关 Spec ID，例如 `REQ-001` 或 `AC-003`。

好测试：

- 名称清楚。
- 测试真实行为。
- 一次只测一件事。
- 除非不可避免，不 mock 被测对象本身。

坏测试：

- 名字模糊。
- 只测试 mock 是否被调用。
- 把多个行为塞进一个测试。

### 验证 RED：看它正确失败

必须执行，不能跳过：

```bash
npm test path/to/test.test.ts
```

确认：

- 测试失败，而不是测试运行错误。
- 失败信息符合预期。
- 失败原因是功能缺失，而不是拼写、导入或环境错误。

如果测试通过，说明你在测试已有行为，修测试。如果测试报错，修正错误并重跑，直到它因正确原因失败。

### GREEN：写最小代码

只写让测试通过所需的最简单代码。

不要添加未来功能、重构其他代码、顺手“优化”或做测试未要求的抽象。

### 验证 GREEN：看它通过

再次运行测试，确认：

- 新测试通过。
- 相关旧测试仍通过。
- 输出干净，没有错误或警告。

如果测试失败，修代码，不要改测试来迁就实现。其他测试失败也要立刻处理。

### REFACTOR：清理

只有在 green 后才重构：

- 去重复。
- 改善命名。
- 提取辅助函数。

保持测试一直为 green，不添加新行为。

## 测试层级选择

测试层级由规格或 bug 复现决定，不由实现方便程度决定。

| 来源 | 首选测试 | 补充测试 |
| --- | --- | --- |
| 函数逻辑、业务规则、边界条件 | 单元测试 | 少量集成测试 |
| API、SDK、协议、schema | 契约测试或集成测试 | 单元测试覆盖分支 |
| 状态机、生命周期、异步流程 | 状态转换测试 | 端到端关键路径 |
| UI 行为 | 组件/交互测试 | 截图或人工验收证据 |
| bug 修复 | 失败复现测试 | 回归测试覆盖邻近边界 |
| 纯重构 | 现有测试或 characterization test | 行为不变的快照/金样本测试 |

如果无法写自动测试，必须先记录 TDD Exception Record，并获得用户同意，再使用最接近的替代验证。

## 落地路径

TDD Evidence 不是只写在聊天里。默认保存到：

```text
docs/coding-plugins/features/<area>/<capability>/evidence/tdd-evidence.md
```

`<area>/<capability>` 应和规格、计划路径一致。例如：

```text
docs/coding-plugins/features/auth/login/specs/feature.md
docs/coding-plugins/features/auth/login/plans/implementation.md
docs/coding-plugins/features/auth/login/evidence/tdd-evidence.md
```

如果项目已有测试报告或 ADR 约定，优先使用项目约定，但最终报告必须写明实际 evidence 文件路径。

一个文件可以记录同一 capability 下多个任务。每个任务使用二级标题，例如：

```markdown
## Task 1: 登录失败错误码

### TDD Evidence
```

无法 TDD 时，同一个文件中记录 `TDD Exception Record`。

## TDD Evidence

每个会改变行为的实现任务，必须在 evidence 文件中写入 TDD Evidence 块，并在回报时给出该文件路径。字段名保持英文，便于脚本检查：

```markdown
## TDD Evidence

- **Spec/Bug/AC:** REQ-001 或 bug 复现链接/明确验收标准
- **RED test:** `tests/path/test_file.py::test_specific_behavior`
- **RED command:** `pytest tests/path/test_file.py::test_specific_behavior -v`
- **RED failure:** 失败信息摘要，说明它因缺失行为失败，而不是导入、拼写或环境问题
- **GREEN change:** 最小实现摘要
- **GREEN command:** `pytest tests/path/test_file.py::test_specific_behavior -v`
- **REFACTOR command:** `pytest tests/path/test_file.py -v`，没有重构也写明重跑命令
- **Final verification:** 最终相关测试/构建命令和结果
```

纯重构没有新增行为时，`RED failure` 字段写 existing green baseline 或 characterization test 的基线结果，并说明为什么 RED 不适用。发现真实 bug 时不要混在重构里修，拆出 bugfix 并走标准 RED。

可以用脚本检查证据：

```bash
python3 skills/test-driven-development/scripts/validate_tdd_evidence.py docs/coding-plugins/features/<area>/<capability>/evidence/tdd-evidence.md
```

严格检查用于发布前或 CI：

```bash
python3 skills/test-driven-development/scripts/validate_tdd_evidence.py --strict docs/coding-plugins/features/<area>/<capability>/evidence/tdd-evidence.md
```

## TDD Exception Record

跳过先写失败测试不是默认选项。只有确实无法 TDD 时，先问用户，并记录：

```markdown
## TDD Exception Record

- **Reason:** 为什么无法先写失败测试
- **User approval:** 用户同意的原话或明确说明
- **Alternative verification:** 替代验证命令、日志、截图或人工验收步骤
- **Risk:** 剩余风险和后续补测试计划
```

以下情况也需要 Exception Record：

- 第三方生成代码无法提前写测试。
- 纯文档、manifest 或配置修改没有可执行行为。
- 环境缺失导致自动测试无法运行。

如果只是“赶时间”“改动很小”“写测试麻烦”，不是例外。

## 好测试标准

| 质量 | 好 | 坏 |
| --- | --- | --- |
| 最小 | 一个行为；名字里有“and”通常要拆 | `validates email and domain and whitespace` |
| 清楚 | 名称描述行为 | `test1` |
| 表达意图 | 展示期望 API 和结果 | 只暴露内部实现细节 |

## 为什么顺序重要

“写完后补测试”证明不了测试能抓住错误。它可能测试错东西、测试实现而非行为、遗漏你没想到的边界。测试先行迫使你先看到失败，证明测试确实能捕捉缺失行为。

“我已经手工测试过”也不够。手工测试没有稳定记录，不能随代码变化重复执行，压力下容易漏掉情况。自动测试是系统化的。

“删掉几个小时工作很浪费”是沉没成本。真正浪费的是保留你无法信任的代码。没有真实测试保护的工作代码就是技术债。

## 常见合理化

| 借口 | 现实 |
| --- | --- |
| 太简单不需要测试 | 简单代码也会坏，测试只需很短时间。 |
| 之后补测试一样 | 不一样，你失去了测试确实会失败的证据。 |
| 时间不够 | 调试回归更慢。 |
| 这个很难测 | 那通常说明设计或边界需要改善。 |
| 先实现再改成 TDD | 先实现的代码必须删除后重写。 |

## 测试反模式

开始写测试前，阅读 `testing-anti-patterns.md`。尤其警惕：

- 过度 mock。
- 测试实现细节。
- 只为了覆盖率写断言。
- 没有先验证失败。

## 压力场景

遇到以下场景时，先读对应参考，避免在压力下绕过 TDD：

- `test-pressure-simple-change.md`：小改动也要留下 RED 证据。
- `test-pressure-bugfix-urgent.md`：紧急 bugfix 先复现失败，再修复。
- `test-pressure-refactor-no-behavior-change.md`：纯重构用现有测试或 characterization test 保护行为。

## 完成标准

最终报告必须包含 TDD Evidence 文件路径，并概述其中记录的证据：

- 写了哪个失败测试。
- 它对应哪个 Spec ID、bug 复现或验收标准。
- 它初始如何失败。
- 写了什么最小实现。
- 是否重构，以及重构后运行了什么测试。
- 最终运行了哪些测试，结果如何。

若没有 TDD Evidence，必须在 evidence 文件中有 TDD Exception Record；否则不能声称任务完成。
