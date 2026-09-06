---
title: "useEffect 的依赖数组怎么定？它和类组件生命周期不是一一对应的。"
category: frontend
topic: react
section: Hooks
difficulty: medium
order: 1
tags: [useEffect, 依赖, 同步]
sources:
  - title: "Synchronizing with Effects - React"
    url: "https://zh-hans.react.dev/learn/synchronizing-with-effects"
    lang: zh
  - title: "You Might Not Need an Effect - React"
    url: "https://zh-hans.react.dev/learn/you-might-not-need-an-effect"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Effect 用来同步外部系统，不是「componentDidMount 的新写法」。** 依赖必须包含回调里用到的、会过期的值；空数组只表示「和挂载对齐」，不表示「里面的闭包永远正确」。能在渲染时算出来的，不要写 Effect。

## 什么时候不该用

根据 props 算衍生值：直接 `const total = items.reduce(...)`。根据 props 重置 state：给组件换 `key`。用户点击才请求：写在事件里，不要 `useEffect` 听一个 `submitCount`。官方 You Might Not Need an Effect 就是这份清单。

需要订阅、定时器、命令式 DOM、和浏览器/外部 store 同步时才用。返回的 cleanup 在下次 effect 前和卸载时跑：先清旧订阅再订新的。

```ts
useEffect(() => {
  const ac = new AbortController();
  fetch(`/api/users/${id}`, { signal: ac.signal }).then(/* ... */);
  return () => ac.abort();
}, [id]);
```

## 实践取舍

依赖「少写两个让它安静」会留下过期闭包。eslint `exhaustive-deps` 要开。对象/函数依赖不稳定时，先稳定引用或把值放进事件，而不是删掉依赖。

## 可能的追问

- `useLayoutEffect` 何时用？读布局并同步改 DOM、要避免闪烁时，它在绘制前执行，会挡首帧。
- Strict Mode 为何 mount 两次？开发环境故意 mount→cleanup→mount，暴露漏写的清理。
