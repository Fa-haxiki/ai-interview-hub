---
title: "防抖和节流差在哪？输入搜索、按钮提交、滚动监听各用哪个？"
category: frontend
topic: javascript
section: 异步与事件循环
difficulty: medium
order: 3
tags: [debounce, throttle]
sources:
  - title: "debounce vs throttle - CSS-Tricks"
    url: "https://css-tricks.com/debouncing-throttling-explained-examples/"
    lang: en
  - title: "AbortSignal - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**防抖是「停下来才触发」，节流是「一段时间内最多一次」。** 搜索框用防抖，滚动/resize 用节流，提交按钮用「进行中加锁」而不是单纯节流。

## 实现要点

```ts
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last < ms) return;
    last = now;
    fn(...args);
  };
}
```

防抖要决定 leading / trailing：输入搜索只要 trailing；resize 有时两边都要。节流可用时间戳或 `setTimeout` 保证尾触发。React 里必须稳定函数引用，并在卸载时 `clearTimeout`。请求型防抖要配 `AbortController`，否则旧响应后到会覆盖新结果。

## 实践取舍

lodash 能用，但要会讲清语义。按钮防重复提交用 disabled + 请求锁，延迟 300ms 的 debounce 会让用户觉得点了没反应。

## 可能的追问

- requestAnimationFrame 算节流吗？按帧节流，适合跟绘制走的动画，不适合固定 200ms 的接口。
- 防抖 0ms 有意义吗？仍会推到下一轮宏任务，能合并同步连点。
