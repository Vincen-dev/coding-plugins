# Coding Plugins 产物总索引

本索引用于按 `Area` 和 `Capability` 检索规格、计划和 TDD Evidence。新增、移动、批准、废弃或拆分相关产物时同步更新本文件。

| Area | Capability | Spec | Plan | Evidence | Tags | Updated |
| --- | --- | --- | --- | --- | --- | --- |
| plugin | artifact-index | `docs/coding-plugins/specs/plugin/artifact-index/feature.md` | - | `docs/coding-plugins/evidence/plugin/artifact-index/tdd-evidence.md` | index, retrieval, traceability, preflight | 2026-06-26 |
| plugin | behavior-tests | `docs/coding-plugins/specs/plugin/behavior-tests/feature.md` | - | `docs/coding-plugins/evidence/plugin/behavior-tests/tdd-evidence.md` | testing, routing, hooks, claude-code | 2026-06-26 |
| plugin | marketplace | `docs/coding-plugins/specs/plugin/marketplace/feature.md` | - | - | marketplace, installation, distribution, codex, claude-code | 2026-06-26 |
| plugin | preflight | `docs/coding-plugins/specs/plugin/preflight/feature.md` | - | - | ci, validation, release-gate | 2026-06-26 |
| plugin | preflight-hardening | `docs/coding-plugins/specs/plugin/preflight-hardening/feature.md` | - | `docs/coding-plugins/evidence/plugin/preflight-hardening/tdd-evidence.md` | preflight, validation, manifest, traceability, docs-sync | 2026-06-26 |
| plugin | release-management | `docs/coding-plugins/specs/plugin/release-management/feature.md` | - | `docs/coding-plugins/evidence/plugin/release-management/tdd-evidence.md` | release, version, changelog, automation | 2026-06-26 |
| plugin | session-start-hook | `docs/coding-plugins/specs/plugin/session-start-hook/feature.md` | - | `docs/coding-plugins/evidence/plugin/session-start-hook/tdd-evidence.md` | codex, hook, session-start, bootstrap, workflow | 2026-06-26 |
| plugin | tdd-evidence-path | `docs/coding-plugins/specs/plugin/tdd-evidence-path/feature.md` | - | `docs/coding-plugins/evidence/plugin/tdd-evidence-path/tdd-evidence.md` | tdd, evidence, traceability, validation | 2026-06-26 |

Rules:

- `Area` 和 `Capability` 必须和产物路径一致。
- `Spec` 指向该 capability 的主要规格；有多个规格时在同一个单元格用 `<br>` 分隔。
- `Plan` 指向默认实现计划 `docs/coding-plugins/plans/<area>/<capability>/implementation.md`；没有计划时使用 `-`。
- `Evidence` 指向默认 TDD Evidence `docs/coding-plugins/evidence/<area>/<capability>/tdd-evidence.md`；没有 evidence 时使用 `-`。
- `Tags` 写检索词，不写日期；日期放 `Updated`。
