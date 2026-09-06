---
title: "useLayoutEffect 和 useEffect 差在哪？量尺寸、防闪烁该用哪个？"
category: frontend
topic: react
section: Hooks
difficulty: medium
order: 3
tags: [useLayoutEffect, useEffect]
sources:
  - title: "useLayoutEffect - React"
    url: "https://zh-hans.react.dev/reference/react/useLayoutEffect"
    lang: zh
  - title: "useEffect - React"
    url: "https://zh-hans.react.dev/reference/react/useEffect"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**`useLayoutEffect` 在 DOM 更新后、浏览器绘制前同步跑；`useEffect` 在绘制后异步跑。** 要读布局并立刻改，避免用户看见中间态，用 Layout；订阅、请求、日志用 Effect，别挡首帧。

## 时机

Commit 改完 DOM → layout effects（含 cleanup）→ 浏览器画 → passive effects。Layout 里 `setState` 会再走一遍渲染才绘制，用户看不到闪。代价是它和强制同步布局一样能拖长 INP。

SSR 没有布局，`useLayoutEffect` 会警告。能用 `useEffect` 就用；tooltip 定位、textarea 高度随内容、滚动位置恢复，才上 Layout。或用 `useLayoutEffect` 的 polyfill 在服务端当 Effect。

## 实践取舍

不要「为了快」全换成 Layout。测量可以 `ResizeObserver` 放 Effect。面试和「读 offsetHeight 强制布局」是同一条时间线。

## 可能的追问

- 类组件的 `componentDidMount` 更像谁？更像 Layout：都在画之前完成（浏览器实现细节略有差别）。
- Strict Mode 双调用也作用于 Layout？是，cleanup 仍要写。
