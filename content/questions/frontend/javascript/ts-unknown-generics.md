---
title: "TypeScript 里 any、unknown、never 怎么选？泛型约束一般怎么写？"
category: frontend
topic: javascript
section: 语言基础
difficulty: medium
order: 9
tags: [TypeScript, unknown, never, 泛型]
sources:
  - title: "unknown - TypeScript Handbook"
    url: "https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown"
    lang: en
  - title: "Generics - TypeScript Handbook"
    url: "https://www.typescriptlang.org/docs/handbook/2/generics.html"
    lang: en
createdAt: "2026-09-06"
---

一句话：**`any` 关闭检查，`unknown` 必须先收窄才能用，`never` 是不可达。** 外部输入（JSON、`event.target`）进门先当 `unknown`，再用类型守卫。泛型是「调用处决定类型」，约束写 `T extends { id: string }` 而不是到处 `any`。

## 三个底

`any` 会传染。`unknown` 和 `any` 一样能接万物，但读属性要 `typeof` / `in` / 自定义 pred。`never` 出现在穷尽检查：`switch` 的 default 里 `const _x: never = x`，多一个联合成员就会报错。

```ts
function first<T extends { id: string }>(items: T[]): T | undefined {
  return items[0];
}
```

`extends` 约束能力，`infer` 从条件类型里抽出一块。工具类型 `Pick` / `Omit` / `ReturnType` 面试要能说「怎么用」，不必手写完整实现，但能讲 `keyof` + 映射类型更好。

运行时没有泛型。`interface` 和 `type` 都能描述对象，联合/元组用 `type` 更顺；声明合并只有 interface。

## 实践取舍

禁止业务 `any`，应急用 `unknown` + 校验（Zod）。`as` 是在对编译器保证你比它清楚，连续断言是代码异味。

## 可能的追问

- `void` 和 `undefined` ？`void` 表示调用方不该用返回值；回调类型里 `void` 更宽松。
- `interface` 能表示联合吗？不能，要用 `type`。
