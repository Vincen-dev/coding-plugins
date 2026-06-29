# Technical Design Validator

## Task 1: Standalone validator structural checks

### TDD Evidence

- **Spec/Bug/AC:** REQ-001 / REQ-002 / ERR-001 / ERR-002 / ERR-003 / AC-001
- **RED test:** `skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED failure:** 测试因缺少 `validate_technical_design.py` 报 `ModuleNotFoundError: No module named 'validate_technical_design'`。
- **GREEN change:** 新增 `skills/writing-technical-design/scripts/validate_technical_design.py`，实现 technical 文件发现、frontmatter 列表解析、必需章节校验、MUST Spec ID 覆盖和 related metadata 路径校验。
- **GREEN command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **REFACTOR command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **Final verification:** `python3 skills/writing-technical-design/scripts/validate_technical_design.py docs/coding-plugins/features/plugin/spec-technical-quality-gates/technical/technical-design.md`，Technical design validation passed: 1 file(s)。

## Task 2: Generic mapping and stale warnings

### TDD Evidence

- **Spec/Bug/AC:** REQ-003 / REQ-004 / ERR-004 / ERR-005 / ERR-006 / AC-002 / AC-003
- **RED test:** `skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`
- **RED failure:** 同一 RED 测试批次在 validator 缺失时失败，覆盖泛化映射 warning、strict rejection、stale warning、strict stale rejection 和缺少 updated 时跳过 stale 的预期行为。
- **GREEN change:** validator 增加泛化映射短语检测和 spec.updated 晚于 technical.updated 的 stale 检测；普通模式记录 warning，`--strict` 模式将 warning 升级为 error。
- **GREEN command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **REFACTOR command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py`，9 tests OK。
- **Final verification:** `python3 skills/writing-technical-design/scripts/validate_technical_design.py --format json`，返回 ok=true、error_count=0、warning_count=61。

## Task 3: Preflight integration

### TDD Evidence

- **Spec/Bug/AC:** REQ-005 / AC-004
- **RED test:** `scripts/test_preflight.py::PreflightTests.test_build_commands_include_core_validation_steps` and `scripts/test_preflight.py::PreflightTests.test_preflight_uses_technical_design_validator_errors`
- **RED command:** `python3 -m unittest scripts.test_preflight.PreflightTests.test_build_commands_include_core_validation_steps` and `python3 -m unittest scripts.test_preflight.PreflightTests.test_preflight_uses_technical_design_validator_errors`
- **RED failure:** 第一个测试因验证命令中缺少 `test_validate_technical_design.py` 失败；第二个测试因 `preflight.check_technical_design_validator` 不存在报 AttributeError。
- **GREEN change:** `scripts/preflight.py` 增加 validator 动态加载和 `check_technical_design_validator(root)`，并把 validator 单测加入 `build_validation_commands()`。
- **GREEN command:** `python3 -m unittest scripts/test_preflight.py`，57 tests OK。
- **REFACTOR command:** `python3 -m unittest scripts/test_preflight.py`，57 tests OK。
- **Final verification:** `python3 -m unittest scripts/test_preflight.py`，57 tests OK。

## Task 4: Docs, evidence and final verification

### TDD Evidence

- **Spec/Bug/AC:** REQ-006 / AC-001 / AC-004
- **RED test:** `python3 scripts/preflight.py`
- **RED command:** `python3 -m unittest scripts/test_preflight.py`
- **RED failure:** 文档更新前，writing-technical-design 技能没有提示独立 validator 和 strict 审计命令。
- **GREEN change:** 更新 `skills/writing-technical-design/SKILL.md` 和 `docs/workflow-chain.md`，记录 validator 普通模式与 strict 模式用途。
- **GREEN command:** `python3 skills/spec-driven-development/scripts/validate_spec.py --strict docs/coding-plugins/features/plugin/technical-design-validator/specs/feature.md`，Spec validation passed。
- **REFACTOR command:** `python3 -m unittest skills/writing-technical-design/scripts/test_validate_technical_design.py && python3 -m unittest scripts/test_preflight.py`，validator 9 tests OK，preflight 57 tests OK。
- **Final verification:** `python3 scripts/preflight.py`，Preflight passed。
