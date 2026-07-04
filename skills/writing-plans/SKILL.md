---
name: writing-plans
description: 已有批准 PRD、TSD 技术方案文档和 TVD，需要创建或更新 TED 任务执行文档时使用。
---

# 编写 TED

## 总览

TED 是 `Task Execution Document`，中文定位是任务执行文档。它不复述完整技术方案，只把已确认的 PRD、TSD 技术方案文档和 TVD 拆成可执行、可验证、可记录 VED 证据的任务。

**核心原则：**TED 回答“执行者下一步怎么做”。技术方案以 TSD 为准，测试设计以 TVD 为准，文档关系以 frontmatter metadata 为准。

开始时声明：“我正在使用 writing-plans 技能来创建 TED 任务执行文档。”

默认保存到：

```text
docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md
```

每次出现新的执行计划，必须选择新的 `doc_id` 并新建 TED；不得向旧 TED 追加新计划任务。旧 TED 只允许为了修正本计划内的任务、`source_hash` 或执行锁定区而更新。

默认模板：

```text
skills/writing-plans/templates/implementation-plan.md
```

对应 VED 证据默认保存到：

```text
docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
```

## 前置条件

- 已有 approved PRD；否则回到 `spec-driven-development` 和 `writing-requirements`。
- 已有 TSD 技术方案文档；否则先用 `writing-technicals`。
- 已有 TVD；否则先用 `writing-test-cases`。
- 涉及 Coding Plugins 文档关系时，先使用 `document-metadata` 读取 frontmatter，再读正文。
- `feature` 和 `doc_id` 必须和 PRD、TSD、TVD、VED 保持一致。

## 职责边界

| TED 应写 | TED 不写 |
| --- | --- |
| 执行目标、执行入口和任务顺序 | 完整技术方案复述 |
| 每个任务的修改范围、步骤、命令和预期结果 | PRD 需求重定义 |
| Spec ID 到任务、测试和 VED 字段的执行映射 | TSD 的方案取舍细节 |
| RED/GREEN/REFACTOR 执行要求 | 实际 RED/GREEN/REFACTOR 输出 |
| 无法自动测试时的 VED 例外记录要求 | 实际人工验收结果 |

如果执行者需要理解完整方案，只引用 TSD；TED 正文只摘录会影响任务执行顺序、文件范围或验证命令的约束。

## 编写流程

1. 使用 `document-metadata` 读取同一 `doc_id` 的 PRD、TSD、TVD 和 VED frontmatter。
2. 从 PRD 提取必须覆盖的 MUST Spec ID。
3. 从 TSD 提取会影响执行的关键约束，不搬运完整技术方案。
4. 从 TVD 提取每个 Spec ID 对应的测试用例、测试类型、断言和数据。
5. 写 `## 执行简报`，把执行阶段的最小上下文压缩在 TED 内，不创建独立契约文件。
6. 写 `## 任务总览`，每行一个 `TASK-001` 任务，并标注覆盖规格、验证方式和 VED 目标。
7. 为每个任务创建独立章节，标题格式固定为 `## 任务标题（TASK-001 / REQ-001）`。
8. 每个任务必须包含：任务目标、执行前提、修改范围、执行步骤、验证方式、VED 记录要求。
9. 行为变更任务必须要求 RED/GREEN/REFACTOR；无法自动测试时必须要求 VED 例外记录。
10. 运行 `coding-plugins workflow-state hash --feature <feature-name> --doc-id <doc-id>`，把结果写入 TED frontmatter 的 `source_hash`。
11. 在 TED 正文写 `## 执行锁定区`，包含 Intent Lock、Scope Fence、Required Spec IDs、Required Tests、Review Gates 和 Rewind Triggers。
12. 新增或更新 TED 后运行 `npm run preflight -- --write-index`，再运行 `npm run preflight`。

## 文档结构

机器可读 frontmatter 的 key 保持英文稳定；中文展示写入 `## 文档信息`。`related_docs` 是文档关系源，正文不要维护手写产物链路表。

