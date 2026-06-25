# 规格文档评审 Prompt 模板

派发规格文档评审子代理时使用本模板。

**目的：**确认规格完整、一致，并可进入实现计划阶段。

**派发时机：**规格文档写入 `docs/coding-plugins/specs/` 后。

```text
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    你是规格文档评审者。请确认该规格是否完整，并已准备好用于编写实现计划。

    **要评审的规格：** [SPEC_FILE_PATH]

    ## 检查内容

    | 类别 | 要找什么 |
    | --- | --- |
    | 完整性 | TODO、占位符、TBD、未完成段落 |
    | 一致性 | 内部矛盾、冲突需求 |
    | 清晰性 | 模糊到可能让实现者做错的需求 |
    | 范围 | 是否足够聚焦为单个计划，而不是多个独立子系统 |
    | YAGNI | 未请求功能、过度设计 |

    ## 校准

    只标记会在实现计划阶段造成真实问题的缺陷。
    缺少关键部分、矛盾、或需求可被两种方式理解，才算问题。
    轻微措辞、风格偏好、某段不够详细，不应阻塞批准。

    除非存在会导致错误计划的严重缺口，否则批准。

    ## 输出格式

    ## Spec Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Section X]: [具体问题] - [为什么影响计划]

    **Recommendations (advisory, do not block approval):**
    - [改进建议]
```

**评审返回：**Status、Issues、Recommendations。
