---
title: "自定义 Hook 解决什么问题？和普通函数、HOC 怎么选？"
category: frontend
topic: react
section: Hooks
difficulty: medium
order: 5
tags: [自定义Hook, HOC, 复用]
sources:
  - title: "Reusing Logic with Custom Hooks - React"
    url: "https://zh-hans.react.dev/learn/reusing-logic-with-custom-hooks"
    lang: zh
  - title: "Rules of Hooks - React"
    url: "https://zh-hans.react.dev/reference/rules/rules-of-hooks"
    lang: zh
createdAt: "2026-09-06"
---

一句话：**Hook 复用的是有状态的逻辑，不是 UI。** 普通函数复用纯计算；要订阅、state、effect 才 `useXxx`。HOC / render props 是 Hooks 之前的复用，现在会套一层又一层 Wrapper。

## 规则

自定义 Hook 必须顶层调用其它 Hook，名字 `use` 开头，好让 lint 检查。每个调用组件各有一份状态，`useOnline()` 不是单例。要共享同一份数据，Hook 内部读 Context 或 store，而不是把 state 定义在模块顶然后谁用谁改。

返回值保持稳定形状。返回函数用 `useCallback` 仅当调用方会放进依赖。测试时可以直接调 Hook（`renderHook`），不必挂完整页面。

和 HOC：HOC 能注入 props、包裹权限，但会丢静态属性、难推类型、出现 `withA(withB(Comp))`。优先 Hook + 组合组件。

## 实践取舍

`useFetch` 这类容易做成半吊子数据层，不如 React Query。面试能拆一个 `useDebouncedValue` 比空谈「逻辑复用」好。

## 可能的追问

- 能在条件里调自定义 Hook 吗？不能，和内置 Hook 同一条规则。
- Hook 里能 `return null` 当提前返回吗？可以返回数据；不能少调后面的 Hook。
