---
name: writing-plans
description: 已有规格或需求、准备开始多步骤任务但尚未写代码时使用。
---

# 编写实现计划

## 总览

写一份全面的实现计划，假设执行者对代码库几乎没有上下文、测试设计判断力一般。计划必须引用独立技术设计，说明每个任务要改哪些文件、写哪些代码、看哪些文档、如何测试，并把 Spec ID 映射到测试和任务。把计划拆成小块任务。坚持 SDD 追踪、DRY、YAGNI、TDD，并要求执行者回报 TDD 证据。需要提交时必须使用 `git-commit`，生成中文 Conventional Commit，且禁止 AI 作者。

开始时声明：“我正在使用 writing-plans 技能来创建实现计划。”

如果执行阶段要在隔离 worktree 中进行，应在执行时通过 `using-git-worktrees` 创建。

默认保存到：`docs/coding-plugins/features/<feature-name>/plans/implementation.md`。用户偏好的路径优先。

对应 TDD 证据默认保存到：`docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md`。

对应技术设计默认读取：

```text
docs/coding-plugins/features/<feature-name>/technicals/technical-design.md
```

## 前置条件

- 如果任务有已批准规格，先读取规格文件。
- 读取规格、技术设计、README 或 Evidence 时，先使用 `document-metadata`，读 frontmatter metadata，再读正文；关联关系以 `related_*`、README `tags` 和 `docs/coding-plugins/document-contract.md` 为准。
- 如果任务没有规格但属于新功能、契约、schema、状态机或验收标准不清，先使用 `spec-driven-development`。
- 如果任务有已批准规格但没有技术设计，先使用 `writing-technical-design`。
- 如果任务有技术设计但没有测试用例文档，先使用 `writing-test-cases`。
- 非平凡任务必须有 Spec ID。极小修改可以在计划开头写 1 到 3 条 inline spec，再继续计划。
- 计划路径的 `<feature-name>` 应和规格路径保持一致，例如 `features/auth/login/requirements/feature.md` 对应 `features/auth/login/plans/implementation.md`。
- TDD 证据路径的 `<feature-name>` 也应保持一致，例如 `features/auth/login/plans/implementation.md` 对应 `features/auth/login/evidence/tdd-evidence.md`。

## 范围检查

如果规格覆盖多个独立子系统，本应在 SDD 阶段拆成子项目规格。若尚未拆分，建议拆成多个计划：每个计划都应能独立产出可运行、可测试的软件。

## 文件结构

定义任务前，先列出要创建或修改的文件，并说明每个文件负责什么。这里锁定分解决策。

- 单元要有清晰边界和明确接口。
- 优先小而聚焦的文件，而不是过大的混合文件。
- 会一起变化的文件应放在一起。按职责拆分，而不是机械按技术层拆分。
- 在现有代码库中遵循既有模式。不要单方面重构整个项目；但如果要修改的文件已经臃肿，把局部拆分纳入计划是合理的。

## 技术方案

完整技术设计写在 `docs/coding-plugins/features/<feature-name>/technicals/technical-design.md`，计划必须引用它。计划中的技术方案只保留执行所需快照，重点是把设计拆成可测试任务。

必须覆盖：

- **技术设计来源**：真实存在的 `technicals/technical-design.md` 路径。
- **设计快照**：2 到 5 句话说明本计划要执行的方案摘要。
- **关键决策**：只列和任务拆分直接相关的关键技术决策、原因、代价。
- **影响组件**：模块、文件、服务或数据结构怎么变。
- **数据流 / 控制流**：核心数据流或控制流。
- **接口和契约**：内部接口、外部 API、schema、状态机如何落地。
- **迁移 / 兼容性**：迁移、兼容、回滚、灰度。
- **测试策略**：Spec ID 对应的测试层级、RED/GREEN 命令和 TDD 证据记录方式。
- **风险和缓解**：实现风险和缓解方案。

如果某项不适用，写 `不适用` 并说明原因。不要留空。

## 任务粒度

每一步只做一个动作，通常 2 到 5 分钟：

- 把一个或多个 Spec ID 映射到失败测试。
- 运行测试确认失败。
- 写最小实现让测试通过。
- 运行测试确认通过。
- 重构并重跑相关测试。
- 记录 TDD 证据。
- 如果用户允许或计划要求，使用 `git-commit` 创建中文提交。

## 计划文档头

每个计划必须以类似结构开头：

机器可读 frontmatter 的 key 保持英文稳定；中文展示写在 `## 文档信息` 表中。不要把 frontmatter key 改成中文。需要通用 metadata 模板时使用 `skills/document-metadata/templates/document-metadata.md`。`related_*` 是计划文档的关系源；正文中的 `技术设计来源` 是执行入口，不要额外维护手写产物链路表。

```markdown
---
title: [功能名称]实现计划
status: draft
feature: [feature]
created: YYYY-MM-DD
updated: YYYY-MM-DD
related_specs:
  - docs/coding-plugins/features/[feature]/requirements/feature.md
related_technical:
  - docs/coding-plugins/features/[feature]/technicals/technical-design.md
related_test_cases:
  - docs/coding-plugins/features/[feature]/test-cases/test-cases.md
related_evidence:
  - docs/coding-plugins/features/[feature]/evidence/tdd-evidence.md
---

# [功能名称]实现计划

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 草稿 |
| Feature | [feature] |
| 需求文档 | `docs/coding-plugins/features/[feature]/requirements/feature.md` |
| 技术设计 | `docs/coding-plugins/features/[feature]/technicals/technical-design.md` |
| 测试用例 | `docs/coding-plugins/features/[feature]/test-cases/test-cases.md` |
| TDD 证据| `docs/coding-plugins/features/[feature]/evidence/tdd-evidence.md` |

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:subagent-driven-development`（推荐）或 `coding-plugins:executing-plans` 逐任务实现本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**目标:** [一句话说明要构建什么]

