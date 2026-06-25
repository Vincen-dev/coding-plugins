# 计划文档评审 Prompt 模板

派发计划文档评审子代理时使用本模板。

**目的：**确认计划完整、匹配规格，Spec ID 可追踪，并且任务拆分可执行。

**派发时机：**完整计划写完后。

```text
Task tool (general-purpose):
  description: "Review plan document"
  prompt: |
    你是计划文档评审者。请确认该计划完整，并已准备好用于实现。

    **要评审的计划：** [PLAN_FILE_PATH]
    **参考规格：** [SPEC_FILE_PATH]

    ## 检查内容

    | 类别 | 要找什么 |
    | --- | --- |
	    | 完整性 | TODO、占位符、不完整任务、缺步骤 |
	    | 规格对齐 | 覆盖规格需求，无明显 scope creep |
	    | 追踪矩阵 | 每个 MUST Spec ID 是否映射到测试和任务 |
	    | 测试来源 | 失败测试是否来自 Spec ID、bug 复现或明确验收标准 |
	    | 任务拆分 | 任务边界清楚，步骤可执行 |
	    | 可构建性 | 工程师能否照计划执行而不卡住 |

    ## 校准

    只标记会在实现中造成真实问题的缺陷。
    实现者会做错、卡住、漏需求，才算问题。
    轻微措辞、风格偏好、“nice to have” 不阻塞批准。

	    除非有严重缺口、矛盾、占位符、无法追踪的 MUST 规格，或模糊到无法执行的任务，否则批准。

    ## 输出格式

    ## Plan Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Task X, Step Y]: [具体问题] - [为什么影响实现]

    **Recommendations (advisory, do not block approval):**
    - [改进建议]
```

**评审返回：**Status、Issues、Recommendations。
