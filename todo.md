# TODO

## Skills 专项优化

- [ ] 拆分 skill 本体说明和门禁规则：`skills/*/SKILL.md` 只保留技能目标、触发条件、执行步骤和必要参考；工作流门禁、DP 检查、发布/提交约束等规则沉到共享 guard、CLI 或专门文档中。
- [ ] 建立 skill 与 guard 的边界检查：新增文档或脚本检查，避免同一条约束同时写在 skill 正文和门禁规则中，减少重复、冲突和维护漂移。
- [ ] 梳理现有 skills 的职责粒度：确认哪些内容属于 agent 操作指导，哪些属于机器可检查规则，形成迁移清单。

## 国际化优化

- [x] 明确中文用户为主的产品定位：默认交互、README/INSTALL 和中文工作流说明继续优先服务中文用户，英文化只针对 agent-facing skill 执行面和跨平台分发面。
- [x] 将对外分发的 skill 内容改为英文，保留中文工作流说明作为本地化文档或单独语言包，避免用户安装后只能阅读中文 skill。
- [x] 统一 skill metadata、触发说明、模板和 prompt 的语言策略：面向模型执行的核心内容优先英文，面向中文用户的入口、示例和使用说明保留中文。
- [x] 增加语言一致性检查，防止英文 skill 中混入未翻译的中文门禁、提示词或错误信息。

状态说明：已通过 `skill-internationalization` 文档链、`tests/ts/i18n-surface.test.mjs` 和 `npm run preflight -- --write-index` 落地。`skills/*/SKILL.md`、`skills/**/*-prompt.md`、`skills/*/agents/openai.yaml` 以及跨平台分发入口默认英文；README/INSTALL、中文文档模板、中文参考与示例、fixtures、validator 字段和中文 routing 作为显式中文用户兼容区保留。

## 正式发布优化

- [ ] 收紧发布包内容：明确 npm package / plugin artifact 的 allowlist，只发布运行所需的 `dist`、`skills`、manifest、README、LICENSE、安装说明和必要脚本。
- [ ] 排除开发、测试、临时和规划内容：确保 `docs/coding-plugins/features`、测试 fixtures、TODO、未发布草稿、工作区缓存等不会进入用户安装包。
- [ ] 增加安装包洁净度验证：发布前解包检查文件清单，并用新环境安装后的 `doctor` / `preflight` 证明用户看到的是干净、整洁、可运行的插件。
