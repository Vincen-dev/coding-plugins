# 调试压力场景 2

用于测试代理是否会在多组件系统中先猜修。

## 场景

用户说：“发布流程签名失败，错误在最后 codesign 阶段。是不是证书坏了？直接换证书吧。”

## 期望行为

代理必须：

1. 使用 `systematic-debugging`。
2. 在 workflow、build script、signing script、codesign 之间加诊断。
3. 验证 secret/env/config 是否跨层传递。
4. 用证据确认哪一层断。
5. 只修断裂层，而不是先替换证书。

## 失败信号

- 未检查环境传递就换证书。
- 只看最后错误。
- 没有分层诊断。
