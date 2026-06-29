# 插件工作链路硬化

## Task 1: 行为场景顺序测试

### TDD Evidence

- **Spec/Bug/AC:** NFR-001 / ERR-001
- **RED test:** `tests.behavior.test_routing::RoutingBehaviorTests.test_workflow_scenarios_document_ordered_skill_chains`
- **RED command:** `python3 -m unittest tests.behavior.test_routing`
- **RED failure:** 测试失败于 `AssertionError: '## 场景链路契约' not found`，说明主链路文档没有机器可读的场景顺序契约。
- **GREEN change:** 在 `docs/workflow-chain.md` 增加 `## 场景链路契约`，覆盖新需求、Bug 修复、直接提交、完成收尾、插件维护和并行任务。
- **GREEN command:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **REFACTOR command:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **Final verification:** `python3 scripts/preflight.py` PASS。

## Task 2: 轻量 feature 文档例外契约

### TDD Evidence

- **Spec/Bug/AC:** NFR-002 / ERR-002
- **RED test:** `scripts.test_preflight.PreflightTests.test_feature_document_chain_requires_plan_or_lightweight_exception`
- **RED command:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py`
- **RED failure:** 测试失败于 `AttributeError: module 'preflight' has no attribute 'check_feature_document_chain_closure'`，说明 preflight 尚未校验 approved feature 的 technical/plan 闭环或轻量例外。
- **GREEN change:** 新增 `check_feature_document_chain_closure()`，要求 approved feature 具备 technical/plan，或在 README 中声明 `## 轻量例外`、`Reason` 和 `Verification`；为历史轻量 feature README 补充例外说明。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **Final verification:** `python3 scripts/preflight.py` PASS。

## Task 3: 远程发布审计脚本

### TDD Evidence

- **Spec/Bug/AC:** NFR-003 / ERR-003 / OBS-001 / MIG-001
- **RED test:** `scripts.test_remote_audit.RemoteAuditTests`
- **RED command:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py`
- **RED failure:** 测试失败于 `ModuleNotFoundError: No module named 'remote_audit'`，且 preflight 命令列表缺少 `scripts/test_remote_audit.py`。
- **GREEN change:** 新增 `scripts/remote_audit.py` 和 `scripts/test_remote_audit.py`，提供 tag、release、直接 push 协作者审计函数和手动 CLI；默认 preflight 只运行单测，不访问网络。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **Final verification:** `python3 scripts/preflight.py` PASS；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.28`。

## Task 4: Claude Code 启动入口提示

### TDD Evidence

- **Spec/Bug/AC:** NFR-004 / ERR-004
- **RED test:** `tests.behavior.test_routing::RoutingBehaviorTests.test_claude_usage_documents_session_start_prompt`
- **RED command:** `python3 -m unittest tests.behavior.test_routing`
- **RED failure:** 测试失败于 `AssertionError: '## 会话启动提示' not found`，说明 Claude Code 使用文档缺少可复制启动入口提示。
- **GREEN change:** 在 `docs/claude-code-usage.md` 和 `skills/using-coding-plugins/references/claude-tools.md` 增加会话启动提示，明确先调用 `/coding-plugins:using-coding-plugins`。
- **GREEN command:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **REFACTOR command:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **Final verification:** `claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。

## Task 5: Validator fixture 样例

### TDD Evidence

- **Spec/Bug/AC:** NFR-005 / ERR-005
- **RED test:** `test_fixture_valid_feature_spec_passes_strict_validation`、`test_fixture_invalid_placeholder_spec_fails_validation`、`test_fixture_valid_tdd_evidence_passes_strict_validation` 和 `test_fixture_invalid_after_the_fact_evidence_fails_validation`
- **RED command:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- **RED failure:** 测试失败于 fixture 文件不存在，说明 validator 回归测试尚未使用真实样例文件。
- **GREEN change:** 新增 SDD/TDD validator 的通过和失败 fixture，并让测试读取这些文件。
- **GREEN command:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` PASS，16 tests。
- **REFACTOR command:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` PASS，16 tests。
- **Final verification:** `python3 scripts/preflight.py` PASS。

## Task 6: 完整验证和安装

### TDD Exception Record

- **Reason:** 本任务是发布前验证、版本同步和本机插件安装，不改变仓库内可测试行为；验证依赖命令输出和插件安装结果。
- **User approval:** 用户要求按优先级执行并已授权完成后直接提交。
- **Alternative verification:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`、`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`、`codex plugin add coding-plugins@personal`、`git diff --check`。
- **Risk:** 远程 GitHub 权限审计仍需维护者在发布时显式运行 `scripts/remote_audit.py`；默认 preflight 不访问网络。
