---
name: writing-plans
description: 已有规格或需求、准备开始多步骤任务但尚未写代码时使用。
---

# 编写实现计划

## 总览

写一份全面的实现计划，假设执行者对代码库几乎没有上下文、测试设计判断力一般。计划必须说明每个任务要改哪些文件、写哪些代码、看哪些文档、如何测试。把计划拆成小块任务。坚持 DRY、YAGNI、TDD。需要提交时必须使用 `git-commit`，生成中文 Conventional Commit，且禁止 AI 作者。

开始时声明：“我正在使用 writing-plans 技能来创建实现计划。”

如果执行阶段要在隔离 worktree 中进行，应在执行时通过 `using-git-worktrees` 创建。

默认保存到：`docs/coding-plugins/plans/YYYY-MM-DD-<feature-name>.md`。用户偏好的路径优先。

## 范围检查

如果规格覆盖多个独立子系统，本应在脑暴阶段拆成子项目规格。若尚未拆分，建议拆成多个计划：每个计划都应能独立产出可运行、可测试的软件。

## 文件结构

定义任务前，先列出要创建或修改的文件，并说明每个文件负责什么。这里锁定分解决策。

- 单元要有清晰边界和明确接口。
- 优先小而聚焦的文件，而不是过大的混合文件。
- 会一起变化的文件应放在一起。按职责拆分，而不是机械按技术层拆分。
- 在现有代码库中遵循既有模式。不要单方面重构整个项目；但如果要修改的文件已经臃肿，把局部拆分纳入计划是合理的。

## 任务粒度

每一步只做一个动作，通常 2 到 5 分钟：

- 写失败测试。
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

---
```

## 任务结构

每个任务使用精确文件路径、完整代码、命令和预期输出：

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

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
- 引用之前任务没有定义过的类型、函数或方法。

## 自审

写完计划后，对照规格自审：

1. **规格覆盖**：每个规格要求都能指向某个任务吗？列出缺口。
2. **占位符扫描**：搜索禁止占位符和模糊表达，修复。
3. **类型一致性**：后续任务使用的类型、函数名、属性名是否和前面定义一致。

发现问题就直接修复。如果规格要求没有对应任务，补任务。

## 执行交接

保存计划后，提供执行选择：

> 计划已完成并保存到 `docs/coding-plugins/plans/<filename>.md`。有两种执行方式：
>
> 1. **子代理驱动（推荐）**：每个任务派发新子代理，任务之间做评审，迭代更快。
> 2. **当前会话执行**：使用 `executing-plans` 分批执行并设置检查点。
>
> 选择哪一种？

如果选择子代理驱动，必须使用 `subagent-driven-development`。如果选择当前会话执行，必须使用 `executing-plans`。
