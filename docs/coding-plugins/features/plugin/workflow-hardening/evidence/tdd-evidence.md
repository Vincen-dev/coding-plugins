# 插件工作链路硬化

## 任务 1： 行为场景顺序测试

### TDD 证据

- **规格/缺陷/验收:** NFR-001 / ERR-001
- **RED 测试:** `tests.behavior.test_routing::RoutingBehaviorTests.test_workflow_scenarios_document_ordered_skill_chains`
- **RED 命令:** `python3 -m unittest tests.behavior.test_routing`
- **RED 失败:** 测试失败于 `AssertionError: '## 场景链路契约' not found`，说明主链路文档没有机器可读的场景顺序契约。
- **GREEN 变更:** 在 `docs/workflow-chain.md` 增加 `## 场景链路契约`，覆盖新需求、Bug 修复、直接提交、完成收尾、插件维护和并行任务。
- **GREEN 命令:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **REFACTOR 命令:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 2： 轻量 feature 文档例外契约

### TDD 证据

- **规格/缺陷/验收:** NFR-002 / ERR-002
- **RED 测试:** `scripts.test_preflight.PreflightTests.test_feature_document_chain_requires_plan_or_lightweight_exception`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py`
- **RED 失败:** 测试失败于 `AttributeError: module 'preflight' has no attribute 'check_feature_document_chain_closure'`，说明 preflight 尚未校验 approved feature 的 technical/plan 闭环或轻量例外。
- **GREEN 变更:** 新增 `check_feature_document_chain_closure()`，要求 approved feature 具备 technical/plan，或在 README 中声明 `## 轻量例外`、`原因` 和 `验证方式`；为历史轻量 feature README 补充例外说明。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 3： 远程发布审计脚本

### TDD 证据

- **规格/缺陷/验收:** NFR-003 / ERR-003 / OBS-001 / MIG-001
- **RED 测试:** `scripts.test_remote_audit.RemoteAuditTests`
- **RED 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py`
- **RED 失败:** 测试失败于 `ModuleNotFoundError: No module named 'remote_audit'`，且 preflight 命令列表缺少 `scripts/test_remote_audit.py`。
- **GREEN 变更:** 新增 `scripts/remote_audit.py` 和 `scripts/test_remote_audit.py`，提供 tag、release、直接 push 协作者审计函数和手动 CLI；默认 preflight 只运行单测，不访问网络。
- **GREEN 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **REFACTOR 命令:** `python3 -m unittest scripts/test_preflight.py scripts/test_remote_audit.py` PASS，52 tests。
- **最终验证:** `python3 scripts/preflight.py` PASS；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.28`。

## 任务 4： Claude Code 启动入口提示

### TDD 证据

- **规格/缺陷/验收:** NFR-004 / ERR-004
- **RED 测试:** `tests.behavior.test_routing::RoutingBehaviorTests.test_claude_usage_documents_session_start_prompt`
- **RED 命令:** `python3 -m unittest tests.behavior.test_routing`
- **RED 失败:** 测试失败于 `AssertionError: '## 会话启动提示' not found`，说明 Claude Code 使用文档缺少可复制启动入口提示。
- **GREEN 变更:** 在 `docs/claude-code-usage.md` 和 `skills/using-coding-plugins/references/claude-tools.md` 增加会话启动提示，明确先调用 `/coding-plugins:using-coding-plugins`。
- **GREEN 命令:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **REFACTOR 命令:** `python3 -m unittest tests.behavior.test_routing` PASS，7 tests。
- **最终验证:** `claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。

## 任务 5： Validator fixture 样例

### TDD 证据

- **规格/缺陷/验收:** NFR-005 / ERR-005
- **RED 测试:** `test_fixture_valid_feature_spec_passes_strict_validation`、`test_fixture_invalid_placeholder_spec_fails_validation`、`test_fixture_valid_tdd_evidence_passes_strict_validation` 和 `test_fixture_invalid_after_the_fact_evidence_fails_validation`
- **RED 命令:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py`
- **RED 失败:** 测试失败于 fixture 文件不存在，说明 validator 回归测试尚未使用真实样例文件。
- **GREEN 变更:** 新增 SDD/TDD validator 的通过和失败 fixture，并让测试读取这些文件。
- **GREEN 命令:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` PASS，16 tests。
- **REFACTOR 命令:** `python3 -m unittest skills/spec-driven-development/scripts/test_validate_spec.py skills/test-driven-development/scripts/test_validate_tdd_evidence.py` PASS，16 tests。
- **最终验证:** `python3 scripts/preflight.py` PASS。

## 任务 6： 完整验证和安装

### TDD 例外记录

- **原因:** 本任务是发布前验证、版本同步和本机插件安装，不改变仓库内可测试行为；验证依赖命令输出和插件安装结果。
- **用户批准:** 用户要求按优先级执行并已授权完成后直接提交。
- **替代验证:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`、`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`、`codex plugin add coding-plugins@personal`、`git diff --check`。
- **风险:** 远程 GitHub 权限审计仍需维护者在发布时显式运行 `scripts/remote_audit.py`；默认 preflight 不访问网络。
