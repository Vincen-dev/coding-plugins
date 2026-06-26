---
name: writing-plans
description: 已有规格或需求、准备开始多步骤任务但尚未写代码时使用。
---

# 编写实现计划

## 总览

写一份全面的实现计划，假设执行者对代码库几乎没有上下文、测试设计判断力一般。计划必须说明每个任务要改哪些文件、写哪些代码、看哪些文档、如何测试，并把 Spec ID 映射到测试和任务。把计划拆成小块任务。坚持 SDD 追踪、DRY、YAGNI、TDD。需要提交时必须使用 `git-commit`，生成中文 Conventional Commit，且禁止 AI 作者。

开始时声明：“我正在使用 writing-plans 技能来创建实现计划。”

如果执行阶段要在隔离 worktree 中进行，应在执行时通过 `using-git-worktrees` 创建。

默认保存到：`docs/coding-plugins/plans/<area>/<capability>/implementation.md`。用户偏好的路径优先。

## 前置条件

- 如果任务有已批准规格，先读取规格文件。
- 如果任务没有规格但属于新功能、契约、schema、状态机或验收标准不清，先使用 `spec-driven-development`。
- 非平凡任务必须有 Spec ID。极小修改可以在计划开头写 1 到 3 条 inline spec，再继续计划。
- 计划路径的 `<area>/<capability>` 应和规格路径保持一致，例如 `specs/auth/login/feature.md` 对应 `plans/auth/login/implementation.md`。

## 范围检查

如果规格覆盖多个独立子系统，本应在 SDD 阶段拆成子项目规格。若尚未拆分，建议拆成多个计划：每个计划都应能独立产出可运行、可测试的软件。

## 文件结构

定义任务前，先列出要创建或修改的文件，并说明每个文件负责什么。这里锁定分解决策。

- 单元要有清晰边界和明确接口。
- 优先小而聚焦的文件，而不是过大的混合文件。
- 会一起变化的文件应放在一起。按职责拆分，而不是机械按技术层拆分。
- 在现有代码库中遵循既有模式。不要单方面重构整个项目；但如果要修改的文件已经臃肿，把局部拆分纳入计划是合理的。

## 技术方案

技术方案写在计划里，不写在规格里。它必须把规格契约转成可执行的工程落点，但不能跳过 TDD 任务拆分。

必须覆盖：

- **Design Summary**：2 到 5 句话说明整体实现方案。
- **Key Decisions**：关键技术决策、原因、代价。
- **Affected Components**：模块、文件、服务或数据结构怎么变。
- **Data Flow / Control Flow**：核心数据流或控制流。
- **Interfaces and Contracts**：内部接口、外部 API、schema、状态机如何落地。
- **Migration / Compatibility**：迁移、兼容、回滚、灰度。
- **Test Strategy**：Spec ID 对应的测试层级和命令。
- **Risks and Mitigations**：实现风险和缓解方案。

如果某项不适用，写 `Not applicable` 并说明原因。不要留空。

## 任务粒度

每一步只做一个动作，通常 2 到 5 分钟：

- 把一个或多个 Spec ID 映射到失败测试。
- 运行测试确认失败。
- 写最小实现让测试通过。
- 运行测试确认通过。
- 如果用户允许或计划要求，使用 `git-commit` 创建中文提交。

## 计划文档头

每个计划必须以类似结构开头：

```markdown
# [Feature Name] Implementation Plan

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:subagent-driven-development`（推荐）或 `coding-plugins:executing-plans` 逐任务实现本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** [一句话说明要构建什么]

**Architecture:** [2-3 句话说明方案]

**Tech Stack:** [关键技术/库]

**Spec Source:** [规格文件路径，或 inline spec]

## Technical Approach

**Design Summary:** [2-5 句话说明整体技术方案]

**Key Decisions:**

| Decision | Rationale | Tradeoff |
| --- | --- | --- |
| [技术决策] | [为什么这么做] | [代价或风险] |

**Affected Components:**

| Component | Change | Related Spec IDs |
| --- | --- | --- |
| `path/to/component` | [改动说明] | REQ-001 |

**Data Flow / Control Flow:** [核心流程，必要时用 Mermaid]

**Interfaces and Contracts:** [内部接口、外部 API、schema、状态机如何落地]

**Migration / Compatibility:** [迁移、兼容、回滚、灰度；不适用则写 Not applicable]

**Test Strategy:** [Spec ID 对应的测试层级和命令]

**Risks and Mitigations:**

| Risk | Mitigation |
| --- | --- |
| [风险] | [缓解方案] |

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | Implementation task |
| --- | --- | --- | --- |
| REQ-001 | `tests/path/test_file.py` | `test_specific_behavior` | Task 1 |

---
```

## 任务结构

每个任务使用精确文件路径、完整代码、命令和预期输出：

````markdown
### Task N: [Component Name]

**Spec IDs:** REQ-001, AC-001

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test from Spec IDs**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

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
- “类似 Task N”而不重复代码。
- 只描述做什么，不展示怎么做。
- 有技术方案标题，但没有关键决策、影响组件、测试策略或风险缓解。
- 引用之前任务没有定义过的类型、函数或方法。

## 自审

写完计划后，对照规格自审：

1. **规格覆盖**：每个规格要求都能指向某个任务吗？列出缺口。
2. **技术方案落地**：方案是否说明关键决策、影响组件、接口契约、迁移兼容、测试策略和风险缓解。
3. **追踪矩阵**：每个 MUST Spec ID 是否映射到测试和任务。
4. **测试来源**：每个失败测试是否来自 Spec ID、bug 复现或明确验收标准。
5. **占位符扫描**：搜索禁止占位符和模糊表达，修复。
6. **类型一致性**：后续任务使用的类型、函数名、属性名是否和前面定义一致。

发现问题就直接修复。如果规格要求没有对应任务，补任务。

## 执行交接

保存计划后，提供执行选择：

> 计划已完成并保存到 `docs/coding-plugins/plans/<area>/<capability>/implementation.md`。有两种执行方式：
>
> 1. **子代理驱动（推荐）**：每个任务派发新子代理，任务之间做评审，迭代更快。
> 2. **当前会话执行**：使用 `executing-plans` 分批执行并设置检查点。
>
> 选择哪一种？

如果选择子代理驱动，必须使用 `subagent-driven-development`。如果选择当前会话执行，必须使用 `executing-plans`。
