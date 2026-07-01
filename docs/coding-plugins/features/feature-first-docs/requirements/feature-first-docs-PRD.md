---
title: Feature-first 文档结构迁移
type: maintenance
status: approved
feature: feature-first-docs
doc_id: feature-first-docs
created: 2026-06-26
updated: 2026-07-01
tags:
  - docs
  - migration
  - feature-first
  - preflight
related_code:
  - scripts/preflight.py
  - scripts/test_preflight.py
  - skills/spec-driven-development/SKILL.md
  - skills/writing-technicals/SKILL.md
  - skills/writing-plans/SKILL.md
  - skills/test-driven-development/SKILL.md
related_specs:
  - docs/coding-plugins/features/artifact-index/requirements/artifact-index-PRD.md
  - docs/coding-plugins/features/document-metadata/requirements/document-metadata-PRD.md
related_technical:
  - docs/coding-plugins/features/feature-first-docs/technicals/feature-first-docs-TDD.md
related_plans:
  - docs/coding-plugins/features/feature-first-docs/plans/feature-first-docs-IPD.md
related_evidence:
  - docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md
---

# Feature-first 文档结构迁移规格

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| Feature | feature-first-docs |
| 规格类型 | maintenance |
| 技术设计 | `docs/coding-plugins/features/feature-first-docs/technicals/feature-first-docs-TDD.md` |
| 实现计划 | `docs/coding-plugins/features/feature-first-docs/plans/feature-first-docs-IPD.md` |
| TDD 证据 | `docs/coding-plugins/features/feature-first-docs/evidences/feature-first-docs-TED.md` |

## 目标

将 `docs/coding-plugins` 从按产物类型分桶、二级归属和 flat feature-root 混用的结构迁移为严格 feature-first 子目录结构，让同一 feature 的规格、技术设计、实现计划和证据集中维护，降低功能数量增长后的检索和同步成本。

## 非目标

| 编号 | 非目标 |
| --- | --- |
| NON-001 | 不保留旧 `specs/`、`technical/` 目录作为活跃文档路径。 |
| NON-002 | 不改变插件运行时 skill 名称、manifest 格式或 hook 入口。 |
| NON-003 | 不引入第三方 YAML 或 Markdown 解析依赖。 |
| NON-004 | 不在每个 feature 目录内新增或维护局部 `INDEX.md`。 |
| NON-005 | 不新增 `contract/current.md` 或 `contract/ai-ref.md` 模板。 |

## 当前基线

| 编号 | 既有行为或契约 | 证据 |
| --- | --- | --- |
| REQ-001 | 文档当前按产物类型保存到旧四类目录。 | `find docs/coding-plugins -maxdepth 5 -type f`。 |
| REQ-002 | preflight 当前从四类目录收集 spec、technical design、plan 和 TDD evidence。 | `scripts/preflight.py` 的 `collect_*` 函数。 |
| REQ-003 | skill 和模板当前把旧四类目录作为默认落地路径。 | `rg -n "docs/coding-plugins/(specs|technical|plans|evidence)" skills docs README.md scripts tests`。 |

## 维护需求

| 编号 | 优先级 | 需求 | 验证方式 |
| --- | --- | --- | --- |
| NFR-001 | 必须 | 新文档根必须是 `docs/coding-plugins/features/{feature}/`。 | 单元测试 `test_collect_spec_files_uses_feature_first_path`。 |
| NFR-002 | 必须 | 规格必须保存到 `docs/coding-plugins/features/{feature}/requirements/{spec-kind}.md`。 | 单元测试和 `python3 scripts/preflight.py`。 |
| NFR-003 | 必须 | 技术设计必须保存到 `docs/coding-plugins/features/{feature}/technicals/{feature}-TDD.md`。 | 单元测试 `test_collect_technical_design_files_uses_feature_first_technical_subdir`。 |
| NFR-004 | 必须 | 实现计划必须保存到 `docs/coding-plugins/features/{feature}/plans/{feature}-IPD.md`。 | 单元测试 `test_collect_plan_files_uses_feature_first_plans_subdir`。 |
| NFR-005 | 必须 | TDD 证据 必须保存到 `docs/coding-plugins/features/{feature}/evidences/{feature}-TED.md`。 | 单元测试 `test_collect_tdd_evidence_files_uses_feature_first_path`。 |
| NFR-006 | 必须 | 每个 feature root 必须包含 `README.md` 作为该 feature 的人工入口。 | 单元测试 `test_feature_roots_require_readme`。 |
| NFR-010 | 必须 | feature metadata 必须使用 `feature` 表示归属，不得继续要求 `feature`。 | 单元测试 `test_feature_readme_metadata_contract_rejects_missing_frontmatter`、`test_document_path_metadata_check_rejects_mismatched_spec_metadata`。 |
| NFR-011 | 必须 | `docs/coding-plugins/INDEX.md` 是唯一生成式索引；feature 目录内不得新增局部 `INDEX.md`。 | `find docs/coding-plugins/features -name INDEX.md -print` 无输出。 |
| NFR-012 | 必须 | 本次迁移不得新增 `contract/current.md` 或 `contract/ai-ref.md`。 | `find docs/coding-plugins/features -path '*/contract/*' -print` 无输出。 |
| NFR-007 | 必须 | `docs/coding-plugins/INDEX.md` 必须覆盖每个 feature root 和每个真实文档路径。 | 单元测试 `test_artifact_index_requires_feature_root_paths` 和 preflight。 |
| NFR-008 | 必须 | 活跃文档、skill、模板、测试和 README 中不得继续使用旧四类目录作为默认路径。 | 旧路径扫描命令必须无活跃命中。 |
| NFR-009 | 必须 | feature root 下不得裸露 `technical-design-document.md` 或 `implementation.md`；这两个产物必须分别位于 `technicals/` 和 `plans/` 子目录。 | 单元测试 `test_flat_feature_root_technical_and_plan_files_are_rejected`。 |

