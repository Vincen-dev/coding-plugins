---
title: 插件 Marketplace 安装入口
status: approved
feature: marketplace
created: 2026-06-29
updated: 2026-06-29
related_specs:
  - docs/coding-plugins/features/marketplace/requirements/marketplace-PRD.md
related_technical:
  - docs/coding-plugins/features/marketplace/technicals/marketplace-TDD.md
related_plans:
  - docs/coding-plugins/features/marketplace/plans/marketplace-IPD.md
---
# 插件 Marketplace 安装入口

## 任务 1： Marketplace 文档闭环回填

### TDD 例外记录

- **原因:** 本任务只回填 `marketplace` 已有能力的技术设计、实现计划和 Evidence 文档，不改变 `.agents/plugins/marketplace.json`、manifest、安装命令或运行时行为，因此没有新的失败测试可先写。
- **用户批准:** 用户要求“好的继续”，承接上一轮“继续补剩余文档闭环缺口”的上下文。
- **替代验证:** `python3 scripts/preflight.py --write-index` PASS；`python3 scripts/preflight.py` PASS；`codex plugin add coding-plugins@personal` 已安装到 `/Users/vincen/.codex/plugins/cache/personal/coding-plugins/0.6.25`；`python3 scripts/prepare_release.py --skip-git-checks --notes-out /tmp/coding-plugins-release-notes.md` 输出 `Release ready: v0.6.25`；`claude plugin validate /Users/vincen/workspace/plugins/coding-plugins --strict` PASS。
- **风险:** 主要风险是文档和真实安装路径漂移；通过 feature index、preflight 文档路径校验、manifest 版本一致性校验和本机 personal 插件安装验证降低风险。
