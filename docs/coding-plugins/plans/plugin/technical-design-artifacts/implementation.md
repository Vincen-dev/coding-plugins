# 技术设计产物独立维护 Implementation Plan

> **给代理执行者：** REQUIRED SUB-SKILL: 使用 `coding-plugins:executing-plans` 或当前会话按检查点执行本计划。步骤使用 checkbox (`- [ ]`) 语法追踪。

**Goal:** 将技术设计作为独立产物层落地，并通过 preflight 维护引用链路。

**Architecture:** Spec 定义契约，Technical Design 定义工程方案，Plan 拆任务，Evidence 记录 TDD 证据。preflight 负责校验真实文件、索引和 Spec ID 追踪。

**Tech Stack:** Python 标准库、Markdown 文档、Codex/Claude skills。

**Spec Source:** `docs/coding-plugins/specs/plugin/technical-design-artifacts/feature.md`

**Technical Design Source:** `docs/coding-plugins/technical/plugin/technical-design-artifacts/technical-design.md`

## Technical Design Snapshot

本计划执行 technical design 中的四层链路：Spec -> Technical -> Plan -> Evidence。实现重点是新增 `writing-technical-design` skill、technical 索引、总索引 `Technical` 列，以及 preflight 引用校验。

## Spec Traceability

| Spec ID | Test file / command | Test name or assertion | TDD evidence file / field | Implementation task |
| --- | --- | --- | --- | --- |
| REQ-001 | `python3 -m unittest scripts/test_preflight.py` | `test_collect_technical_design_files_uses_default_docs_path` | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-002 | `python3 -m unittest scripts/test_preflight.py` | `test_technical_index_requires_design_paths` | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-003 | `python3 -m unittest scripts/test_preflight.py` | `test_artifact_index_requires_technical_paths` | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-004 | `python3 -m unittest tests.behavior.test_routing` | `test_using_entry_routes_development_intents_to_required_skills` | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 2 |
| REQ-005 | `python3 -m unittest scripts/test_preflight.py` | `test_plan_technical_design_source_check_rejects_missing_source` | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 2 |
| REQ-006 | `python3 -m unittest scripts/test_preflight.py` | technical preflight unit tests | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 1 |
| REQ-007 | `python3 -m unittest tests.behavior.test_routing` | `test_claude_reference_documents_explicit_namespace_for_each_skill` | `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md` / RED-GREEN-Final verification | Task 2 |

## Task 1: Technical document and preflight support

**Spec IDs:** REQ-001, REQ-002, REQ-003, REQ-006, ERR-001, ERR-002, ERR-003, ERR-004, ERR-005

**Files:**
- Create: `docs/coding-plugins/technical/INDEX.md`
- Create: `docs/coding-plugins/technical/plugin/technical-design-artifacts/technical-design.md`
- Modify: `docs/coding-plugins/INDEX.md`
- Modify: `scripts/preflight.py`
- Modify: `scripts/test_preflight.py`

- [x] **Step 1: Write failing tests from Spec IDs**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: FAIL because technical collection, index and reference checks do not exist.

- [x] **Step 2: Write minimal implementation after RED**

Add technical file collection, index coverage, Spec/Plan technical reference checks and technical Spec ID validation.

- [x] **Step 3: Run test to verify it passes**

Run: `python3 -m unittest scripts/test_preflight.py`
Expected: PASS.

## Task 2: Skill and workflow routing

**Spec IDs:** REQ-004, REQ-005, REQ-007, AC-002

**Files:**
- Create: `skills/writing-technical-design/SKILL.md`
- Create: `skills/writing-technical-design/agents/openai.yaml`
- Create: `skills/writing-technical-design/templates/technical-design.md`
- Modify: `skills/using-coding-plugins/SKILL.md`
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/using-coding-plugins/references/claude-tools.md`
- Modify: `tests/behavior/test_routing.py`

- [x] **Step 1: Write failing behavior test**

Run: `python3 -m unittest tests.behavior.test_routing`
Expected: FAIL because `writing-technical-design` is not routed.

- [x] **Step 2: Add skill and route it**

Add the skill, OpenAI metadata, template, entry routing and Claude namespace reference.

- [x] **Step 3: Run behavior test to verify it passes**

Run: `python3 -m unittest tests.behavior.test_routing`
Expected: PASS.

## Task 3: Workflow docs, evidence and final verification

**Spec IDs:** AC-001, AC-003

**Files:**
- Modify: `README.md`
- Modify: `docs/installation.md`
- Modify: `docs/workflow-chain.md`
- Create: `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md`

- [x] **Step 1: Update workflow documentation**

Document the Spec -> Technical -> Plan -> Evidence chain and default paths.

- [x] **Step 2: Record TDD Evidence**

Write `docs/coding-plugins/evidence/plugin/technical-design-artifacts/tdd-evidence.md`.

- [x] **Step 3: Run final verification**

Run: `python3 scripts/preflight.py`
Expected: PASS.
