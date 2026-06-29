# Spec 与 Technical 质量门禁

## Task 1: Technical template and section gates

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / REQ-003 / ERR-001 / ERR-002 / AC-001
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_technical_template_requires_spec_design_mapping_sections` and `scripts/test_preflight.py::PreflightTests.test_technical_design_requires_spec_design_mapping_sections`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 5 个新增测试因 preflight 缺少 `check_technical_template_required_sections`、`check_technical_design_required_sections`、`check_technical_design_must_spec_coverage`、`check_technical_design_related_metadata` 报 AttributeError。
- **GREEN change:** 在 `scripts/preflight.py` 增加 technical 模板和真实 technical 文档的必需章节校验，并更新 `skills/writing-technical-design/SKILL.md`、technical 模板和现有 technical 文档。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **Final verification:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。

## Task 2: MUST Spec ID reverse coverage

### TDD Evidence

- **Spec/Bug/AC:** REQ-004 / ERR-003 / AC-002
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_technical_design_must_cover_required_spec_ids`, `scripts/test_preflight.py::PreflightTests.test_technical_design_must_coverage_allows_explicit_exemptions`, and `scripts/test_preflight.py::PreflightTests.test_technical_design_coverage_uses_heading_lines_not_inline_mentions`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 新增覆盖测试最初因 preflight 尚未提供 MUST Spec ID 反向覆盖校验函数而报 AttributeError；回归测试随后暴露 `markdown_section()` 会命中正文内联反引号中的标题文本，导致覆盖 ID 为空。
- **GREEN change:** 在 `scripts/preflight.py` 从同 feature 的 approved spec 提取 MUST Spec ID，并要求这些 ID 出现在 `规格到设计映射` 或 `无需技术设计的规格` 章节中；同时把 section 定位改成行级 Markdown 标题匹配。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **Final verification:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。

## Task 3: Technical metadata chain

### TDD Evidence

- **Spec/Bug/AC:** REQ-005 / ERR-004 / AC-003
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_technical_metadata_requires_related_chain_paths`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 5 个新增测试因 preflight 尚未提供 technical related metadata 校验函数而报 AttributeError。
- **GREEN change:** 在 `scripts/preflight.py` 校验 technical frontmatter 中已存在的 spec、plan、evidence 产物链路，并要求引用路径真实存在。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **Final verification:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。

## Task 4: Docs, evidence and final verification

### TDD Evidence

- **Spec/Bug/AC:** REQ-006 / ERR-005 / AC-001 / AC-002 / AC-003
- **RED test:** `python3 scripts/preflight.py --write-index`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 新增 technical 质量门禁测试最初因缺少 preflight 函数失败；真实仓库覆盖检查随后暴露内联标题解析问题，已用回归测试固定。
- **GREEN change:** 更新 `docs/workflow-chain.md`、新增 feature-first 规格/technical/plan/evidence 文档，并刷新 `docs/coding-plugins/INDEX.md`。
- **GREEN command:** `python3 scripts/preflight.py --write-index`，Preflight passed。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py`，56 tests OK。
- **Final verification:** `python3 scripts/preflight.py`，Preflight passed。
