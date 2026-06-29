---
title: 插件发布前检查技术设计
status: approved
area: plugin
capability: preflight
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/plugin/preflight/specs/feature.md
related_evidence:
  - docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md
---

# 插件发布前检查技术设计

## 文档信息

| 字段 | 内容 |
| --- | --- |
| 状态 | 已批准 |
| 领域 | plugin |
| 能力 | preflight |
| 规格 | `docs/coding-plugins/features/plugin/preflight/specs/feature.md` |
| TDD Evidence | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` |

## Design Summary

preflight 是插件仓库的本地发布门禁，入口固定为 `python3 scripts/preflight.py`。它先运行静态结构检查，再调度单元测试、行为测试、hook 测试、严格规格校验和严格 TDD Evidence 校验。文档索引生成和一致性校验独立封装到 `scripts/docs_index.py`，manifest 文件、版本、资源和 hook 配置检查独立封装到 `scripts/manifest_checks.py`，避免发布门禁脚本继续承担所有静态检查细节。GitHub Actions 的 `ci` workflow 复用同一命令，确保本地和远程门禁一致。

## Key Decisions

| Decision | Rationale | Tradeoff |
| --- | --- | --- |
| 单入口 `scripts/preflight.py` | 维护者和 CI 使用同一命令，覆盖 REQ-001、REQ-005、AC-001、AC-002 | 脚本职责较多，后续可能需要拆模块 |
| 独立 `scripts/docs_index.py` | 文档索引渲染、写入和漂移校验是独立职责，拆出后降低 `preflight.py` 膨胀风险 | 需要保留 preflight 的兼容 wrapper，避免现有测试和调用方断裂 |
| 独立 `scripts/manifest_checks.py` | manifest 结构、版本、资源和 Codex hook 配置是独立职责，拆出后便于后续扩展 release 和 marketplace 检查 | 需要通过 preflight wrapper 将模块错误转换为 `PreflightError` |
| 静态检查先于命令调度 | 快速发现 manifest、文档路径、索引和残留入口问题 | 部分规则需要持续维护白名单 |
| 严格校验真实规格和 Evidence | 覆盖 REQ-002、REQ-007，防止示例文档和真实文档标准不一致 | 新增文档时需要同步 metadata 和索引 |
| hook 和行为测试纳入 preflight | 覆盖 REQ-006，避免入口注入和路由测试在发布时被漏跑 | 增加 preflight 执行时间 |

## Affected Components

| Component | Change | Related Spec IDs |
| --- | --- | --- |
| `scripts/preflight.py` | 提供静态检查、索引生成、验证命令构建和主入口 | REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003, AC-001 |
| `scripts/docs_index.py` | 提供 feature root 收集、索引渲染、`--write-index` 写入和索引内容一致性校验 | REQ-007, REQ-008 |
| `scripts/manifest_checks.py` | 提供 manifest 版本、必需文件、Codex hook 和 manifest asset 路径检查 | REQ-003, REQ-009, ERR-003 |
| `scripts/test_preflight.py` | 覆盖 manifest、旧入口残留、索引、metadata、release 和命令构建规则 | REQ-001, REQ-003, REQ-004, REQ-006, REQ-007, ERR-001, ERR-002, ERR-003 |
| `scripts/test_docs_index.py` | 覆盖 docs index 模块边界，确保索引职责不回流到 preflight | REQ-008 |
| `scripts/test_manifest_checks.py` | 覆盖 manifest checks 模块边界，确保 manifest 职责不回流到 preflight | REQ-009 |
| `.github/workflows/ci.yml` | push 和 pull request 时运行 `python3 scripts/preflight.py` | REQ-005, AC-002 |
| `tests/hooks/test-session-start.sh` | 验证 Codex SessionStart hook 配置和 wrapper 行为 | REQ-006 |
| `docs/coding-plugins/INDEX.md` | 由 `--write-index` 生成并由 preflight 校验一致性 | REQ-007 |

## Data Flow / Control Flow

```mermaid
flowchart TD
  A["python3 scripts/preflight.py"] --> B["静态仓库检查"]
  B --> C["构建验证命令列表"]
  C --> D["preflight / bump / release 单元测试"]
  C --> E["行为测试和 hook 测试"]
  C --> F["严格规格校验"]
  C --> G["严格 TDD Evidence 校验"]
  D --> H["Preflight passed"]
  E --> H
  F --> H
  G --> H
```

## Interfaces and Contracts

CLI 契约：

| 命令 | 行为 |
| --- | --- |
| `python3 scripts/preflight.py` | 运行静态检查和全部验证命令，成功时输出 `Preflight passed.` |
| `python3 scripts/preflight.py --write-index` | 先重写 `docs/coding-plugins/INDEX.md`，再执行完整 preflight |

静态检查契约：

| 检查 | 失败行为 |
| --- | --- |
| manifest 文件和版本一致性 | 输出缺失或版本不一致并非零退出 |
| release 管理文件 | 缺少 release notes、版本配置或 release workflow 时失败 |
| feature-first 文档路径和 metadata | area/capability 不一致、索引漂移或旧路径残留时失败 |
| technical design / implementation 引用 | 引用不存在文件或未知 Spec ID 时失败 |
| TDD Evidence | Evidence 中引用未知 Spec ID 或严格校验失败时失败 |

## Migration / Compatibility

preflight 保留无参数入口，兼容本地和 CI 现有用法。`--write-index` 是附加模式，不改变普通检查语义。旧 docs roots、旧入口和旧品牌残留会被拒绝，但 release history 和 feature specs/evidence 中的历史记录允许保留。

## Test Strategy

| Spec ID | Test Strategy |
| --- | --- |
| REQ-001, REQ-003, REQ-004, ERR-001, ERR-002, ERR-003 | `python3 -m unittest scripts/test_preflight.py` |
| REQ-002 | `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/features/plugin/preflight/specs/feature.md` |
| REQ-005, AC-002 | 评审 `.github/workflows/ci.yml`，并由 preflight 文档同步检查覆盖关键命令 |
| REQ-006 | `bash tests/hooks/test-session-start.sh` 和 `test_build_commands_include_core_validation_steps` |
| REQ-007 | `test_artifact_index_requires_generated_content_match` 及索引路径覆盖测试 |
| REQ-009 | `scripts/test_manifest_checks.py` 和 `test_preflight_converts_manifest_check_errors` |
| AC-001 | `python3 scripts/preflight.py` |

TDD Evidence 记录在 `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md`。本轮为历史文档回填，不改变 preflight 行为，因此使用 TDD Exception Record 记录替代验证。

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| `preflight.py` 持续膨胀 | 先拆出 `scripts/docs_index.py` 和 `scripts/manifest_checks.py`，后续如 release 规则继续增长再拆 `scripts/release_checks.py` |
| 新文档加入后忘记刷新索引 | `python3 scripts/preflight.py --write-index` 和生成内容一致性校验 |
| 本地和 CI 门禁不一致 | CI 只调用同一个 `python3 scripts/preflight.py` 命令 |
| 旧路径残留误伤历史记录 | residue scan 只扫描活跃说明、hooks、skills、manifest 和 CI，允许 release history |
