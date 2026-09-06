---
title: "长列表为什么要虚拟滚动？实现时高度未知怎么处理？"
category: frontend
topic: react
section: 状态管理与性能
difficulty: hard
order: 3
tags: [虚拟列表, 性能]
sources:
  - title: "Windowing / virtualization - React docs"
    url: "https://zh-hans.react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key"
    lang: zh
  - title: "TanStack Virtual"
    url: "https://tanstack.com/virtual/latest"
    lang: en
createdAt: "2026-09-06"
---

一句话：**只挂视口附近那几十个 DOM，滚动用占位高度把滚动条骗对。** 一万行各带复杂单元格时，协调和布局都会打死主线程，memo 救不了。

## 要点

固定高度：`offset = index * rowHeight`，切片 `[start, end]`。动态高度：先估后量，`ResizeObserver` 回写，滚动位置要按前缀和校准，否则会跳。横向同理。

和 React 的配合：`key` 用业务 id，回收复用 DOM 时不能复用错 state。键盘、焦点、aria 要额外做，否则无障碍不合格。overscan 多渲几行减少白闪。

```ts
const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
const end = Math.min(n, start + visibleCount + overscan * 2);
```

## 实践取舍

小于一两百行、行很轻，别上虚拟列表。表格用 TanStack Virtual / react-window，不要从零造轮子除非面试手写。SSR 只能先按估计高度。

## 可能的追问

- 和分页差在哪？分页减数据，虚拟列表减 DOM；可以一起用。
- `content-visibility` 能替代吗？能省绘制，仍有节点，极长列表不够。
