---
title: "setState 是同步的吗？批处理和自动批处理改了什么？"
category: frontend
topic: react
section: 渲染机制
difficulty: medium
order: 3
tags: [setState, batching, 更新]
sources:
  - title: "Queueing a Series of State Updates - React"
    url: "https://zh-hans.react.dev/learn/queueing-a-series-of-state-updates"
    lang: zh
  - title: "Automatic batching - React 18"
    url: "https://zh-hans.react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`setState` 更新排队，读取的还是当前渲染的闭包值；React 18 起事件、timeout、原生 Promise 里的多次更新都会自动批成一次渲染。** 要基于最新值算下一次，必须 `setX(x => x + 1)`。

## 批处理

```ts
function onClick() {
  setN((n) => n + 1);
  setN((n) => n + 1); // 一次点击 +2，一次渲染
}
```

若写 `setN(n + 1)` 两次，两次都读到同一帧的 `n`，结果只 +1。18 之前，`setTimeout` 里两次 `setState` 会渲染两次；现在也会批。需要强制冲刷用 `flushSync`，几乎只留给和第三方 DOM 对读布局的集成。

类组件 `this.setState` 的回调和函数组件的 `useEffect` 才能看见提交后的值。不要在渲染期间 `setState` 造成循环，派生值直接算。

## 实践取舍

连续多次字段更新，合并成一个对象或一次函数更新，减少思考负担。面试手写「点三次为什么是 1」就是闭包 + 批处理。

## 可能的追问

- `useTransition` 的更新也批吗？批，而且可能被标成非紧急。
- 同一个事件里 setState 和 flushSync 混用？flushSync 会先提交一块，打断批，能测但别当常规。
