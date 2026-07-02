# Spec Review Checklist

自审时逐项检查：

- 没有 TBD、TODO、占位符、未完成段落。
- metadata 已填写，包含 title、type、status、feature、doc_id、created、updated、tags、related_code。
- 文件路径符合 `docs/coding-plugins/features/<feature-name>/requirements/<doc-id>-PRD.md`，并与 metadata 的 feature、doc_id、type 一致。
- `docs/coding-plugins/INDEX.md` 已包含或更新该规格。
- 每个 MUST/SHOULD 需求都有 Spec ID。
- 每个 MUST 都有验证方式。
- 外部契约有请求/响应、schema、状态迁移或错误示例。
- 成功路径、失败路径、边界条件都被覆盖。
- 非目标明确，能阻止 scope creep。
- 术语、字段名、状态名和错误名一致。
- 没有“适当”“友好”“常见情况”“尽快”等不可验证表达。
- 规格规模适合一个 IPD 任务执行文档；否则拆成多个 spec。
- Traceability Matrix 覆盖所有 MUST。
