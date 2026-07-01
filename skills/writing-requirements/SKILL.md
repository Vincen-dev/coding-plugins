---
name: writing-requirements
description: Use when writing or updating Coding Plugins requirement documents, including feature, API contract, schema, state-machine, acceptance, or maintenance requirement specs under docs/coding-plugins/features/<feature-name>/specs/.
---

# 编写需求文档

## 总览

本技能负责把需求、契约、schema、状态机、验收标准或维护约束写成可追踪、可验证的需求文档。`spec-driven-development` 负责判断完整文档链路；本技能负责真正编写 `specs/<spec-kind>.md`。

**核心原则：**需求文档只定义“要什么”和“如何验收”，不写技术方案、测试用例步骤或实现计划。

开始时声明：“我正在使用 writing-requirements 技能来编写需求文档。”

## 何时使用

使用本技能：

- 新需求、行为变更、用户流程或产品规则需要成文。
- API、SDK、CLI、协议或公共函数契约需要固定。
- 数据结构、配置、事件 payload 或状态机需要固定。
- 验收标准不清，需要先转成可测试条目。
- 无新增功能，但维护、迁移、升级、兼容、回归风险会影响外部行为或验证口径。

不使用本技能：

- 已经有已批准需求文档，且只需要技术方案：使用 `writing-technical-design`。
- 已经有技术方案，需要拆任务：使用 `writing-plans`。
- 只需要测试用例文档：使用 `writing-test-cases`。
- 只记录实际 RED/GREEN/REFACTOR：使用 `test-driven-development` 的 evidence。

## 场景到文档

| 场景 | 文档 | 模板 |
| --- | --- | --- |
| 普通功能、用户流程、可见行为 | `docs/coding-plugins/features/<feature-name>/specs/feature.md` | `templates/feature-spec.md` |
| HTTP/RPC/API/SDK/CLI 契约 | `docs/coding-plugins/features/<feature-name>/specs/api-contract.md` | `templates/api-contract-spec.md` |
| 数据结构、配置、事件 payload | `docs/coding-plugins/features/<feature-name>/specs/schema.md` | `templates/schema-spec.md` |
| 状态、工作流、生命周期 | `docs/coding-plugins/features/<feature-name>/specs/state-machine.md` | `templates/state-machine-spec.md` |
| 验收标准不清 | `docs/coding-plugins/features/<feature-name>/specs/acceptance.md` | `templates/acceptance-criteria.md` |
| 维护、重构、升级、迁移、回归风险 | `docs/coding-plugins/features/<feature-name>/specs/maintenance.md` | `templates/maintenance-spec.md` |

同一 feature 可以有多个需求文档。横跨多个独立能力时，拆成多个 feature，并用 `related_specs` 互链。

## 编写流程

1. 使用 `document-metadata` 读取 feature README 和相关文档 frontmatter。
2. 检索现有需求文档：`docs/coding-plugins/INDEX.md`、feature、tag、Spec ID、相关代码路径。
3. 选择一个或多个需求文档类型；不要为了形式创建不需要的文档。
4. 用对应模板写入 `docs/coding-plugins/features/<feature-name>/specs/<spec-kind>.md`。
5. 补齐 frontmatter：`spec_id`、`title`、`type`、`status`、`feature`、`created`、`updated`、`tags`、`related_code`、`related_specs`。
6. 写正文 `## 文档信息`，保持中文展示；机器 key 不翻译。
7. 为 MUST 需求分配稳定 ID：`REQ/API/SCHEMA/STATE/ERR/AC/NFR/MIG/OBS/NON`。
8. 在 `## 追踪矩阵` 中写验证方式种子，但不写具体测试步骤；测试步骤属于 `writing-test-cases`。
9. 运行规格校验：

```bash
python3 skills/spec-driven-development/scripts/validate_spec.py <SPEC_FILE_PATH>
```

10. 新增、移动、批准或废弃需求文档后运行：

```bash
python3 scripts/preflight.py --write-index
```

## 内容边界

| 应写入需求文档 | 不写入需求文档 |
| --- | --- |
| 目标、非目标、背景、用户或系统目标 | 技术选型和架构决策 |
| 功能需求、契约字段、schema、状态迁移 | 代码文件修改清单 |
| 错误和边界条件 | RED/GREEN/REFACTOR 实际证据 |
| 验收标准和验证方式类型 | 逐条测试用例步骤 |
| Traceability Matrix 种子 | 实现任务拆分 |

## 自审

- 每个 MUST 需求是否有稳定 Spec ID。
- 每个 MUST 需求是否有验证方式。
- 是否没有把技术方案写进需求文档。
- 是否没有把测试用例步骤写进需求文档。
- 是否已链接相关需求、技术设计、计划、证据或代码路径。
- 是否运行 `validate_spec.py` 并修复失败项。
