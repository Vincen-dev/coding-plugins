---
title: Skills 专项优化边界清单
status: draft
feature: skills-optimization
doc_id: skills-optimization
created: 2026-07-07
updated: 2026-07-07
tags:
  - skills-optimization
  - skills
  - guards
related_docs:
  - docs/coding-plugins/features/skills-optimization/requirements/skills-optimization-PRD.md
  - docs/coding-plugins/features/skills-optimization/technicals/skills-optimization-TSD.md
  - docs/coding-plugins/features/skills-optimization/test-cases/skills-optimization-TVD.md
  - docs/coding-plugins/features/skills-optimization/plans/skills-optimization-TED.md
  - docs/coding-plugins/features/skills-optimization/evidences/skills-optimization-VED.md
---

# Skills 专项优化边界清单

## 阅读摘要

- **本文结论:** `SKILL.md` 只承载 agent guidance；可机器判定的 workflow、commit、release、scope、artifact 和 source_hash 规则以 CLI guard、测试或共享模块为权威来源。
- **当前状态:** 第一批 high-risk skill 文案收敛已完成，作为后续分批审查的基线清单。
- **先读重点:** 先看字段说明和 inventory 表格；后续修改 skill 文案时只按 `migration_action` 执行。

## 字段说明

- `skill`: `skills/{name}/SKILL.md` 的目录名。
- `primary_role`: skill 的主职责分类。
- `agent_guidance`: skill 正文应该保留的 agent 操作指导。
- `guard_authority`: 机器门禁或可执行规则的权威来源。
- `duplication_risk`: 当前重复风险判断。
- `migration_action`: 本轮或后续迁移动作。
- `verification`: 对应验证命令或人工审查口径。

## Inventory

| skill | primary_role | agent_guidance | guard_authority | duplication_risk | migration_action | verification |
| --- | --- | --- | --- | --- | --- | --- |
| brainstorming | routing | Pre-SDD exploration flow and decision handoff. | Formal chain entry uses task status and DP-0. | low | Keep as guidance; no first-batch text migration. | routing review |
| dispatching-parallel-agents | execution | Decide when independent tasks can be split and dispatched. | Subagent prompt and execution contracts remain in CLI and tests. | low | Keep as guidance; no first-batch text migration. | scenario routing tests |
| document-metadata | documentation | Explain frontmatter reading order and metadata maintenance. | Document schema and metadata sync live in src/lib/documents and validators. | medium | Preserve metadata guidance; avoid duplicating schema internals in future edits. | document-metadata tests |
| executing-plans | execution | Execute an approved TED checkpoint by checkpoint. | workflow-guard and workflow-brief are execution authorities. | medium | Keep command entry; avoid expanding workflow state internals. | workflow-guard check |
| finishing-a-development-branch | finishing | Guide merge, PR, keep, and cleanup decisions after implementation. | Release and branch completion gates live in release guard, dp audit, and git commands. | medium | Reviewed; commit author detail delegated to git-commit and commit-guard. | productization CLI tests |
| git-commit | commit | Prepare intentional Conventional Commits and inspect staged scope. | commit-guard and DP-7 own language, sensitive file, and author checks. | high | First-batch migrated; commit-guard is the author and DP authority. | git-commit-skill tests |
| receiving-code-review | review | Triage review feedback before applying changes. | Scope and execution guard remain in CLI checks. | low | Keep as guidance; no first-batch text migration. | review routing check |
| requesting-code-review | review | Request focused review after implementation or before merge. | Completion and DP guards remain in verification and workflow guard. | low | Keep as guidance; no first-batch text migration. | review routing check |
| spec-driven-development | requirements | Drive PRD to TSD to TVD to TED to VED workflow. | DP state machine and workflow guard live in CLI. | medium | Reviewed; DP catalog delegated to decision-points and dp commands. | task status and dp audit |
| subagent-driven-development | execution | Run implementer and reviewer agents from an approved TED. | workflow-guard, workflow-brief, and prompt builder own execution contracts. | medium | Keep command sequence; avoid source_hash internals beyond command references. | productization CLI tests |
| systematic-debugging | debugging | Diagnose bugs with reproduction and root-cause discipline. | Test failures and bugfix TDD are enforced by test-driven-development and validators. | low | Keep as guidance; no first-batch text migration. | debugging review |
| test-driven-development | verification | Enforce RED before GREEN and record VED evidence. | validate-tdd-evidence and artifact mode checks own formal evidence validation. | high | First-batch candidate; keep evidence format and command entry, avoid duplicating artifact-mode internals. | validate-tdd-evidence tests |
| using-coding-plugins | routing | Select workflow, skill, task status, and next command. | task status, workflow-guard, dp audit, and scope-check are CLI authorities. | high | First-batch migrated; DP catalog delegated to CLI while command entry remains. | scenario routing contract |
| using-git-worktrees | setup | Ensure execution happens in an isolated workspace when needed. | Git worktree state is verified by git commands and platform environment. | low | Keep operational checks; no first-batch text migration. | manual worktree review |
| verification-before-completion | verification | Verify outputs before claiming completion or fix. | DP-6, preflight, validate-tdd-evidence, and completion report checks are authorities. | high | First-batch candidate; keep verification command entry and remove duplicated completion gate internals where present. | verification review and preflight |
| writing-plans | planning | Create TED from approved PRD, TSD, and TVD. | workflow-state hash and workflow-guard own staleness and execute blocking. | high | First-batch candidate; keep source_hash command entry and avoid duplicating stale-state matrices. | workflow-state tests |
| writing-requirements | requirements | Write PRD requirements and stop at DP-1. | DP approval and task status own transition enforcement. | medium | Keep DP stop point; avoid expanding DP guard internals. | validate-spec |
| writing-skills | skill authoring | Create or edit skills and validate before deployment. | i18n surface, skill boundary, and ownership tests own machine checks. | medium | Keep skill authoring guidance; update after boundary test lands. | skill boundary and i18n tests |
| writing-technicals | technical design | Write TSD and map approved specs to technical decisions. | validate-technicals and document schema own technical doc validity. | medium | Keep validator entry; avoid duplicating schema internals. | validate-technicals |
| writing-test-cases | test design | Create TVD cases from approved PRD and TSD. | Document schema and task status own DP-3 transition enforcement. | medium | Keep testing design guidance; avoid duplicating DP guard internals. | document metadata tests |

## 第一批迁移候选

第一批已处理边界测试实际命中的 skill：`finishing-a-development-branch`、`git-commit`、`spec-driven-development` 和 `using-coding-plugins`。其余 `duplication_risk` 为 `high` 的 skill 已纳入后续分批审查；如果边界测试发现误伤合法命令入口，优先调整 allowlist 或检测模式，不删除必要 guard 入口。
