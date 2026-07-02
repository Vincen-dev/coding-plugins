# 导出配置规格

## 需求总览

| 需求点 | 标题 | 优先级 | 验证方式 |
| --- | --- | --- | --- |
| REQ-001 | 导出配置包含版本 | 必须 | 单元测试 `python3 -m pytest tests/test_export_config.py`。 |
| REQ-002 | 导出配置包含生成时间 | 应该 | 单元测试 `python3 -m pytest tests/test_export_config.py`。 |

## 导出配置包含版本（REQ-001）

### 需求描述

导出的配置结果必须包含非空 `version` 字段。

### 验证方式

- 验证类型：单元测试。
- 覆盖对象：导出配置 payload。

## 导出配置包含生成时间（REQ-002）

### 需求描述

导出的配置结果包含 `generatedAt` 字段。

### 验证方式

- 验证类型：单元测试。
- 覆盖对象：导出配置 payload。

## 错误和边界

| 编号 | 条件 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| ERR-001 | 导出配置缺少版本来源。 | 导出函数返回明确错误。 | 单元测试 `python3 -m pytest tests/test_export_config.py`。 |

## 追踪矩阵

| 规格 ID | 验证类型 | 验证证据 | 状态 |
| --- | --- | --- | --- |
| REQ-001 | 单元测试 | `python3 -m pytest tests/test_export_config.py` | 计划中 |
| REQ-002 | 单元测试 | `python3 -m pytest tests/test_export_config.py` | 计划中 |
| ERR-001 | 单元测试 | `python3 -m pytest tests/test_export_config.py` | 计划中 |