```markdown
---
title: <功能名称> Task Execution Document
status: draft
feature: <feature-name>
doc_id: <doc-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_docs:
  - docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md
  - docs/coding-plugins/features/<feature-name>/technicals/<doc-id>-TSD.md
  - docs/coding-plugins/features/<feature-name>/test-cases/<doc-id>-TVD.md
  - docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md
source_hash: sha256:<由 src/cli/workflow-state.ts hash 生成>
---

# <功能名称>任务执行文档（TED）

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | <feature-name> |
| Doc ID | <doc-id> |
| 文档类型 | TED |
| 缩写含义 | Task Execution Document |
```

`source_hash` 只覆盖上游 PRD、TSD 和 TVD，用来检测 TED 是否落后于已批准上游文档。执行前用：

```bash
coding-plugins workflow-state inspect --feature <feature-name> --doc-id <doc-id> --json
```

如果输出 `state: plan-draft`、`plan-unlocked` 或 `plan-stale`，不得继续执行，先回到 `writing-plans` 批准 TED、补齐 `source_hash`，或刷新 TED。

进入实现前运行执行门禁：

```bash
coding-plugins workflow-guard check --feature <feature-name> --doc-id <doc-id> --target execute --json
```

只有 `pass: true` 才能进入 `using-git-worktrees` 和执行技能。

执行阶段优先生成短上下文：

```bash
coding-plugins workflow-brief --feature <feature-name> --doc-id <doc-id> --target execute --task TASK-001 --json
```

如果 brief 通过，执行者默认只读 TED，并聚焦 `## 执行简报`、`## 执行锁定区`、`## 任务总览` 和当前任务章节；PRD/TSD/TVD 只在 Rewind Triggers 命中或 guard 失败时回读。多任务 TED 必须指定当前 `--task`；未知当前任务时才省略。

## 任务结构

每个任务使用固定章节，避免把多个行为塞进一个大表：

````markdown
## <任务标题>（TASK-001 / REQ-001）

### 任务目标

说明本任务完成后系统应出现什么可观察变化。

### 执行前提

- 已确认需求：PRD 中的相关需求点。
- 已确认设计：TSD 中的相关决策或实现点。
- 已确认测试：TVD 中的相关测试用例。

### 修改范围

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 创建 | `exact/path/to/new_file` | 创建原因和职责 |
| 修改 | `exact/path/to/existing_file` | 修改内容和边界 |
| 测试 | `tests/exact/path/to/test_file` | 覆盖行为或契约 |

### 执行步骤

- [ ] **步骤 1：根据规格 ID 写失败测试**
  - 规格 ID：REQ-001
  - 测试位置：`tests/exact/path/to/test_file`
  - 预期失败：失败来自缺失行为、契约或状态。
- [ ] **步骤 2：运行测试确认 RED**
  - 命令：`node --test tests/exact/path/to/test_file -v`
  - 预期：FAIL，失败信息匹配目标行为缺口。
- [ ] **步骤 3：写最小实现**
  - 修改：`exact/path/to/existing_file`
  - 边界：只实现本任务覆盖的行为。
- [ ] **步骤 4：运行测试确认 GREEN**
  - 命令：`node --test tests/exact/path/to/test_file -v`
  - 预期：PASS。
- [ ] **步骤 5：重构并重跑相关测试**
  - 命令：`node --test tests/exact/path/to/test_file -v`
  - 预期：PASS。
- [ ] **步骤 6：记录 VED 证据**
  - 写入：`docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md`
  - 字段：规格/缺陷/验收、测试类型、RED 测试、RED 命令、RED 失败、GREEN 变更、GREEN 命令、REFACTOR 命令、最终验证。
````

## 自审

- 每个 MUST Spec ID 是否进入 `## 任务总览`。
- 每个任务是否有 `TASK-001` 这类稳定任务 ID。
- 每个任务是否有明确文件路径、测试命令和预期结果。
- 是否没有复述完整 TSD 技术方案文档。
- 是否没有把实际 RED/GREEN/REFACTOR 输出写进 TED。
- 是否指向同一 `doc_id` 的 VED 证据文件。
- 是否写入 `source_hash` 并包含 `## 执行锁定区`。
- 是否运行了 `preflight.ts`。

## 执行交接

保存 TED 后，提供执行选择：

```text
TED 已保存到 docs/coding-plugins/features/<feature-name>/plans/<doc-id>-TED.md。

执行方式：
1. 子代理驱动：使用 subagent-driven-development 按任务派发。
2. 当前会话执行：使用 executing-plans 按检查点执行。
```
