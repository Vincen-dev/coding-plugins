---
spec_id: plugin-document-metadata-feature
title: 文档元数据规则和技能化
type: feature
status: approved
feature: document-metadata
created: 2026-06-26
updated: 2026-07-01
tags:
  - metadata
  - chinese
  - plan
  - preflight
  - skill
  - template
related_code:
  - scripts/preflight.py
  - scripts/test_preflight.py
  - skills/document-metadata/SKILL.md
  - skills/document-metadata/templates/document-metadata.md
  - skills/writing-plans/SKILL.md
  - skills/writing-technical-design/templates/technical-design.md
related_specs:
  - docs/coding-plugins/features/technical-design-artifacts/requirements/technical-design-artifacts-PRD.md
related_technical:
  - docs/coding-plugins/features/document-metadata/technicals/document-metadata-Technical-Design.md
---

# 文档元数据规则和技能化规格

## 目标

统一 Spec、Technical Design、Plan、README 和 Evidence 的元数据表达：机器可读 frontmatter 保持稳定英文 key，正文提供中文 `文档信息` 摘要；新增 `document-metadata` skill 作为文档 metadata 的操作入口，并用 `document-metadata.md` 模板把各类文档关联起来。

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | document-metadata |
| 规格类型 | feature |
| 技术设计 | `docs/coding-plugins/features/document-metadata/technicals/document-metadata-Technical-Design.md` |

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不把 frontmatter key 改成中文。 |
| NON-002 | 不重写全部历史规格正文。 |
| NON-003 | 不引入 YAML 解析第三方依赖。 |

## 背景

- 当前行为：Spec 和 Technical Design 有 frontmatter，Plan 没有统一 frontmatter；中文读者需要从英文 key 推断文档状态和关联关系。
- 目标用户或调用方：插件维护者、后续代理、preflight、GitHub Actions。
- 约束：机器字段必须继续支持现有 preflight 和 validate_spec；中文展示不应破坏脚本解析。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | Plan 文档必须包含 frontmatter，并声明 `title`、`status`、`feature`、`created`、`updated`。 | 单元测试 `test_plan_metadata_check_rejects_missing_frontmatter`。 |
| REQ-002 | 必须 | Plan frontmatter 的 `feature` 必须与 `features/document-metadata/plans/document-metadata-Implementation-Plan.md` 这类 feature-first 分层路径一致。 | 单元测试 `test_plan_metadata_check_rejects_mismatched_path_metadata`。 |
| REQ-003 | 必须 | Plan 文档必须包含中文 `## 文档信息` 摘要表。 | 单元测试 `test_document_info_check_rejects_missing_chinese_summary`。 |
| REQ-004 | 必须 | Technical Design 模板必须包含中文 `## 文档信息` 摘要表。 | 文档评审和 preflight。 |
| REQ-005 | 必须 | `writing-plans` 计划模板必须包含 frontmatter 和中文 `## 文档信息` 摘要表。 | 文档评审和 preflight。 |
| REQ-006 | 必须 | preflight 必须校验 Plan metadata、路径一致性和中文摘要。 | `python3 scripts/preflight.py`。 |
| REQ-007 | 必须 | 插件必须提供 `document-metadata` skill，明确读取文档时先读 frontmatter metadata，再读正文。 | `python3 -m unittest tests.behavior.test_routing` 和文档评审。 |
| REQ-008 | 必须 | 插件必须提供 `document-metadata.md` 模板，覆盖 README、Spec、Technical、Plan、Evidence 和 Archived evidence 的 metadata 关系。 | 文档评审和 preflight。 |
| REQ-009 | 必须 | 入口技能和 SDD/TDD/Technical/Plan 技能必须把文档关系读取导向 `document-metadata`。 | `python3 -m unittest tests.behavior.test_routing` 和 `rg` 检查。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | Plan 没有 frontmatter。 | preflight 失败并指出缺少 Plan metadata。 | 单元测试。 |
| ERR-002 | Plan metadata 与路径不一致。 | preflight 失败并指出 feature 不一致。 | 单元测试。 |
| ERR-003 | Plan 没有中文 `文档信息` 摘要。 | preflight 失败并指出缺少中文文档信息。 | 单元测试。 |
| ERR-004 | 文档存在机器 frontmatter 但中文摘要缺少状态或 Feature。 | preflight 失败并指出中文文档信息不完整。 | 单元测试。 |
| ERR-005 | 新增 skill 缺少 Codex 展示 metadata。 | preflight 失败并指出缺少 `agents/openai.yaml`。 | `python3 scripts/preflight.py`。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 创建新计划 | 已有 Spec 和 Technical Design | 使用 `writing-plans` 生成 plan | plan 同时包含 frontmatter 和中文 `文档信息`。 |
| AC-002 | 发布前检查 | 仓库存在 plan 文档 | 运行 `python3 scripts/preflight.py` | 缺少 Plan metadata 或中文摘要时失败。 |
| AC-003 | 读取 feature 文档 | 仓库存在 README/spec/technical/plan/evidence | 使用 `document-metadata` | 先根据 frontmatter 和 `related_*` 建立关系，再阅读正文。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| REQ-004 | 文档评审 | `skills/writing-technical-design/templates/technical-design.md` | Task 2 | 已覆盖 |
| REQ-005 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 2 | 已覆盖 |
| REQ-006 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| REQ-007 | 行为测试 / 文档评审 | `python3 -m unittest tests.behavior.test_routing` | Task 4 | 已覆盖 |
| REQ-008 | 文档评审 | `skills/document-metadata/templates/document-metadata.md` | Task 4 | 已覆盖 |
| REQ-009 | 行为测试 / source scan | `python3 -m unittest tests.behavior.test_routing` / `rg "document-metadata" skills docs README.md` | Task 4 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-005 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| AC-001 | 文档评审 | `skills/writing-plans/SKILL.md` | Task 2 | 已覆盖 |
| AC-002 | 命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| AC-003 | 文档评审 | `skills/document-metadata/SKILL.md` | Task 4 | 已覆盖 |
