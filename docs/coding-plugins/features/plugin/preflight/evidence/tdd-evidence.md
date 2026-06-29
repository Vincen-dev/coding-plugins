# 插件发布前检查

## Task 1: Preflight 文档闭环回填

### TDD Exception Record

- **Reason:** 本任务只回填 `preflight` 已有能力的技术设计、实现计划和 Evidence 文档，不改变 `scripts/preflight.py`、CI workflow、hook 测试或运行时行为，因此没有新的失败测试可先写。
- **User approval:** 用户要求“好的继续”，承接上一轮“继续补剩余文档闭环缺口”的上下文。
- **Alternative verification:** `python3 scripts/preflight.py --write-index`、`python3 scripts/preflight.py`、`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict`。
- **Risk:** 主要风险是文档回填和真实 preflight 行为漂移；通过严格规格校验、TDD Evidence 校验、feature index 一致性校验和完整 preflight 降低风险。
