# Release Notes

## 0.6.26 - 2026-06-29

- 回填 marketplace 规格中已完成验收项的追踪状态和验证证据。
- 更新 artifact-index 技术设计，明确文档索引职责已迁移到 `scripts/docs_index.py`。
- 清理过期的 `preflight.py` 膨胀风险描述，改为固定 docs index 模块边界。

## 0.6.25 - 2026-06-29

- 拆出 `scripts/docs_index.py`，统一承接 feature-first 文档索引生成、写入和一致性校验。
- 将 `scripts/test_docs_index.py` 纳入 preflight 验证链路，防止索引职责回流到 `scripts/preflight.py`。
- 回填 active specs 的完成状态，并记录 preflight 模块拆分的 TDD Evidence。

## 0.6.24 - 2026-06-29

- 将 feature-first 技术设计和实现计划从 feature root 裸文件迁移到 `technical/technical-design.md` 与 `plans/implementation.md`。
- 增强 preflight，拒绝 feature root 下裸露的 `technical-design.md` 和 `implementation.md`，并更新总索引生成规则。
- 同步更新规格、技术设计、实现计划、TDD Evidence、技能模板和链路文档中的新路径契约。

## 0.6.23 - 2026-06-29

- 补齐 `marketplace` feature 的技术设计、实现计划和 TDD Exception Evidence。
- 补齐 `preflight` feature 的技术设计、实现计划和 TDD Exception Evidence。
- 刷新 feature-first 总索引，使 marketplace 和 preflight 都进入完整文档闭环。

## 0.6.22 - 2026-06-29

- 增加 `scripts/prepare_release.py`，用于校验 release metadata、生成类似 `v0.6.22` 的 tag 名并提取当前版本 release notes。
- 增加 `.github/workflows/release.yml`，在 `v*` tag push 后运行 preflight、校验 tag 与 manifest 版本一致，并创建 GitHub Release。
- 补齐 `release-management` 的技术设计、实现计划和 TDD Evidence，并让 preflight 校验 release automation 文件。

## 0.6.21 - 2026-06-29

- 修正 Codex SessionStart hook 中的 TDD Evidence 路径，统一为 feature-first 路径。
- 移除 worktree 和分支收尾技能中的旧品牌兼容路径说明。
- 增强 preflight，拦截活跃入口、hooks、skills 和文档中的旧路径、旧入口和旧品牌残留。

## 0.6.20 - 2026-06-29

- 增加生成式 `docs/coding-plugins/INDEX.md`，通过 `python3 scripts/preflight.py --write-index` 根据 feature-first 文件树刷新总索引。
- 增强 preflight，校验当前总索引和生成器输出完全一致，防止人工编辑造成索引漂移。
- 补齐 `artifact-index` 的技术设计、实现计划和 TDD Evidence，记录 RED/GREEN/REFACTOR 证据。

## 0.6.19 - 2026-06-26

- 将 `docs/coding-plugins` 迁移为 feature-first 结构，按 `features/<area>/<capability>` 集中维护规格、技术设计、计划和 TDD Evidence。
- 重建总索引，删除旧分类索引，并为每个 feature root 增加 README 入口。
- 增强 preflight，校验 feature root、README、metadata、旧路径残留和 feature-first Evidence。

## 0.6.18 - 2026-06-26

- 为 Plan 文档增加 frontmatter 和中文 `文档信息` 摘要。
- 更新 Spec、Technical Design 和 Plan 模板，明确机器 metadata key 保持英文、中文摘要用于阅读。
- 增强 preflight，校验 Plan metadata、路径一致性和中文摘要。

## 0.6.17 - 2026-06-26

- 增加 `writing-technical-design` skill，将技术实现方案独立维护到 `docs/coding-plugins/technical/`。
- 总索引增加 `Technical` 列，并新增 `docs/coding-plugins/technical/INDEX.md` 专用索引。
- 增强 preflight，校验 technical 文档路径、metadata、Spec/Plan 引用和 Spec ID 追踪。

## 0.6.16 - 2026-06-26

- 增强 preflight，校验 skill metadata、manifest 资源、文档路径、Evidence Spec ID、release notes 和版本配置一致性。
- 增加 `RELEASE-NOTES.md`、`.version-bump.json` 和 `scripts/bump_version.py`，支持可重复的版本提升流程。
- 增加入口路由、显式 skill 请求、Claude 命名空间和 SessionStart hook 输出的行为级测试。

## 0.6.15 - 2026-06-26

- 增加 Codex SessionStart hook，在新建、恢复和清空会话时注入 `coding-plugins:using-coding-plugins` 入口规则。
- 增加 `docs/coding-plugins/INDEX.md` 产物总索引，统一检索规格、计划和 TDD Evidence。

## 0.6.14 - 2026-06-26

- 为 Codex 接入 SessionStart hook 基础链路。
- 同步 Claude manifest 版本。

## 0.6.13 - 2026-06-26

- 固定 TDD Evidence 默认落地路径为 `docs/coding-plugins/evidence/<area>/<capability>/tdd-evidence.md`。
- preflight 自动严格校验 TDD Evidence 文件。
