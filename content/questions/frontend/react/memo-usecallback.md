---
title: "useMemo、useCallback、memo 什么时候值得用？乱加为什么会更慢？"
category: frontend
topic: react
section: 状态管理与性能
difficulty: medium
order: 1
tags: [useMemo, useCallback, memo]
sources:
  - title: "React Compiler - React"
    url: "https://zh-hans.react.dev/learn/react-compiler"
    lang: zh
  - title: "useMemo - React"
    url: "https://zh-hans.react.dev/reference/react/useMemo"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**先量再加。** `memo` 跳过 props 浅比较相同的子树；`useCallback` / `useMemo` 是为了让传下去的引用稳定，好让 memo 生效，或避免昂贵计算。每次渲染都包一层小函数，比较成本可能高于重新渲染那个按钮。

## 何时有效

子组件很重（大列表、图表），且父组件高频 setState，子 props 其实没变——`memo` 有用。父仍 `onClick={() => ...}` 每次新函数，memo 等于没写，这时才配 `useCallback`。`useMemo` 留给 `O(n)` 以上的派生数据，或要保持引用给依赖数组。

React 19 的 Compiler 能自动插入等价记忆，新项目优先开编译器，而不是手写一片 `useMemo`。手写仍要会，因为编译器覆盖不了的地方和面试都会问。

## 实践取舍

状态往下沉、把列表项拆成 memo 组件、虚拟列表，往往比满屏 callback 有效。`context` 值不要每次渲染新建 `{user, setUser}` 对象，否则所有消费者爆渲——拆开或 memo 住 value。

## 可能的追问

- 浅比较漏了怎么办？props 里塞对象字面量，memo 永不命中。
- `useMemo` 能当派生状态的唯一来源吗？能，但别用它做副作用。
