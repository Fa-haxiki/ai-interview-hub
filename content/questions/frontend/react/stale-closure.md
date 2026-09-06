---
title: "Hooks 里的过期闭包是怎么产生的？怎么修？"
category: frontend
topic: react
section: Hooks
difficulty: medium
order: 2
tags: [闭包, useRef, useEffect]
sources:
  - title: "A Complete Guide to useEffect - Dan Abramov"
    url: "https://overreacted.io/a-complete-guide-to-useeffect/"
    lang: en
  - title: "useRef - React"
    url: "https://zh-hans.react.dev/reference/react/useRef"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**每次渲染都是一次新的函数闭包，定时器和订阅若只创建一次，就会永远看见第一次的 props/state。** 修法是：把值放进依赖让 effect 重建，或用 ref 装「最新值」，或用函数式 `setState(s => s + 1)` 不读闭包。

## 典型现场

```ts
useEffect(() => {
  const id = setInterval(() => {
    console.log(count); // 若 deps 是 []，永远是 0
  }, 1000);
  return () => clearInterval(id);
}, []);
```

`count` 在第一次渲染被关上。事件监听、WebSocket、`setTimeout` 只绑一次时同样中招。这和 JS 闭包题是同一件事，只是 React 渲染频率把它放大了。

## 怎么修

- 依赖写 `[count]`，每次变都清掉重建 interval（简单，可能抖动）。
- `countRef.current = count`，interval 读 ref（适合高频回调）。
- 只关心累加时 `setCount((c) => c + 1)`。
- 事件处理用最新闭包：不必放进 effect 依赖，可以 ref 稳定包装一层。

Hooks 规则（只在顶层调用）保证两次渲染 hooks 顺序一致，和闭包是两件事，面试不要混着背。

## 可能的追问

- 为什么不推荐把 ref 当万能通道？它不触发渲染，滥用会让 UI 和数据不同步。
- `useEvent` / 编译器优化想解决什么？稳定身份的最新回调，减少「为了新闭包而重建订阅」。
