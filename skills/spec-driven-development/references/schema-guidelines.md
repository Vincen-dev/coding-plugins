# Schema Guidelines

Schema 规格必须让生产者和消费者对数据边界达成一致。

必须写清：

- 字段名、类型、必填性。
- 允许值、范围、格式、默认值。
- null、空字符串、空数组、缺失字段的语义。
- 至少一个 valid example。
- 关键 invalid examples 和预期错误。
- 兼容性：新增字段、重命名、废弃、迁移。

验证建议：

- JSON Schema、Zod、Pydantic、Protobuf 或项目既有 schema 工具。
- 对 valid example 做通过测试。
- 对 invalid examples 做失败测试。
