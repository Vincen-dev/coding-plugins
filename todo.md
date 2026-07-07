# TODO

## 正式发布优化

- [ ] 收紧发布包内容：明确 npm package / plugin artifact 的 allowlist，只发布运行所需的 `dist`、`skills`、manifest、README、LICENSE、安装说明和必要脚本。
- [ ] 排除开发、测试、临时和规划内容：确保 `docs/coding-plugins/features`、测试 fixtures、TODO、未发布草稿、工作区缓存等不会进入用户安装包。
- [ ] 增加安装包洁净度验证：发布前解包检查文件清单，并用新环境安装后的 `doctor` / `preflight` 证明用户看到的是干净、整洁、可运行的插件。
