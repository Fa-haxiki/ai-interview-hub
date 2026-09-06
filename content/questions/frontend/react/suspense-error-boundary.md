---
title: "Suspense 和 Error Boundary 各管什么？数据失败为什么有时既不转圈也不报错？"
category: frontend
topic: react
section: 渲染机制
difficulty: medium
order: 4
tags: [Suspense, ErrorBoundary]
sources:
  - title: "Suspense - React"
    url: "https://zh-hans.react.dev/reference/react/Suspense"
    lang: zh
  - title: "Error Boundaries - React"
    url: "https://zh-hans.react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Suspense 接「还没准备好」的 Promise，Error Boundary 接渲染期抛错。** 数据库要把 pending 和 error 映射到这两条通道，否则会出现白屏或永久 fallback。

## 分工

`lazy()` 的代码块、`use` 读的 thenable，未完成时找到最近的 Suspense 显示 fallback。失败的 Promise 若没被 catch，应变成 error boundary。类组件的 `getDerivedStateFromError` / `componentDidCatch` 仍是官方捕获渲染错误的方式；函数组件要用包装或 react-error-boundary。

事件处理、异步回调里的 throw 不会进 Error Boundary，要自己 try/catch。SSR 的 boundary 和客户端对不齐会 hydration 出问题。

## 实践取舍

路由级一块大 Suspense 体验差，按区块拆。错误 UI 要带重试。面试别说「Suspense 就是 loading 组件」——它是协调未就绪子树的机制，和 Transition 一起用才能避免每次输入都闪 fallback。

## 可能的追问

- `use` 和 `useEffect` 请求差在哪？`use` 能在渲染中暂停；Effect 是提交后的副作用，要自己管竞态。
- 多个 Suspense 嵌套谁先亮？内层先就绪可以先亮，外层仍可等。
