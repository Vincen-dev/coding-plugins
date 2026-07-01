---
title: 插件行为级测试
status: approved
feature: behavior-tests
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/behavior-tests/requirements/feature.md
---
# 插件行为级测试

## 任务 1： 入口路由和平台行为测试

### TDD 证据

- **规格/缺陷/验收:** REQ-001 / REQ-002 / REQ-003 / REQ-004 / REQ-005 / ERR-001 / ERR-002 / ERR-003 / AC-001 / AC-002
- **RED 测试:** `tests/behavior/test_routing.py::RoutingBehaviorTests.test_claude_reference_documents_explicit_namespace_for_each_skill` 和 `tests/behavior/test_routing.py::RoutingBehaviorTests.test_preflight_runs_behavior_tests`
- **RED 命令:** `python3 -m unittest tests.behavior.test_routing`
- **RED 失败:** 行为测试失败于 Claude 参考文档缺少 `/coding-plugins:git-commit` 这类具体技能名显式请求，以及 preflight 命令列表缺少 `tests.behavior.test_routing`。
- **GREEN 变更:** 新增 `tests/behavior/test_routing.py`，补充 Claude Code 命名空间清单，并让 `scripts/preflight.py` 运行行为测试。
- **GREEN 命令:** `python3 -m unittest tests.behavior.test_routing` PASS
- **REFACTOR 命令:** `python3 -m unittest tests.behavior.test_routing` PASS
- **最终验证:** `python3 scripts/preflight.py` PASS，包含行为测试、hook 测试、规格严格校验和 TDD 证据 严格校验。
