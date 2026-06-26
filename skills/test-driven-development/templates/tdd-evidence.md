# <Capability> TDD Evidence

## Task <N>: <任务名称>

### TDD Evidence

- **Spec/Bug/AC:** <REQ-001、bug 复现链接或验收标准>
- **RED test:** `<tests/path/test_file.py::test_specific_behavior>`
- **RED command:** `<pytest tests/path/test_file.py::test_specific_behavior -v>`
- **RED failure:** <失败信息摘要，说明它因缺失行为失败，而不是导入、拼写或环境问题>
- **GREEN change:** <最小实现摘要>
- **GREEN command:** `<pytest tests/path/test_file.py::test_specific_behavior -v>`
- **REFACTOR command:** `<pytest tests/path/test_file.py -v>`
- **Final verification:** <最终相关测试、构建或校验命令和结果>

## Task <N>: <无法自动测试的任务名称>

### TDD Exception Record

- **Reason:** <为什么无法先写失败测试>
- **User approval:** <用户同意的原话或明确说明>
- **Alternative verification:** <替代验证命令、日志、截图或人工验收步骤>
- **Risk:** <剩余风险和后续补测试计划>
