# 插件发布前检查

## Task 1: Preflight 文档闭环回填

### TDD Exception Record

- **Reason:** 本任务只回填 `preflight` 已有能力的技术设计、实现计划和 Evidence 文档，不改变 `scripts/preflight.py`、CI workflow、hook 测试或运行时行为，因此没有新的失败测试可先写。
- **User approval:** 用户要求“好的继续”，承接上一轮“继续补剩余文档闭环缺口”的上下文。
- **Alternative verification:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`。
- **Risk:** 主要风险是文档回填和真实 preflight 行为漂移；通过严格规格校验、TDD Evidence 校验、feature index 一致性校验和完整 preflight 降低风险。

## Task 2: 拆出文档索引模块

### TDD Evidence

- **Spec/Bug/AC:** REQ-007 / REQ-008
- **RED test:** `scripts/test_docs_index.py::DocsIndexTests.test_docs_index_module_exposes_index_contract`、`scripts/test_docs_index.py::DocsIndexTests.test_preflight_delegates_artifact_index_checks_to_docs_index`、`scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps`
- **RED command:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py`
- **RED failure:** `ModuleNotFoundError: No module named 'docs_index'`；同时 `test_build_commands_include_core_validation_steps` 失败，因为 preflight 验证命令还没有包含 `scripts/test_docs_index.py`。
- **GREEN change:** 新增 `scripts/docs_index.py`，把 feature root 收集、索引渲染、索引写入、README 标签读取和索引一致性校验迁出 `scripts/preflight.py`；`preflight.py` 通过导入和 wrapper 保持旧调用方兼容，并把 `scripts/test_docs_index.py` 加入发布前验证命令。
- **GREEN command:** `python3 -m unittest scripts/test_docs_index.py scripts/test_preflight.py` PASS，48 tests。
- **REFACTOR command:** `python3 scripts/preflight.py --write-index` PASS。
- **Final verification:** `python3 scripts/preflight.py --write-index` PASS，包含 `scripts/test_preflight.py` 46 tests、`scripts/test_docs_index.py` 2 tests、bump/release/behavior/spec/evidence/hook 全部校验；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.25`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS；`git diff --check` PASS。
