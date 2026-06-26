---
name: spec-driven-development
description: 新需求、行为变更、接口契约、schema、状态机或验收标准尚未明确，且准备进入实现计划前使用。
---

# 规格驱动开发（SDD）

## 总览

先把“应该做什么”写成可追踪、可测试、可评审的规格，再进入计划和实现。

**核心原则：**没有已批准规格，就不能进入 `writing-plans`。

## 硬性门禁

- 不得写代码、搭脚手架或调用实现技能。
- 每个 MUST/SHOULD 需求必须有稳定 Spec ID。
- 每个 MUST 需求必须能映射到测试、契约校验或人工验收证据。
- 外部契约必须包含示例：请求/响应、schema 样例、状态迁移或错误样例。
- 规格变更必须先改 spec，再改 plan/test，最后再改实现。
- 用户确认规格前，不得进入 `writing-plans`。

## 适用范围

使用本技能：

- 新功能、行为变更、产品方向不清。
- API、SDK、协议、schema、状态机或跨团队接口。
- 用户故事、验收标准、错误语义或兼容性未明确。
- 现有需求只有自然语言描述，还不能直接写计划。

不使用本技能：

- 已有批准过的规格：直接用 `writing-plans`。
- 已有清晰 bug 复现：用 `systematic-debugging`，需要修复时转 `test-driven-development`。
- 用户明确只要解释、搜索或代码审查。

## 流程

1. **探索上下文**：读相关代码、文档、最近变更和现有约定。
2. **判断规格类型**：读取 `references/choosing-spec-type.md`，选择需要的模板。
3. **澄清缺口**：一次只问一个关键问题；优先问会影响契约、边界或验收的问题。
4. **写结构化规格**：按选定模板输出到 `docs/coding-plugins/specs/YYYY-MM-DD-<topic>-spec.md`，用户路径优先。
5. **分配 Spec ID**：使用 `REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON` 前缀。
6. **建立追踪种子**：用 `templates/traceability-matrix.md` 列出每个 Spec ID 的验证方式。
7. **运行规格校验**：执行 `python3 skills/spec-driven-development/scripts/validate_spec.py <SPEC_FILE_PATH>`，修复失败项。
8. **规格自审**：按 `references/spec-review-checklist.md` 检查并修复缺口。
9. **用户确认**：要求用户审阅规格。用户要求修改时，改 spec 并重新校验和自审。
10. **过渡计划**：用户确认后调用 `writing-plans`。

## 规格类型路由

| 情况 | 必读文件 |
| --- | --- |
| 普通功能或用户流程 | `templates/feature-spec.md` |
| HTTP/RPC/API/SDK 契约 | `templates/api-contract-spec.md`, `references/api-contract-guidelines.md` |
| 数据结构、配置、事件 payload | `templates/schema-spec.md`, `references/schema-guidelines.md` |
| 状态、工作流、生命周期 | `templates/state-machine-spec.md`, `references/state-machine-guidelines.md` |
| 验收标准不清 | `templates/acceptance-criteria.md`, `references/acceptance-criteria-guidelines.md` |

只读取当前任务需要的模板和参考，不要一次加载所有支持文件。

## 质量标准

规格必须回答：

- 用户或系统目标是什么？
- 明确不做什么？
- 输入、输出、状态、错误和边界是什么？
- 成功路径、失败路径、边界条件是什么？
- 哪些内容是 MUST，哪些只是 SHOULD/MAY？
- 如何验证每条 MUST 规格？

## 自动校验

写完规格后运行：

```bash
python3 skills/spec-driven-development/scripts/validate_spec.py <SPEC_FILE_PATH>
```

可一次校验多个规格，并为 CI 或编辑器集成输出 JSON：

```bash
python3 skills/spec-driven-development/scripts/validate_spec.py --format json docs/coding-plugins/specs/*.md
```

校验器会阻止：

- TODO/TBD/占位符残留。
- 缺少 Spec ID。
- 重复定义同一个 Spec ID。
- MUST 行没有验证方式。
- Traceability Matrix 未覆盖 MUST 规格。
- 追踪行没有测试命令、契约校验或人工验收证据。
- Traceability Matrix 的 Status 非法。

校验器会警告 SHOULD 未进入 Traceability Matrix 的情况。`--strict` 会把 SHOULD 追踪缺口和“适当、友好、常见情况”等模糊词 warning 提升为错误。脚本通过不代表规格已经可批准，仍必须按 `references/spec-review-checklist.md` 自审。

## 交接给计划

交接时说明：

```text
规格已保存到 <SPEC_FILE_PATH>，并已通过自审。请确认是否进入 writing-plans。
```

确认后，`writing-plans` 必须把 Spec ID 映射到测试和任务。

## 常见错误

- 写成方案散文，没有 Spec ID。
- 只写 happy path，没有错误和边界。
- 用“适当”“友好”“尽快”“支持常见情况”等无法验证的词。
- 规格中出现实现细节，却没有定义外部契约。
- 没有非目标，导致实现阶段 scope creep。
- 用户未确认规格就开始写计划或代码。
