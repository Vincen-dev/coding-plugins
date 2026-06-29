# Coding Plugins Feature 索引

本索引用于按 `Area` 和 `Capability` 检索 feature-first 文档链路。运行 `python3 scripts/preflight.py --write-index` 可根据 feature root 重新生成本文件。

| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| plugin | artifact-index | `docs/coding-plugins/features/plugin/artifact-index` | `docs/coding-plugins/features/plugin/artifact-index/specs/feature.md` | `docs/coding-plugins/features/plugin/artifact-index/technical-design.md` | `docs/coding-plugins/features/plugin/artifact-index/implementation.md` | `docs/coding-plugins/features/plugin/artifact-index/evidence/tdd-evidence.md` | index, retrieval, traceability, preflight | 2026-06-29 |
| plugin | behavior-tests | `docs/coding-plugins/features/plugin/behavior-tests` | `docs/coding-plugins/features/plugin/behavior-tests/specs/feature.md` | - | - | `docs/coding-plugins/features/plugin/behavior-tests/evidence/tdd-evidence.md` | testing, routing, hooks, claude-code | 2026-06-26 |
| plugin | document-metadata | `docs/coding-plugins/features/plugin/document-metadata` | `docs/coding-plugins/features/plugin/document-metadata/specs/feature.md` | `docs/coding-plugins/features/plugin/document-metadata/technical-design.md` | `docs/coding-plugins/features/plugin/document-metadata/implementation.md` | `docs/coding-plugins/features/plugin/document-metadata/evidence/tdd-evidence.md` | metadata, chinese, plan, preflight | 2026-06-26 |
| plugin | feature-first-docs | `docs/coding-plugins/features/plugin/feature-first-docs` | `docs/coding-plugins/features/plugin/feature-first-docs/specs/maintenance.md` | `docs/coding-plugins/features/plugin/feature-first-docs/technical-design.md` | `docs/coding-plugins/features/plugin/feature-first-docs/implementation.md` | `docs/coding-plugins/features/plugin/feature-first-docs/evidence/tdd-evidence.md` | docs, migration, feature-first, preflight | 2026-06-26 |
| plugin | marketplace | `docs/coding-plugins/features/plugin/marketplace` | `docs/coding-plugins/features/plugin/marketplace/specs/feature.md` | `docs/coding-plugins/features/plugin/marketplace/technical-design.md` | `docs/coding-plugins/features/plugin/marketplace/implementation.md` | `docs/coding-plugins/features/plugin/marketplace/evidence/tdd-evidence.md` | marketplace, installation, distribution, codex, claude-code | 2026-06-29 |
| plugin | preflight | `docs/coding-plugins/features/plugin/preflight` | `docs/coding-plugins/features/plugin/preflight/specs/feature.md` | `docs/coding-plugins/features/plugin/preflight/technical-design.md` | `docs/coding-plugins/features/plugin/preflight/implementation.md` | `docs/coding-plugins/features/plugin/preflight/evidence/tdd-evidence.md` | ci, validation, release-gate | 2026-06-29 |
| plugin | preflight-hardening | `docs/coding-plugins/features/plugin/preflight-hardening` | `docs/coding-plugins/features/plugin/preflight-hardening/specs/feature.md` | - | - | `docs/coding-plugins/features/plugin/preflight-hardening/evidence/tdd-evidence.md` | preflight, validation, manifest, traceability, docs-sync | 2026-06-29 |
| plugin | release-management | `docs/coding-plugins/features/plugin/release-management` | `docs/coding-plugins/features/plugin/release-management/specs/feature.md` | `docs/coding-plugins/features/plugin/release-management/technical-design.md` | `docs/coding-plugins/features/plugin/release-management/implementation.md` | `docs/coding-plugins/features/plugin/release-management/evidence/tdd-evidence.md` | release, version, changelog, automation | 2026-06-29 |
| plugin | session-start-hook | `docs/coding-plugins/features/plugin/session-start-hook` | `docs/coding-plugins/features/plugin/session-start-hook/specs/feature.md` | - | - | `docs/coding-plugins/features/plugin/session-start-hook/evidence/tdd-evidence.md` | codex, hook, session-start, bootstrap, workflow | 2026-06-29 |
| plugin | tdd-evidence-path | `docs/coding-plugins/features/plugin/tdd-evidence-path` | `docs/coding-plugins/features/plugin/tdd-evidence-path/specs/feature.md` | - | - | `docs/coding-plugins/features/plugin/tdd-evidence-path/evidence/tdd-evidence.md` | tdd, evidence, traceability, validation | 2026-06-26 |
| plugin | technical-design-artifacts | `docs/coding-plugins/features/plugin/technical-design-artifacts` | `docs/coding-plugins/features/plugin/technical-design-artifacts/specs/feature.md` | `docs/coding-plugins/features/plugin/technical-design-artifacts/technical-design.md` | `docs/coding-plugins/features/plugin/technical-design-artifacts/implementation.md` | `docs/coding-plugins/features/plugin/technical-design-artifacts/evidence/tdd-evidence.md` | technical-design, architecture, traceability, workflow | 2026-06-26 |

Rules:

- `Area` 和 `Capability` 必须和 `Feature Root` 路径一致。
- `Feature Root` 指向 `docs/coding-plugins/features/<area>/<capability>`。
- `Spec` 指向该 capability 的规格文件；有多个规格时在同一个单元格用 `<br>` 分隔。
- `Technical Design` 指向默认技术设计 `docs/coding-plugins/features/<area>/<capability>/technical-design.md`；没有技术设计时使用 `-`。
- `Implementation Plan` 指向默认实现计划 `docs/coding-plugins/features/<area>/<capability>/implementation.md`；没有计划时使用 `-`。
- `Evidence` 指向该 capability 的 evidence 文件；有多个 evidence 时在同一个单元格用 `<br>` 分隔；没有 evidence 时使用 `-`。
- `Tags` 来自 feature README 的 `标签` 行；日期来自规格、技术设计或计划 frontmatter 的最大 `updated` 值。
