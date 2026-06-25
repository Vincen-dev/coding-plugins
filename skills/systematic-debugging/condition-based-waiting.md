# 基于条件的等待

异步测试和自动化不要靠固定 sleep。固定时间等待会让测试慢、脆弱、在不同机器上随机失败。

## 原则

等待条件，而不是等待时间。

错误：

```typescript
await sleep(1000);
expect(result).toBeReady();
```

正确：

```typescript
await waitFor(() => expect(result).toBeReady());
```

或：

```typescript
await waitUntil(async () => {
  const state = await getState();
  return state.ready === true;
});
```

## 何时使用

- 测试偶发失败。
- race condition。
- UI、网络、队列、文件系统、后台任务。
- 日志中看到 “timeout”“not ready”“event not received”。

## 实现模式

```typescript
async function waitUntil(
  condition: () => Promise<boolean> | boolean,
  options = { timeoutMs: 5000, intervalMs: 50 }
) {
  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, options.intervalMs));
  }
  throw new Error('Timed out waiting for condition');
}
```

## 好的等待条件

- 直接表达需要的状态。
- 失败时能输出当前状态。
- 超时有限。
- 不依赖机器速度。

## 常见错误

- 增加 timeout 但不解决 race。
- 等“足够久”而不是等事件。
- 不输出当前状态，超时后无法诊断。
- 多个异步条件混在一起，无法知道哪一步未满足。

## 示例

完整 TypeScript 示例见 `condition-based-waiting-example.ts`。
