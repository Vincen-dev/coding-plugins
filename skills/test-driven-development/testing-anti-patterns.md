# 测试反模式

这些模式会让测试看起来存在，但无法可靠证明行为。

## 1. 测试 mock 而不是测试代码

坏：

```typescript
const mock = jest.fn().mockResolvedValue('ok');
await service(mock);
expect(mock).toHaveBeenCalled();
```

这只证明 mock 被调用，不证明真实行为正确。

好：

```typescript
const result = await service(realInput);
expect(result.status).toBe('ok');
```

只有在真实依赖昂贵、不可控或外部时才 mock，并且仍要验证用户可见行为。

## 2. 只追覆盖率

覆盖率高不等于测试有效。没有断言、断言实现细节、或者只走 happy path 的测试都可能毫无价值。

## 3. 测试实现细节

坏：

```typescript
expect(privateCache.size).toBe(1);
```

好：

```typescript
expect(await lookup('id')).toEqual(expectedRecord);
```

测试外部契约，而不是内部结构。内部可重构，契约应稳定。

## 4. 过宽测试

一个测试同时验证解析、网络、缓存、渲染。失败时不知道哪里坏。拆成可诊断的小测试，并用少量集成测试覆盖关键路径。

## 5. 测试名模糊

坏：`test('works')`

好：`test('retries failed operations three times before succeeding')`

测试名应描述行为。

## 6. 没有先看失败

如果测试第一次运行就通过，你不知道它是否能抓住 bug。TDD 要求先看 RED，再看 GREEN。

## 7. 固定 sleep

坏：

```typescript
await sleep(1000);
```

好：等待明确条件或事件。见 `systematic-debugging/condition-based-waiting.md`。

## 8. 快照滥用

快照适合稳定结构，不适合替代语义断言。巨大快照很难 review，容易被盲目更新。

## 9. 测试共享状态

测试之间依赖顺序、共享数据库或全局变量，会导致污染和偶发失败。每个测试应独立设置和清理。

## 10. 只测 happy path

至少覆盖关键失败路径、边界值和权限/输入错误。bug 通常在边界发生。

## 检查清单

- 测试是否先失败？
- 失败原因是否正确？
- 是否验证真实行为？
- 是否有清楚断言？
- 是否独立可重复？
- 是否覆盖关键边界？
- 失败时是否容易定位？
