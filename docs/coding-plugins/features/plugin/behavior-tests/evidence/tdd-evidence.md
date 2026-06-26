# 插件行为级测试

## Task 1: 入口路由和平台行为测试

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003 / AC-001 / AC-002
- **RED test:** `tests/behavior/test_routing.py::RoutingBehaviorTests.test_claude_reference_documents_explicit_namespace_for_each_skill` 和 `tests/behavior/test_routing.py::RoutingBehaviorTests.test_preflight_runs_behavior_tests`
- **RED command:** `python3 -m unittest tests.behavior.test_routing`
- **RED failure:** 行为测试失败于 Claude 参考文档缺少 `/coding-plugins:git-commit` 这类具体技能名显式请求，以及 preflight 命令列表缺少 `tests.behavior.test_routing`。
- **GREEN change:** 新增 `tests/behavior/test_routing.py`，补充 Claude Code 命名空间清单，并让 `scripts/preflight.py` 运行行为测试。
- **GREEN command:** `python3 -m unittest tests.behavior.test_routing` PASS
- **REFACTOR command:** `python3 -m unittest tests.behavior.test_routing` PASS
- **Final verification:** `python3 scripts/preflight.py` PASS，包含行为测试、hook 测试、规格严格校验和 TDD Evidence 严格校验。
