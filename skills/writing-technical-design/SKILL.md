---
name: writing-technical-design
description: 已有批准规格，需要在实现计划前创建或更新独立 technical-design.md、ADR 或架构方案时使用。
---

# 编写技术设计

## 总览

技术设计把规格契约转成工程方案，但不拆执行任务。它回答“怎么实现这些契约”，实现计划回答“按什么步骤改代码和写测试”。

核心原则：技术设计默认独立保存，计划只引用它并拆任务；不要把完整技术方案埋在 `plans/implementation.md` 里。

技术设计不得补写、扩展或重定义需求。如果写技术设计时发现需求、验收标准、外部行为、错误边界或兼容要求不清楚，立即停止技术设计，回到 `spec-driven-development` 更新 spec、重新校验并取得确认，然后再继续技术设计。

## 何时使用

使用本技能：

- 已有批准规格，准备进入实现计划前。
- 用户要求技术方案、技术实现、架构方案、ADR 或 design。
- 方案会影响多个文件、接口、schema、状态机、兼容性或测试策略。
- 需要给后续计划、子代理或评审者一个稳定的设计来源。

不使用本技能：

- 用户只要求解释、状态查询或代码审查。
- 极小变更已经有明确实现路径，可以在计划中写 1 到 3 条 inline design note。
- 还没有批准规格；先使用 `spec-driven-development`。

## 默认路径

技术设计默认保存到：

```text
docs/coding-plugins/features/<area>/<capability>/technical/technical-design.md
```

`<area>/<capability>` 必须和规格、计划、TDD Evidence 路径一致。

同时维护：

```text
docs/coding-plugins/INDEX.md
```

## 内容边界

| 文档 | 负责 | 不负责 |
| --- | --- | --- |
| Spec | 需求、契约、验收标准、错误边界、Spec ID | 具体实现方案 |
| Technical Design | 架构方案、关键决策、影响组件、数据流、接口落地、兼容策略、测试策略 | 逐步执行清单 |
| Plan | 任务拆分、文件修改步骤、RED/GREEN 命令、Spec ID 到 Test 到 Task 追踪 | 重复完整技术方案 |
| Evidence | 实际 RED/GREEN/REFACTOR 和最终验证证据 | 设计讨论 |

## 必须覆盖

- **设计摘要**：2 到 5 句话说明整体方案。
- **规格缺口审查**：确认是否存在未覆盖需求、验收标准不清或新增外部行为；有缺口必须先回到 spec。
- **关键决策**：关键决策、原因、代价。
- **影响组件**：模块、文件、服务或数据结构怎么变。
- **数据流 / 控制流**：核心数据流或控制流。
- **接口和契约**：内部接口、外部 API、schema、状态机如何落地。
- **迁移 / 兼容性**：迁移、兼容、回滚、灰度。
- **测试策略**：Spec ID 对应的测试层级、RED/GREEN 命令和 TDD Evidence 记录方式。
- **风险和缓解**：风险和缓解方案。

如果某项不适用，写 `Not applicable` 并说明原因。不要留空。

## 流程

1. 读取批准规格和相关现有代码。
2. 做规格缺口审查：逐项确认未覆盖需求、验收标准不清、外部行为新增、错误边界和兼容要求。
3. 如果发现缺口，不要在 technical 中顺手补需求；回到 `spec-driven-development` 更新 spec、重新运行规格校验并等待用户确认。
4. 确认 area/capability，并检查是否已有技术设计。
5. 创建或更新 `technical/technical-design.md`，正文标题默认使用中文。
6. 在规格 metadata 或正文中引用 technical design 路径；metadata key 保持英文，正文使用 `## 文档信息` 展示中文摘要。
7. 更新 `docs/coding-plugins/INDEX.md`。
8. 运行 `python3 scripts/preflight.py` 或至少运行相关 preflight 单测。
9. 交接给 `writing-plans`，计划必须写 `Technical Design Source`。

## 模板

优先使用：

```text
skills/writing-technical-design/templates/technical-design.md
```

真实文档中必须替换所有占位符。技术设计可以引用 Mermaid，但不要用图替代文字约束。

## 自审

- 是否每个 MUST Spec ID 都在设计中有落地点。
- 是否完成 `## 规格缺口审查`，且没有未处理、待处理或需澄清的缺口。
- 是否没有在 technical 中新增需求、验收标准或外部行为；如有，是否已回写 spec。
- 是否把关键决策、代价和风险写清楚。
- 是否明确受影响文件或模块。
- 是否说明兼容、迁移或为什么不适用。
- 是否说明测试策略和 TDD Evidence 目标。
- 是否没有任务清单膨胀；任务拆分留给 `writing-plans`。
- 是否同步两个索引。

## 交接

完成后说明：

```text
技术设计已保存到 docs/coding-plugins/features/<area>/<capability>/technical/technical-design.md。
下一步使用 writing-plans 创建 implementation.md，并在计划中引用 Technical Design Source。
```
