---
title: "useRef 和 useState 怎么选？改 ref 为什么不重新渲染？"
category: frontend
topic: react
section: Hooks
difficulty: easy
order: 4
tags: [useRef, useState]
sources:
  - title: "useRef - React"
    url: "https://zh-hans.react.dev/reference/react/useRef"
    lang: zh
  - title: "Referencing Values with Refs - React"
    url: "https://zh-hans.react.dev/learn/referencing-values-with-refs"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**要画到屏幕上的用 state，只想在渲染之间记住一个盒子用 ref。** 改 `ref.current` 立刻变、不触发渲染；state 是一次快照，改了会排队再渲。

## 两类 ref

DOM ref：`ref={el}` 让你 `focus()`、量尺寸。值 ref：定时器 id、最新 props、AbortController。后者是过期闭包的应急手段，不是第二条状态树。

```ts
const latest = useRef(value);
latest.current = value;
```

不要在渲染期间写 `ref.current =` 来「同步派生」，除非遵循官方那套非常窄的模式。渲染必须是纯的。初始化贵对象：`useRef(null)` 然后 `if (!ref.current) ref.current = create()`，或 `useState` 懒函数。

## 实践取舍

输入法组合、光标位置、拖拽起点用 ref。计数器、开关用 state。两个都存同一份数据一定会不一致。面试说「ref 是可变的实例字段」。

## 可能的追问

- `useRef(0)` 和 `createRef`？`createRef` 每次渲染新对象，函数组件里要用 `useRef` 保身份。
- 回调 ref 和对象 ref？回调能感知挂上/卸下，适合第三方图表 destroy。
