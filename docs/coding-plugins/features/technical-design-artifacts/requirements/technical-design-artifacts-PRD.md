---
title: 技术设计产物独立维护
type: feature
status: approved
feature: technical-design-artifacts
doc_id: technical-design-artifacts
created: 2026-06-26
updated: 2026-07-02
tags:
  - technical-design
  - architecture
  - traceability
  - workflow
related_code:
  - skills/writing-technicals/SKILL.md
  - skills/writing-technicals/templates/technical-design-document.md
  - skills/writing-plans/SKILL.md
  - scripts/preflight.py
  - scripts/test_preflight.py
  - docs/coding-plugins/INDEX.md
related_specs: []
related_technical:
  - docs/coding-plugins/features/technical-design-artifacts/technicals/technical-design-artifacts-TDD.md
  - docs/coding-plugins/features/technical-design-artifacts/technicals/technical-design-artifacts-TID.md
related_plans:
  - docs/coding-plugins/features/technical-design-artifacts/plans/technical-design-artifacts-IPD.md
related_evidence:
  - docs/coding-plugins/features/technical-design-artifacts/evidences/technical-design-artifacts-TED.md
---

# 技术设计产物独立维护规格

## 目标

将技术实现方案从计划文档中拆出到 feature root 的 `technicals/technical-design-artifacts-TDD.md` 这类按 feature 命名的技术设计文件，并让规格、技术设计、计划和 TDD 证据 形成可检索、可校验的链路。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不强制回填所有历史规格的技术设计文档。 |
| NON-002 | 不让技术设计替代规格或实现计划。 |
| NON-003 | 不引入外部文档生成器或非标准库依赖。 |

## 背景

- 当前行为：技术方案主要写在 `writing-plans` 产出的 `plans/technical-design-artifacts-IPD.md` 这类实现计划中，规格和计划之间没有独立的技术设计产物。
- 目标用户或调用方：插件维护者、后续执行计划的代理、发布前 preflight、GitHub Actions。
- 约束：路径要按 `feature` 检索；新增规则不能破坏没有历史计划文档的现有 feature。

## 功能需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 必须 | 技术设计文档默认保存到 `docs/coding-plugins/features/technical-design-artifacts/technicals/technical-design-artifacts-TDD.md` 这类 feature 分层路径。 | 单元测试 `test_collect_technical_design_files_uses_feature_first_technical_subdir`。 |
| REQ-002 | 必须 | `docs/coding-plugins/INDEX.md` 必须覆盖所有真实技术设计文档。 | 单元测试 `test_artifact_index_requires_technical_paths`。 |
| REQ-003 | 必须 | 总索引 `docs/coding-plugins/INDEX.md` 必须包含 `技术设计` 列，并覆盖真实技术设计文档。 | 单元测试 `test_artifact_index_requires_technical_paths`。 |
| REQ-004 | 必须 | 新增 `writing-technicals` skill，负责把已批准规格转成独立技术设计。 | 行为测试 `test_using_entry_routes_development_intents_to_required_skills`。 |
| REQ-005 | 必须 | `writing-plans` 必须引用 `技术设计来源`，计划只保留方案快照和任务拆分。 | 单元测试 `test_plan_technical_design_source_check_rejects_missing_source`。 |
| REQ-006 | 必须 | preflight 必须校验技术设计路径、metadata、Spec ID 和引用路径。 | 单元测试 `scripts/test_preflight.py`。 |
| REQ-007 | 必须 | Claude Code 显式技能请求清单必须包含 `/coding-plugins:writing-technicals`。 | 行为测试 `test_claude_reference_documents_explicit_namespace_for_each_skill`。 |
| REQ-008 | 必须 | `writing-technicals` 必须声明规格缺口门禁：发现需求、验收、外部行为、错误边界或兼容要求不清时，停止技术设计并回到 spec 更新。 | 单元测试 `test_technical_design_gap_review_requires_section`、`test_technical_design_gap_review_rejects_unresolved_gap`，并由 `python3 scripts/preflight.py` 覆盖真实文档。 |
| REQ-009 | 必须 | technical 模板的正文标题和表头必须使用中文，避免新技术设计继续生成英文章节结构。 | 单元测试 `test_technical_template_check_rejects_english_headings`。 |
| REQ-010 | 必须 | 每份真实 technical 文档必须包含 `## 规格缺口审查`，并明确未覆盖需求、验收标准、外部行为和处理状态。 | 单元测试 `test_technical_design_gap_review_requires_section` 和 `python3 scripts/preflight.py`。 |

## 错误和边界情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 技术设计文档不在 feature 分层路径下，或 metadata 与路径不一致。 | preflight 失败并指出路径和 metadata 不一致。 | 单元测试。 |
| ERR-002 | 规格中的 `related_technical` 指向不存在的文档。 | preflight 失败并指出缺失技术设计引用。 | 单元测试。 |
| ERR-003 | 计划没有 `技术设计来源` 或路径不存在。 | preflight 失败并指出计划缺少技术设计来源。 | 单元测试。 |
| ERR-004 | 技术设计文档引用了对应规格中不存在的 Spec ID。 | preflight 失败并指出未知 Spec ID。 | 单元测试。 |
| ERR-005 | 技术设计文档存在但总索引未记录。 | preflight 失败并指出索引缺失路径。 | 单元测试。 |
| ERR-006 | 技术设计文档缺少 `## 规格缺口审查` 或审查字段不完整。 | preflight 失败并指出缺失章节或字段。 | 单元测试。 |
| ERR-007 | 技术设计文档的规格缺口审查仍包含未处理、待处理、需澄清、不清楚或待确认。 | preflight 失败，阻止进入计划和实现。 | 单元测试。 |
| ERR-008 | technical 模板重新出现英文章节标题或英文表头。 | preflight 失败并指出模板残留的英文结构。 | 单元测试。 |

## 验收标准

| 编号 | 场景 | 前置条件 | 操作 | 期望结果 |
| --- | --- | --- | --- | --- |
| AC-001 | 创建技术设计链路 | 已有批准规格 | 创建 `technicals/technical-design-artifacts-TDD.md` 这类技术设计文件并在规格和计划中引用 | preflight 通过，索引能检索到 Spec、Technical、Plan、证据。 |
| AC-002 | 使用新技能 | 用户要求根据规格写技术方案 | 路由到 `writing-technicals` | 生成独立技术设计文档，而不是把完整技术方案写入计划。 |
| AC-003 | 发布前检查 | 仓库包含 technical 文档和计划 | 运行 `python3 scripts/preflight.py` | 技术设计、规格、计划和 证据 校验全部通过。 |
| AC-004 | 技术设计发现规格缺口 | 编写 technical 时发现需求或验收不清 | 停止技术设计并回到 `spec-driven-development` 更新 spec | technical 不承载新需求，preflight 阻止未处理缺口。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-004 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | 任务 2 | 已覆盖 |
| REQ-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| REQ-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| REQ-007 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | 任务 2 | 已覆盖 |
| REQ-008 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| REQ-009 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| REQ-010 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 2 | 已覆盖 |
| ERR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 1 | 已覆盖 |
| ERR-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| ERR-007 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| ERR-008 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
| AC-001 | 命令验证 | `python3 scripts/preflight.py` | 任务 3 | 已覆盖 |
| AC-002 | 行为测试 | `python3 -m unittest tests.behavior.test_routing` | 任务 2 | 已覆盖 |
| AC-003 | 命令验证 | `python3 scripts/preflight.py` | 任务 3 | 已覆盖 |
| AC-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | 任务 4 | 已覆盖 |