## 回归和风险情况

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 旧路径下残留活跃文档。 | preflight 失败并指出 legacy docs path。 | 单元测试 `test_legacy_docs_roots_are_rejected`。 |
| ERR-002 | feature root 缺少 README。 | preflight 失败并指出缺失的 feature README。 | 单元测试。 |
| ERR-003 | metadata 的 `feature` 与 feature root 路径不一致。 | preflight 失败并指出 metadata/path mismatch。 | 单元测试。 |
| ERR-004 | plan 或 technical design 引用旧路径。 | preflight 失败或旧路径扫描失败。 | 单元测试和 `rg` 命令。 |
| ERR-005 | Evidence 引用了同 feature 规格中不存在的 Spec ID。 | preflight 失败并指出未知 Spec ID。 | 既有 evidence Spec ID 单元测试。 |
| ERR-006 | feature root 下出现裸露 `technical-design-document.md` 或 `implementation.md`。 | preflight 失败并指出 flat feature root document。 | 单元测试 `test_flat_feature_root_technical_and_plan_files_are_rejected`。 |

## 兼容性或迁移

| 编号 | 要求 | 验证方式 |
| --- | --- | --- |
| MIG-001 | 使用 `git mv` 或等价移动保留历史追踪，将现有文档迁移到 feature-first 路径。 | `git status --short` 显示 rename 或 delete/add 后由 Git 识别。 |
| MIG-002 | 删除旧分类索引，只保留总索引。 | `test_legacy_docs_roots_are_rejected` 和 `python3 scripts/preflight.py`。 |
| MIG-003 | 更新 README、installation、workflow、skills、templates 和测试中的活跃路径说明。 | `rg` 旧路径扫描和 preflight。 |
| MIG-004 | 将已有 flat feature-root 技术设计和实现计划迁移到 `technicals/` 与 `plans/` 子目录。 | `find docs/coding-plugins/features -maxdepth 3 -type f \( -name technical-design-document.md -o -name implementation.md \)` 无结果。 |

## 可观测性

| 编号 | 事件、日志、指标或告警 | 触发时机 |
| --- | --- | --- |
| OBS-001 | `python3 scripts/preflight.py` 输出完整校验命令和失败路径。 | 发布前检查、提交前检查、本地安装前检查。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 测试文件 / 命令 | 计划任务 | 状态 |
| --- | --- | --- | --- | --- |
| NFR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-004 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-005 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-007 | 单元测试和命令验证 | `python3 scripts/preflight.py` | Task 3 | 已覆盖 |
| NFR-008 | 命令验证 | 旧路径扫描命令 | Task 4 | 已覆盖 |
| NFR-009 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-010 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| NFR-011 | 命令验证 | `find docs/coding-plugins/features -name INDEX.md -print` | Task 2 | 已覆盖 |
| NFR-012 | 命令验证 | `find docs/coding-plugins/features -path '*/contract/*' -print` | Task 2 | 已覆盖 |
| ERR-001 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-002 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-003 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| ERR-004 | 命令验证 | 旧路径扫描命令 | Task 4 | 已覆盖 |
| ERR-005 | 单元测试和 preflight | `python3 scripts/preflight.py` | Task 2 | 已覆盖 |
| ERR-006 | 单元测试 | `python3 -m unittest scripts/test_preflight.py` | Task 1 | 已覆盖 |
| MIG-001 | Git 状态检查 | `git status --short` | Task 2 | 已覆盖 |
| MIG-002 | 单元测试和文件检查 | `python3 -m unittest scripts/test_preflight.py` | Task 2 | 已覆盖 |
| MIG-003 | 命令验证 | `python3 scripts/preflight.py` | Task 4 | 已覆盖 |
| MIG-004 | 命令验证 | `find docs/coding-plugins/features -maxdepth 3 -type f \( -name technical-design-document.md -o -name implementation.md \)` | Task 2 | 已覆盖 |
| OBS-001 | 命令验证 | `python3 scripts/preflight.py` | Task 5 | 已覆盖 |
