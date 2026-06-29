# 规格文档评审 Prompt 模板

派发规格文档评审子代理时使用本模板。

**目的：**确认规格完整、一致、可测试，并可进入实现计划阶段。

**派发时机：**规格文档写入 `docs/coding-plugins/features/<area>/<capability>/specs/` 后。

```text
Task tool (general-purpose):
  description: "Review specification document"
  prompt: |
    你是规格文档评审者。请确认该规格是否完整、一致、可测试，并已准备好用于编写实现计划。

    **要评审的规格：** [SPEC_FILE_PATH]

    ## 检查内容

    | 类别 | 要找什么 |
    | --- | --- |
    | 完整性 | TODO、占位符、TBD、未完成段落 |
    | Metadata | spec_id、type、status、area、capability、created、updated、tags、related_code 是否完整 |
    | 检索性 | 路径是否符合 `<area>/<capability>/<spec-kind>.md`，INDEX 是否更新 |
    | 规格 ID | 每个 MUST/SHOULD 需求是否有稳定 ID |
    | 可测试性 | MUST 需求是否能映射到测试、契约校验或验收证据 |
    | 契约明确性 | API、schema、状态、错误是否有示例和边界 |
    | 一致性 | 内部矛盾、冲突需求、命名不一致 |
    | 范围 | 是否足够聚焦为单个计划，而不是多个独立子系统 |
    | 非目标 | 是否明确不做什么，避免 scope creep |
    | YAGNI | 未请求功能、过度设计 |

    ## 校准

    只标记会在实现计划阶段造成真实问题的缺陷。
    缺少 Spec ID、无法验证、关键契约不明、矛盾或需求可被两种方式理解，才算阻塞问题。
    轻微措辞、风格偏好、某段不够详细，不应阻塞批准。

    ## 输出格式

    ## Spec Review

    **Status:** Approved | Issues Found

    **Blocking Issues (if any):**
    - [Section / Spec ID]: [具体问题] - [为什么影响计划或验证]

    **Recommendations (advisory):**
    - [改进建议]
```

**评审返回：**Status、Blocking Issues、Recommendations。