**架构:** [2-3 句话说明方案]

**技术栈:** [关键技术/库]

**规格来源:** [规格文件路径，或 inline spec]

**技术设计来源:** [技术设计文件路径]

## 技术设计快照

**设计摘要:** [2-5 句话说明本计划执行的技术设计摘要]

**关键决策:**

| 决策 | 原因 | 取舍 |
| --- | --- | --- |
| [技术决策] | [为什么这么做] | [代价或风险] |

**影响组件:**

| 组件 | 变更 | 相关规格 ID |
| --- | --- | --- |
| `path/to/component` | [改动说明] | REQ-001 |

**数据流 / 控制流:** [核心流程，必要时用 Mermaid]

**接口和契约:** [内部接口、外部 API、schema、状态机如何落地]

**迁移 / 兼容性:** [迁移、兼容、回滚、灰度；不适用则写 不适用]

**测试策略:** [Spec ID 对应的测试层级、RED/GREEN 命令和 TDD 证据记录方式]

**TDD 证据目标:** `docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md`

**风险和缓解:**

| 风险 | 缓解方案 |
| --- | --- |
| [风险] | [缓解方案] |

## 规格追踪

| 规格 ID | 测试文件 / 命令 | 测试名称或断言 | TDD 证据文件 / 字段 | 实现任务 |
| --- | --- | --- | --- | --- |
| REQ-001 | `tests/path/test_file.py` | `test_specific_behavior` | `docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md` / RED-GREEN-最终验证 | 任务 1 |

---
```

## 任务结构

每个任务使用精确文件路径、完整代码、命令和预期输出：

````markdown
### 任务 N：[组件名称]

**规格 ID:** REQ-001, AC-001

**文件:**
- 创建: `exact/path/to/file.py`
- 修改: `exact/path/to/existing.py:123-145`
- 测试: `tests/exact/path/to/test.py`

- [ ] **步骤 1：根据规格 ID 写失败测试**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **步骤 2：运行测试确认失败**

运行: `pytest tests/path/test.py::test_name -v`
预期: FAIL with "function not defined"

- [ ] **步骤 3：RED 后写最小实现**

此片段只是步骤 2 按预期失败后可使用的最小实现草图。

```python
def function(input):
    return expected
```

- [ ] **步骤 4：运行测试确认通过**

运行: `pytest tests/path/test.py::test_name -v`
预期: PASS

- [ ] **步骤 5：重构并重跑相关测试**

运行: `pytest tests/path/test.py -v`
预期: PASS

- [ ] **步骤 6：记录 TDD 证据**

写入或更新 `docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md`。生成真实计划时，把每个方括号占位内容替换成该任务的具体预期证据：

```markdown
## 任务 N：[组件名称]

### TDD 证据

- **规格/缺陷/验收:** REQ-001
- **RED 测试:** `tests/path/test.py::test_name`
- **RED 命令:** `pytest tests/path/test.py::test_name -v`
- **RED 失败:** [预期失败摘要]
- **GREEN 变更:** [最小实现摘要]
- **GREEN 命令:** `pytest tests/path/test.py::test_name -v`
- **REFACTOR 命令:** `pytest tests/path/test.py -v`
- **最终验证:** [最终命令和结果]
```

校验证据：

```bash
python3 skills/test-driven-development/scripts/validate_tdd_evidence.py --strict docs/coding-plugins/features/<feature-name>/evidence/tdd-evidence.md
```

- [ ] **步骤 7：提交**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat(scope): 增加具体功能"
```
````

## 禁止占位符

以下都是计划失败，不能出现：

- `TBD`、`TODO`、`implement later`、`fill in details`。
- “添加适当错误处理”“处理边界情况”但不给具体代码。
- “为上述内容写测试”但不给实际测试代码。
- “类似 任务 N”而不重复代码。
- 只描述做什么，不展示怎么做。
- 有技术方案标题，但没有关键决策、影响组件、测试策略或风险缓解。
- 引用之前任务没有定义过的类型、函数或方法。

## 自审

写完计划后，对照规格自审：

1. **规格覆盖**：每个规格要求都能指向某个任务吗？列出缺口。
2. **技术方案落地**：方案是否说明关键决策、影响组件、接口契约、迁移兼容、测试策略和风险缓解。
3. **追踪矩阵**：每个 MUST Spec ID 是否映射到测试和任务。
4. **TDD 证据**：每个会改变行为的任务是否要求写入固定 evidence 文件，并记录 RED/GREEN/REFACTOR Evidence。
5. **测试来源**：每个失败测试是否来自 Spec ID、bug 复现或明确验收标准。
6. **占位符扫描**：搜索禁止占位符和模糊表达，修复。
7. **类型一致性**：后续任务使用的类型、函数名、属性名是否和前面定义一致。

发现问题就直接修复。如果规格要求没有对应任务，补任务。

## 执行交接

保存计划后，提供执行选择：

> 计划已完成并保存到 `docs/coding-plugins/features/<feature-name>/plans/implementation.md`。有两种执行方式：
>
> 1. **子代理驱动（推荐）**：每个任务派发新子代理，任务之间做评审，迭代更快。
> 2. **当前会话执行**：使用 `executing-plans` 分批执行并设置检查点。
>
> 选择哪一种？

如果选择子代理驱动，必须使用 `subagent-driven-development`。如果选择当前会话执行，必须使用 `executing-plans`。
