---
title: 生成文档中文化证据
change_id: chinese-generated-documents
updated: 2026-07-11
---

# 生成文档中文化证据

## 测试驱动证据

- 契约来源：`change.md` 中的 VC-001 至 VC-003。
- 测试类型：source-scan 与文档契约测试。
- RED 测试与命令：`node --test tests/ts/workflow-chinese-documents.test.mjs`。
- RED 失败：首次运行 3/3 失败，分别证明模板为英文、Skill 未声明中文规则、现有 Capsule 有英文标题；扩展扫描后第二轮 2/3 失败，证明仍有重复英文模板和英文 evidence/Quick 标签。
- GREEN 变更与命令：中文化五个模板、现有 Capsule 和文档入口，增加语言边界，删除重复模板并中文化生成示例；focused 中文契约测试 3/3 通过。
- REFACTOR 命令：更新关联契约测试后运行 `npm test`。

## 最终验证

- 命令或检查：`npm test`、`git diff --check`、模板唯一性清单、英文默认标题扫描、YAML/JSON 解析。
- 结果：25/25 测试通过，diff 检查通过，仅保留五个中文 Change Capsule 模板，英文默认标题零匹配，YAML/JSON 解析成功。
- 覆盖范围：五个模板、`change-capsule`、TDD evidence 示例、Quick completion report、所有活跃 Capsule 和维护测试清单。

## 剩余风险

- 稳定机器字段、`VC-*`、路径、命令、代码和 API 名称按设计保留英文。
- 外部 artifact location 中的既有文档不由本仓库自动改写。
